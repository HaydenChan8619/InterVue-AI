import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';

// Initialize the client
const client = new textToSpeech.TextToSpeechClient({
    credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_PROJECT_ID,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: 'en-US', name:'en-US-Chirp3-HD-Achird'},
      audioConfig: { audioEncoding: 'MP3' },
    });

    // Convert audioContent (Uint8Array) to base64
    const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');

    return NextResponse.json({
        audioContent: `data:audio/mp3;base64,${audioBase64}`,
        });

  } catch (error: any) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
