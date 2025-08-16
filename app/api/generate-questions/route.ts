import { NextRequest, NextResponse } from 'next/server';

type OpenAIResponse = any;

function extractTextFromResponse(data: OpenAIResponse): string {
  if (!data) return '';

  if (typeof data.output_text === 'string') return data.output_text;
  if (Array.isArray(data.output) && data.output.length) {
    for (const item of data.output) {
      if (item?.content) {
        if (Array.isArray(item.content)) {
          const texts = item.content
            .map((c: any) => (typeof c.text === 'string' ? c.text : typeof c === 'string' ? c : ''))
            .filter(Boolean);
          if (texts.length) return texts.join('\n');
        }
        if (typeof item.content === 'string') return item.content;
      }
      if (typeof item === 'string') return item;
    }
  }

  if (Array.isArray(data.choices) && data.choices.length) {
    const first = data.choices[0];
    if (first?.message?.content) {
      if (typeof first.message.content === 'string') return first.message.content;
      if (Array.isArray(first.message.content)) {
        return first.message.content.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('\n');
      }
    }
  }

  const strings: string[] = [];
  (function recurse(obj: any) {
    if (typeof obj === 'string') {
      strings.push(obj);
      return;
    }
    if (Array.isArray(obj)) {
      for (const el of obj) recurse(el);
      return;
    }
    if (obj && typeof obj === 'object') {
      for (const k of Object.keys(obj)) recurse(obj[k]);
    }
  })(data);

  return strings.join('\n');
}

/*export async function POST(request: NextRequest) {
  try {
    const { jobDescription, resume } = await request.json();

    const systemPrompt = `You are an expert interview coach.
Return ONLY a valid JSON array of exactly 5 strings (no keys, no commentary, nothing else).
Example:
["Question 1", "Question 2", "..."]
Each string should be a complete question. Generate fair questions covering behavioral questions, technical understanding, and role-specific scenarios. 
Note for the technical understanding questions, do not ask actual coding questions, just ask conceptual questions. For example: "What is the difference between SQL and noSQL?"
Note for behavioural questions, keep in mind the level of experience the role and the resume calls for, don't ask the applicant industry verteran situational questions if the applicant is a high school / university student
Also, don't base your questions strictly on the job descriptions. Interviewers often ask questions about the bigger picture, such as what the company does, or how the applicant handles different dynamics in the workplace
Specifically, please ensure your first question is an introductionary question. If they have something relevant from their resume, ask them to elaborate on that specific aspect. If not, then start with a generic "Why us" question.
The second and third question should be scenario questions about scenarios that the person could face at the job, for example how to deal with deadlines, speaking up during meetings, sharing ideas, etc. regular work scenarios. No need to get technical here as those questions come later
The fourth and fifth question should be catered towards the position, including asking questions regarding domain knowledge relevant to the job.
Ensure the questions are concise, maintain the word count between 20 - 30.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        input: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nResume:\n${resume}`
          }
        ],
        text: { verbosity: 'low' },
        max_output_tokens: 5000
      }),
    });*/

    export async function POST(request: NextRequest) {
      console.log("=== TEST POST handler hit ===");
      return NextResponse.json({ message: "POST works!" }, { status: 200 });
    }

    /*const data = await response.json();
    console.log('API raw result:', data);

    const text = extractTextFromResponse(data).trim();
    if (!text) {
      console.error('No text found in model response', { data });
      return NextResponse.json({ error: 'Empty model output' }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch (e2) {
          console.error('Failed to parse extracted JSON array', { text, error: e2 });
          return NextResponse.json({ error: 'Failed to parse JSON from model output', raw: text }, { status: 500 });
        }
      } else {
        console.error('No JSON array found in model response text', { text });
        return NextResponse.json({ error: 'Model output was not JSON', raw: text }, { status: 500 });
      }
    }

    if (!Array.isArray(parsed)) {
      console.error('Parsed value is not an array', { parsed });
      return NextResponse.json({ error: 'Parsed model output is not an array', raw: parsed }, { status: 500 });
    }

    const questions = parsed.map((q: any) => (typeof q === 'string' ? q.trim() : String(q))).filter(Boolean);
    questions.forEach((q, i) => console.log(`${i + 1}. ${q}`));

    if (questions.length > 5) {
      console.warn('Model returned more than 5 questions; trimming to 5.', { count: questions.length });
      questions.splice(5);
    }
    if (questions.length < 5) {
      console.error('Model returned fewer than 5 questions', { count: questions.length, questions });
      return NextResponse.json({ error: 'Model returned fewer than 5 questions', raw: questions }, { status: 500 });
    }

    return new NextResponse(JSON.stringify({ questions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}*/