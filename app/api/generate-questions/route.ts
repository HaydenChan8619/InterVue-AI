import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, resume } = await request.json();

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
            content: `You are an expert interview coach. Generate exactly 5 relevant interview questions based on the job description and candidate's resume. The questions should be challenging but fair, covering technical skills, behavioral aspects, and role-specific scenarios. Return only a JSON array of 5 questions as strings.`
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nResume:\n${resume}\n\nGenerate 5 interview questions for this role and candidate.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    const data = await response.json();
    const questionsText = data.choices[0].message.content;
    
    // Parse the JSON response to extract questions array
    let questions;
    try {
      questions = JSON.parse(questionsText);
    } catch (error) {
      // Fallback: extract questions from text if JSON parsing fails
      questions = [
        "Tell me about yourself and why you're interested in this role.",
        "Describe a challenging project you worked on and how you overcame obstacles.",
        "How do you handle working under pressure and tight deadlines?",
        "What specific skills and experience make you a good fit for this position?",
        "Where do you see yourself in 5 years and how does this role align with your goals?"
      ];
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}