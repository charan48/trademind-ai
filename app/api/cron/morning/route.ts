import { NextRequest, NextResponse } from "next/server";
import { getTopStockPicks, formatMorningBrief } from "@/lib/alerts/alertEngine";
import { fetchLiveQuotesServer, fetchAllTechnicalsServer } from "@/lib/market/serverFetch";

// Runs Mon–Fri at 9:15 AM IST (03:45 UTC)
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token  = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "TELEGRAM_TOKEN and TELEGRAM_CHAT_ID env vars not set" }, { status: 500 });
  }

  try {
    // Fetch live data in parallel
    const [liveQuotes, liveTech] = await Promise.all([
      fetchLiveQuotesServer(),
      fetchAllTechnicalsServer(),
    ]);

    const picks   = getTopStockPicks([], liveQuotes, liveTech);
    const message = formatMorningBrief(picks, 0, []);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: true }),
    });

    const data = await res.json();
    if (!data.ok) return NextResponse.json({ error: data.description }, { status: 400 });

    return NextResponse.json({ ok: true, messageId: data.result?.message_id, liveSymbols: Object.keys(liveQuotes).length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
