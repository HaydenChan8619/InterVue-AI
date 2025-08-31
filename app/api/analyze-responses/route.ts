import { NextRequest, NextResponse } from 'next/server';

function getOutputTextFromResponse(data: any): string | undefined {
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
  try { return JSON.parse(s); } catch (e) {  }

  const jsonRegex = /({[\s\S]*})/;
  const match = s.match(jsonRegex);
  if (match) {
    const candidate = match[1];
    try { return JSON.parse(candidate); } catch (e) {  }
  }

  const fencedJson = /```json\s*([\s\S]*?)```/i;
  const fmatch = s.match(fencedJson);
  if (fmatch) {
    try { return JSON.parse(fmatch[1]); } catch (e) {  }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { questions, responses, jobDescription, resume } = await request.json();

    const analysisPrompt = `
You are an expert interview coach and hiring manager. Analyze the following interview responses and provide detailed feedback.

Job Description:
${jobDescription}

Candidate Resume:
${resume}

Interview Questions and Responses:
${questions.map((q: string, i: number) => `
Question ${i + 1}: ${q}
Response: ${responses[i] || 'No response provided'}
`).join('\n')}

For each question-response pair, provide:
1. A letter grade (A, B, C, D, or F)
2. A brief summary of what the candidate said
3. 2-3 specific pros (strengths) of the response
4. 2-3 specific cons (areas for improvement)

Also provide an overall letter grade for the entire interview.

IMPORTANT: Return ONLY valid JSON, with no additional text, commentary, or markdown fences. The JSON format must be:
{
  "overallGrade": "B",
  "results": [
    {
      "question": "question text",
      "response": "original response text",
      "grade": "B",
      "summary": "Brief summary of the response",
      "pros": ["strength 1", "strength 2"],
      "cons": ["improvement area 1", "improvement area 2"]
    }
  ]
}
    `;

    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        input: analysisPrompt,
        text: { verbosity: 'high' },
        max_output_tokens: 10000
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI API error:', data);
      return NextResponse.json(
        { error: 'Failed to analyze responses', details: data },
        { status: openaiRes.status }
      );
    }

    const outputText = getOutputTextFromResponse(data);

    let analysisResult;
    if (outputText) {
      try {
        analysisResult = JSON.parse(outputText);
      } catch (parseError) {
        const extracted = tryExtractJsonFromString(outputText);
        if (extracted) {
          analysisResult = extracted;
        } else {
          console.warn('JSON parse failed, fallback will be used. parseError:', parseError);
          console.warn('Raw outputText:', outputText);
        }
      }
    } else {
      console.warn('No output text found in OpenAI response. Full response logged for debugging.');
      console.warn(JSON.stringify(data, null, 2));
    }

    if (!analysisResult) {
      analysisResult = {
        overallGrade: 'F',
        results: questions.map((question: string, index: number) => ({
          question,
          response: responses[index] || 'No response provided',
          grade: 'F',
          summary: 'Response analysis unavailable',
          pros: ['Attempted to answer the question'],
          cons: ['Could provide more specific details', 'Could better structure the response']
        }))
      };
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Unexpected server error:', error);
    return NextResponse.json(
      { error: 'Unexpected server error', details: String(error) },
      { status: 500 }
    );
  }
}