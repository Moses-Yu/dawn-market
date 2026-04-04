import type { MetadataRoute } from "next";
import { getReportSetDates } from "@/lib/pipeline/reports";

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
