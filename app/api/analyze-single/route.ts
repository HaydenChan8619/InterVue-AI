import { NextRequest, NextResponse } from 'next/server';

// Note: no crypto import anymore

type Analysis = {
  question: string;
  response: string;
  grade: string;
  summary: string;
  pros: string[];
  cons: string[];
};

// Simple in-memory per-process cache to avoid duplicate work for same clientRunId or same payload.
// NOTE: This is only per-server-process (warm instance). It's still useful for dedupe.
// Attach to globalThis to persist across hot-reloads in dev.
const GLOBAL_CACHE_KEY = '__ANALYZE_SINGLE_CACHE_v1' as const;
const analysisCache: Map<string, Analysis> = (globalThis as any)[GLOBAL_CACHE_KEY] ?? ((globalThis as any)[GLOBAL_CACHE_KEY] = new Map());

/* --- robust helpers copied/adapted from your previous code --- */
function getOutputTextFromResponse(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data.output_text === 'string') return data.output_text;

  if (Array.isArray(data.output)) {
    for (const outItem of data.output) {
      if (Array.isArray(outItem.content)) {
        for (const c of outItem.content) {
          if (typeof c.text === 'string') return c.text;
          if (c.type === 'output_text' && typeof c.text === 'string') return c.text;
        }
      }
      if (typeof outItem.text === 'string') return outItem.text;
    }
  }

  if (Array.isArray(data.results) && typeof data.results[0]?.text === 'string') {
    return data.results[0].text;
  }
  if (typeof data.text === 'string') return data.text;

  return undefined;
}

function tryExtractJsonFromString(s: string): any | null {
  if (!s || typeof s !== 'string') return null;
  try { return JSON.parse(s); } catch (e) { /* ignore */ }

  // Try to find the largest {...} block
  const jsonRegex = /({[\s\S]*})/;
  const match = s.match(jsonRegex);
  if (match) {
    const candidate = match[1];
    try { return JSON.parse(candidate); } catch { /* ignore */ }
  }

  // fenced json
  const fencedJson = /```json\s*([\s\S]*?)```/i;
  const fmatch = s.match(fencedJson);
  if (fmatch) {
    try { return JSON.parse(fmatch[1]); } catch { /* ignore */ }
  }

  return null;
}

async function callOpenAIAnalysis(prompt: string, maxTokens = 800): Promise<any> {
  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-nano',
      input: prompt,
      max_output_tokens: maxTokens,
    }),
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    // include returned data for debugging in server logs (not returned to client)
    console.error('OpenAI /responses error', resp.status, data);
    throw new Error(`OpenAI API error: ${resp.status}`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { question, response: answer, jobDescription, resume, clientRunId } = body ?? {};

    if (!question || typeof answer === 'undefined') {
      return NextResponse.json({ error: 'Missing question or response' }, { status: 400 });
    }

    // Build a simple cache key: prefer clientRunId if provided, else plain payload-based key.
    // This removes the crypto hash and uses readable keys instead.
    //const key = clientRunId ? `clientRun:${clientRunId}` : `payload:${question}||${String(answer)}`;
    const snippet = (s: string) => s.slice(0, 200); // keep keys bounded
    const key = clientRunId
      ? `clientRun:${clientRunId}::q:${snippet(question)}::a:${snippet(String(answer))}`
      : `payload:${question}||${String(answer)}`;

    // quick cache hit
    if (analysisCache.has(key)) {
      return NextResponse.json(analysisCache.get(key));
    }

    // Prepare a focused prompt that requests JSON-only output
    const analysisPrompt = `
You are an expert interview coach and hiring manager. Analyze a single interview question and the candidate's response.

Job Description:
${jobDescription ?? 'N/A'}

Candidate Resume:
${resume ?? 'N/A'}

Question:
${question}

Candidate Response:
${answer}

For this single question, return ONLY valid JSON and nothing else, with the exact shape:
{
  "question": "....",
  "response": "....",
  "grade": "A|B|C|D|F",
  "summary": "one- or two-sentence summary",
  "pros": ["...","..."],
  "cons": ["...","..."]
}

Keep summary concise (1-2 sentences). Provide 2 pros and 2 cons if reasonable.
    `;

    // Call OpenAI
    const openaiData = await callOpenAIAnalysis(analysisPrompt, 10000);

    // Extract text and attempt to parse JSON
    const outputText = getOutputTextFromResponse(openaiData);
    let analysis: Analysis | null = null;

    if (outputText) {
      try {
        analysis = JSON.parse(outputText);
      } catch (e) {
        const extracted = tryExtractJsonFromString(outputText);
        if (extracted) analysis = extracted;
        else {
          console.warn('Failed to parse JSON from outputText. outputText sample:', outputText.slice?.(0, 1000));
        }
      }
    } else {
      console.warn('No output_text found in OpenAI response. Full response logged for debug.');
      console.warn(JSON.stringify(openaiData, null, 2));
    }

    // If parsing failed produce a safe fallback but still attempt best-effort mapping
    if (!analysis) {
      // try to build something from the raw response if possible
      // fallback: grade C and minimal pros/cons
      analysis = {
        question,
        response: answer,
        grade: 'C',
        summary: 'Analysis not available (parsing failed).',
        pros: ['Attempted to answer the question'],
        cons: ['Analysis could not be parsed'],
      };
    } else {
      // Ensure the object has the expected fields and types
      analysis = {
        question: String(analysis.question ?? question),
        response: String(analysis.response ?? answer),
        grade: String((analysis.grade ?? 'C')).toUpperCase().slice(0, 1),
        summary: String(analysis.summary ?? ''),
        pros: Array.isArray(analysis.pros) ? analysis.pros.map(String) : [],
        cons: Array.isArray(analysis.cons) ? analysis.cons.map(String) : [],
      };
    }

    // Cache result (in-memory per-process)
    try {
      analysisCache.set(key, analysis);
      // Keep cache bounded: remove older entries if map grows too large
      const MAX_CACHE = 200;
      if (analysisCache.size > MAX_CACHE) {
        // simple eviction: drop first inserted keys until size acceptable
        const it = analysisCache.keys();
        while (analysisCache.size > MAX_CACHE) {
          const k = it.next().value;
          if (k === undefined) break;
          analysisCache.delete(k);
        }
      }
    } catch (e) {
      console.warn('Failed to write analysisCache', e);
    }

    return NextResponse.json(analysis);
  } catch (err: any) {
    console.error('analyze-single route error:', err?.stack ?? err);
    const fallback = {
      question: (err?.question as string) ?? '',
      response: (err?.response as string) ?? '',
      grade: 'C',
      summary: 'Server error while analyzing question.',
      pros: [],
      cons: ['Server error'],
    };
    return NextResponse.json({ error: 'server_error', details: String(err), fallback }, { status: 500 });
  }
}
