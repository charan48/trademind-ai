import { NextRequest, NextResponse } from "next/server";
import { getBuySignals, getSellSignals, formatBuyAlert, formatSellAlert } from "@/lib/alerts/alertEngine";
import { PORTFOLIO_HOLDINGS } from "@/lib/data/mockData";
import { fetchLiveQuotesServer, fetchAllTechnicalsServer } from "@/lib/market/serverFetch";

// Runs Mon–Fri every hour 9:00–15:00 IST (cron-job.org triggers hourly)
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token  = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Env vars not set" }, { status: 500 });
  }

  async function sendMsg(text: string) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  }

  try {
    const [liveQuotes, liveTech] = await Promise.all([
      fetchLiveQuotesServer(),
      fetchAllTechnicalsServer(),
    ]);

    let sent = 0;

    const sellSignals = getSellSignals(PORTFOLIO_HOLDINGS, liveQuotes, liveTech);
    for (const s of sellSignals) {
      await sendMsg(formatSellAlert(s));
      sent++;
    }

    const heldSymbols = PORTFOLIO_HOLDINGS.map((h) => h.symbol);
    const buySignals = getBuySignals(heldSymbols, liveQuotes, liveTech).filter((b) => b.confidence === "HIGH");
    for (const b of buySignals) {
      await sendMsg(formatBuyAlert(b));
      sent++;
    }

    return NextResponse.json({ ok: true, sent, liveSymbols: Object.keys(liveQuotes).length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
