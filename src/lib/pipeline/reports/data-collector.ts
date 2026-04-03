import Parser from "rss-parser";
import type { RawArticle, MarketSnapshot } from "../types";
import { ALL_SYMBOLS } from "./types";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "DawnMarket/1.0 (news aggregator)" },
});

const NEWS_FEEDS = [
  {
    id: "reuters-markets",
    name: "Reuters Markets",
    url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
  },
  {
    id: "cnbc-world",
    name: "CNBC World",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362",
  },
  {
    id: "investing-news",
    name: "Investing.com News",
    url: "https://www.investing.com/rss/news.rss",
  },
  {
    id: "mk-economy",
    name: "매일경제",
    url: "https://www.mk.co.kr/rss/30100041/",
  },
  {
    id: "hankyung-market",
    name: "한국경제 증권",
    url: "https://www.hankyung.com/feed/stock",
  },
  {
    id: "mk-industry",
    name: "매일경제 산업",
    url: "https://www.mk.co.kr/rss/30200030/",
  },
  {
    id: "hankyung-industry",
    name: "한국경제 산업",
    url: "https://www.hankyung.com/feed/industry",
  },
  {
    id: "reuters-energy",
    name: "Reuters Energy",
    url: "https://www.reutersagency.com/feed/?best-topics=energy&post_type=best",
  },
];

/**
 * Calculate the 24-hour data window for Korean market morning briefing.
 * Window: 07:30 KST previous day → 07:30 KST today
 */
export function getDataWindow(date: Date = new Date()): {
  start: string;
  end: string;
} {
  // KST is UTC+9
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(date.getTime() + kstOffset);

  // Today at 07:30 KST
  const endKST = new Date(kstNow);
  endKST.setUTCHours(7, 30, 0, 0);

  // Yesterday at 07:30 KST
  const startKST = new Date(endKST);
  startKST.setUTCDate(startKST.getUTCDate() - 1);

  // Convert back to UTC
  const start = new Date(startKST.getTime() - kstOffset);
  const end = new Date(endKST.getTime() - kstOffset);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function fetchFeed(feed: {
  id: string;
  name: string;
  url: string;
}): Promise<RawArticle[]> {
  try {
    const result = await parser.parseURL(feed.url);
    const now = new Date().toISOString();

    return (result.items || []).slice(0, 15).map((item) => ({
      sourceId: `${feed.id}:${item.guid || item.link || item.title}`,
      sourceName: feed.name,
      title: item.title || "Untitled",
      link: item.link || "",
      content:
        item.contentSnippet || item.content || item.summary || item.title || "",
      publishedAt: item.isoDate || item.pubDate || now,
      collectedAt: now,
    }));
  } catch (error) {
    console.error(`Failed to fetch feed ${feed.id}:`, error);
    return [];
  }
}

async function fetchSymbol(
  symbol: string,
  name: string
): Promise<MarketSnapshot | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "DawnMarket/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`Yahoo Finance ${symbol}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      name,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      collectedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error);
    return null;
  }
}

export interface CollectedData {
  articles: RawArticle[];
  marketData: MarketSnapshot[];
  dataWindowStart: string;
  dataWindowEnd: string;
  collectedAt: string;
  errors: string[];
}

/**
 * Collect all data needed for the 7 reports.
 * Fetches from all RSS feeds and all Yahoo Finance symbols.
 */
export async function collectAllData(): Promise<CollectedData> {
  const errors: string[] = [];
  const { start, end } = getDataWindow();

  // Fetch news feeds in parallel
  const feedResults = await Promise.allSettled(
    NEWS_FEEDS.map((feed) => fetchFeed(feed))
  );

  const articles: RawArticle[] = [];
  feedResults.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      errors.push(`Feed ${NEWS_FEEDS[i].id}: ${result.reason}`);
    }
  });

  // Filter articles within the data window
  const windowStart = new Date(start).getTime();
  const windowEnd = new Date(end).getTime();
  const windowedArticles = articles.filter((a) => {
    const pubTime = new Date(a.publishedAt).getTime();
    return pubTime >= windowStart && pubTime <= windowEnd;
  });

  // Fetch all market symbols in parallel (batched to avoid rate limiting)
  const marketData: MarketSnapshot[] = [];
  const batchSize = 5;
  for (let i = 0; i < ALL_SYMBOLS.length; i += batchSize) {
    const batch = ALL_SYMBOLS.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((s) => fetchSymbol(s.symbol, s.name))
    );
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        marketData.push(result.value);
      } else if (result.status === "rejected") {
        errors.push(`Symbol ${batch[idx].symbol}: ${result.reason}`);
      }
    });
  }

  return {
    articles: windowedArticles.length > 0 ? windowedArticles : articles, // fallback to all if window is empty
    marketData,
    dataWindowStart: start,
    dataWindowEnd: end,
    collectedAt: new Date().toISOString(),
    errors,
  };
}

/**
 * Filter market data by symbol group.
 */
export function filterMarketData(
  allData: MarketSnapshot[],
  symbols: { symbol: string; name: string }[]
): MarketSnapshot[] {
  const symbolSet = new Set(symbols.map((s) => s.symbol));
  return allData.filter((d) => symbolSet.has(d.symbol));
}
