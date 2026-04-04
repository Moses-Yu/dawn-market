import { createClient } from "@supabase/supabase-js";
import type { Severity, Category, Sentiment } from "./types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export interface Alert {
  id?: string;
  title: string;
  body: string;
  severity: Severity;
  category: Category;
  sentiment: Sentiment;
  sourceArticleIds: string[];
  pushed: boolean;
  pushedAt?: string;
  createdAt?: string;
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(
  limit: number = 20
): Promise<Alert[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    severity: row.severity,
    category: row.category,
    sentiment: row.sentiment,
    sourceArticleIds: row.source_article_ids ?? [],
    pushed: row.pushed,
    pushedAt: row.pushed_at,
    createdAt: row.created_at,
  }));
}
