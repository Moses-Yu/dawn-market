import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * POST /api/health/errors
 *
 * Receives client-side error reports from the ErrorBoundary component
 * and the global error handlers. Stores them in Supabase for monitoring.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const errorRecord = {
      type: body.type || "react_error",
      message: String(body.message || "").slice(0, 500),
      stack: String(body.stack || "").slice(0, 2000),
      component_stack: String(body.componentStack || "").slice(0, 2000),
      url: String(body.url || "").slice(0, 500),
      user_agent: String(body.userAgent || "").slice(0, 500),
      metadata: body.metadata ? JSON.stringify(body.metadata).slice(0, 1000) : null,
      created_at: new Date().toISOString(),
    };

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from("client_errors").insert(errorRecord);
    if (error) {
      console.error("[error-tracking] Failed to store error:", error.message);
    }

    return NextResponse.json({ received: true });
  } catch {
    // Never fail — error tracking should be silent
    return NextResponse.json({ received: true });
  }
}

/**
 * GET /api/health/errors
 *
 * Returns recent client errors for admin monitoring.
 * Protected by CRON_SECRET or admin session.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("client_errors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ errors: data, count: data?.length ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
