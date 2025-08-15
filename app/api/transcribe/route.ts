import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const transcriptionFormData = new FormData();
    transcriptionFormData.append("file", audioFile);
    transcriptionFormData.append("model", "whisper-v3-turbo");
    transcriptionFormData.append("prompt", "I was like, you know what I mean, kind of, um, ah, huh, and so...");

    const FIREWORKS_URL =
      "https://audio-turbo.us-virginia-1.direct.fireworks.ai/v1/audio/transcriptions";

    const res = await fetch(FIREWORKS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
      },
      body: transcriptionFormData,
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Fireworks transcription failed:", res.status, body);
      return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 502 });
    }

    const data = await res.json();
    // Fireworks returns the transcription text as `text` in the JSON response
    console.log("Transcribed text:", data?.text ?? "<no text returned>");
    return NextResponse.json({ text: data.text });
  } catch (err) {
    console.error("Error transcribing audio:", err);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}