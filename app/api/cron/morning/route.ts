import { NextRequest, NextResponse } from "next/server";
import { getTopStockPicks, formatMorningBrief } from "@/lib/alerts/alertEngine";

// Runs Mon–Fri at 9:15 AM IST (03:45 UTC)
// Requires env vars: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, CRON_SECRET
export async function GET(req: NextRequest) {
  // Verify Vercel cron authorization
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      { error: "TELEGRAM_TOKEN and TELEGRAM_CHAT_ID env vars not set in Vercel" },
      { status: 500 }
    );
  }

  try {
    // Top 3 AI picks (no exclusions — server doesn't know user's virtual portfolio)
    const picks = getTopStockPicks([]);
    const message = formatMorningBrief(picks, 0, []);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
      return NextResponse.json({ error: data.description }, { status: 400 });
    }

    return NextResponse.json({ ok: true, messageId: data.result?.message_id });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send morning brief" }, { status: 500 });
  }
}
