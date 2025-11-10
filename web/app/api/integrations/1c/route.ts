import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const order = await req.json();
  const resp = await fetch(process.env.ONEC_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${process.env.ONEC_LOGIN}:${process.env.ONEC_PASSWORD}`).toString('base64')
    },
    body: JSON.stringify(order)
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
