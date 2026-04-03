import { createClient } from "@supabase/supabase-js";
import type {
  RawArticle,
  MarketSnapshot,
  ArticleSummary,
  MorningBriefing,
} from "./types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

export async function storeArticles(articles: RawArticle[]): Promise<number> {
  if (articles.length === 0) return 0;
  const supabase = getServiceClient();

  const rows = articles.map((a) => ({
    source_id: a.sourceId,
    source_name: a.sourceName,
    title: a.title,
    link: a.link,
    content: a.content,
    published_at: a.publishedAt,
    collected_at: a.collectedAt,
  }));

  const { data, error } = await supabase
    .from("raw_articles")
    .upsert(rows, { onConflict: "source_id" })
    .select("id");

  if (error) throw new Error(`storeArticles: ${error.message}`);
  return data?.length ?? 0;
}

export async function storeMarketSnapshots(
  snapshots: MarketSnapshot[]
): Promise<number> {
  if (snapshots.length === 0) return 0;
  const supabase = getServiceClient();

  const rows = snapshots.map((s) => ({
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    change: s.change,
    change_percent: s.changePercent,
    collected_at: s.collectedAt,
  }));

  const { data, error } = await supabase
    .from("market_snapshots")
    .insert(rows)
    .select("id");

  if (error) throw new Error(`storeMarketSnapshots: ${error.message}`);
  return data?.length ?? 0;
}

export async function storeSummaries(
  summaries: ArticleSummary[]
): Promise<number> {
  if (summaries.length === 0) return 0;
  const supabase = getServiceClient();

  const rows = summaries.map((s) => ({
    article_source_id: s.articleSourceId,
    title: s.title,
    summary_ko: s.summaryKo,
    category: s.category,
    severity: s.severity,
    sentiment: s.sentiment,
    sector_impact: s.sectorImpact,
    key_takeaway: s.keyTakeaway,
  }));

  const { data, error } = await supabase
    .from("article_summaries")
    .upsert(rows, { onConflict: "article_source_id" })
    .select("id");

  if (error) throw new Error(`storeSummaries: ${error.message}`);
  return data?.length ?? 0;
}

export async function storeBriefing(
  briefing: MorningBriefing
): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("morning_briefings")
    .insert({
      date: briefing.date,
      generated_at: briefing.generatedAt,
      market_overview: briefing.marketOverview,
      top_stories: briefing.topStories,
      sector_analysis: briefing.sectorAnalysis,
      action_items: briefing.actionItems,
    })
    .select("id")
    .single();

  if (error) throw new Error(`storeBriefing: ${error.message}`);
  return data.id;
}

export async function getLatestBriefing(): Promise<MorningBriefing | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("morning_briefings")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    date: data.date,
    generatedAt: data.generated_at,
    marketOverview: data.market_overview,
    topStories: data.top_stories,
    sectorAnalysis: data.sector_analysis,
    actionItems: data.action_items,
  };
}

export async function getRecentArticles(
  hours: number = 12
): Promise<RawArticle[]> {
  const supabase = getServiceClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("raw_articles")
    .select("*")
    .gte("collected_at", since)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`getRecentArticles: ${error.message}`);

  return (data || []).map((row) => ({
    sourceId: row.source_id,
    sourceName: row.source_name,
    title: row.title,
    link: row.link,
    content: row.content,
    publishedAt: row.published_at,
    collectedAt: row.collected_at,
  }));
}

export async function getRecentMarketData(): Promise<MarketSnapshot[]> {
  const supabase = getServiceClient();
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("market_snapshots")
    .select("*")
    .gte("collected_at", since)
    .order("collected_at", { ascending: false });

  if (error) throw new Error(`getRecentMarketData: ${error.message}`);

  // Deduplicate by symbol, keeping most recent
  const seen = new Set<string>();
  return (data || [])
    .filter((row) => {
      if (seen.has(row.symbol)) return false;
      seen.add(row.symbol);
      return true;
    })
    .map((row) => ({
      symbol: row.symbol,
      name: row.name,
      price: row.price,
      change: row.change,
      changePercent: row.change_percent,
      collectedAt: row.collected_at,
    }));
}
