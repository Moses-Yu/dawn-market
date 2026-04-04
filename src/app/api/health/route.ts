import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * System health check endpoint. Checks:
 * - App server status
 * - Supabase DB connectivity
 * - Environment variable presence
 *
 * Returns 200 if healthy, 503 if any critical check fails.
 */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: "ok" | "fail"; ms?: number; error?: string }> = {};

  // 1. Supabase DB connectivity
  try {
    const dbStart = Date.now();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.from("reports").select("id").limit(1);
    if (error) throw error;
    checks.database = { status: "ok", ms: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 2. Required env vars
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "ANTHROPIC_API_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  checks.environment = missingEnvVars.length === 0
    ? { status: "ok" }
    : { status: "fail", error: `Missing: ${missingEnvVars.join(", ")}` };

  // 3. Overall
  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime?.() ?? null,
      responseMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
