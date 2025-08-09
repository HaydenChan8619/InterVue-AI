import { NextRequest, NextResponse } from 'next/server';

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

Return the analysis in the following JSON format:
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Provide detailed, constructive feedback on interview performance.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze responses');
    }

    const data = await response.json();
    let analysisResult;
    
    try {
      analysisResult = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      // Fallback analysis if JSON parsing fails
      analysisResult = {
        overallGrade: 'C',
        results: questions.map((question: string, index: number) => ({
          question,
          response: responses[index] || 'No response provided',
          grade: 'C',
          summary: 'Response analysis unavailable',
          pros: ['Attempted to answer the question'],
          cons: ['Could provide more specific details', 'Could better structure the response']
        }))
      };
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing responses:', error);
    return NextResponse.json(
      { error: 'Failed to analyze responses' },
      { status: 500 }
    );
  }
}