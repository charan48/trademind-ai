import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, chatId, message } = await req.json();

    if (!token || !chatId || !message) {
      return NextResponse.json({ error: "token, chatId, message required" }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description ?? "Telegram API error" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, messageId: data.result?.message_id });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper to fetch chatId from bot (used during setup)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 400 });
    }

    // Extract most recent chat ID from updates
    const updates = data.result ?? [];
    const latest = updates[updates.length - 1];
    const chatId = latest?.message?.chat?.id
      ?? latest?.channel_post?.chat?.id
      ?? null;

    return NextResponse.json({ chatId, updates: updates.length });
  } catch {
    return NextResponse.json({ error: "Failed to reach Telegram" }, { status: 500 });
  }
}
