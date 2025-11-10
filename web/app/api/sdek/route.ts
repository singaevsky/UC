import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Демо: на реальном проекте подключайте API СДЭК с токеном и считайте тариф
  return NextResponse.json({ price: 300, days: 2 });
}
