import type { MetadataRoute } from "next";
import { getReportSetDates } from "@/lib/pipeline/reports";
import { createClient } from "@/lib/supabase/server";
import { SEED_TERMS, termToSlug, type GlossaryTerm } from "@/lib/glossary/terms";
import type { Category } from "@/lib/pipeline/types";
import type { Difficulty } from "@/lib/glossary/terms";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dawn-market.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/briefing`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/briefing/reports`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/briefing/archive`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/sectors`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/glossary`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // Add individual glossary term pages
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("glossary_terms")
      .select("term_ko, updated_at")
      .order("term_ko");

    const terms: { termKo: string; updatedAt: string | null }[] =
      data && data.length > 0
        ? data.map((r) => ({ termKo: r.term_ko, updatedAt: r.updated_at }))
        : SEED_TERMS.map((t) => ({ termKo: t.termKo, updatedAt: null }));

    for (const t of terms) {
      entries.push({
        url: `${SITE_URL}/glossary/${encodeURIComponent(termToSlug(t.termKo))}`,
        lastModified: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch {
    // DB may not be available during build
  }

  // Add report set dates (briefing + reports pages)
  try {
    const reportDates = await getReportSetDates(90);
    for (const rd of reportDates) {
      entries.push({
        url: `${SITE_URL}/briefing?date=${rd.date}`,
        lastModified: new Date(rd.date + "T07:30:00+09:00"),
        changeFrequency: "never",
        priority: 0.5,
      });
      entries.push({
        url: `${SITE_URL}/briefing/reports?date=${rd.date}`,
        lastModified: new Date(rd.date + "T07:30:00+09:00"),
        changeFrequency: "never",
        priority: 0.5,
      });
    }
  } catch {
    // DB may not be available during build
  }

  return entries;
}
