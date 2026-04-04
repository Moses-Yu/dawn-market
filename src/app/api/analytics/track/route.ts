import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface TrackEvent {
  event_name: string;
  event_category?: string;
  page_path?: string;
  referrer?: string;
  properties?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, events } = body as {
      session_id?: string;
      events?: TrackEvent[];
    };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events" }, { status: 400 });
    }

    // Cap batch size
    const batch = events.slice(0, 50);
    const userAgent = request.headers.get("user-agent") || undefined;

    const rows = batch.map((evt) => ({
      event_name: evt.event_name,
      event_category: evt.event_category || "general",
      session_id: session_id || null,
      page_path: evt.page_path || null,
      referrer: evt.referrer || null,
      properties: evt.properties || {},
      user_agent: userAgent,
    }));

    const supabase = getServiceClient();
    const { error } = await supabase.from("analytics_events").insert(rows);

    if (error) {
      console.error("Analytics insert error:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
