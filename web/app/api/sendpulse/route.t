import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, subject, text } = await req.json();
  // Демо-заглушка (в реальности используйте SendPulse API)
  console.log('SendPulse email', { email, subject, text });
  return NextResponse.json({ ok: true });
}
