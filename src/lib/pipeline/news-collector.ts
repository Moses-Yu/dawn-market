import Parser from "rss-parser";
import type { RawArticle, MarketSnapshot, CollectionResult } from "./types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "DawnMarket/1.0 (news aggregator)",
  },
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
];

const MARKET_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "005930.KS", name: "삼성전자" },
  { symbol: "000660.KS", name: "SK하이닉스" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSM", name: "TSMC" },
];

async function fetchFeed(feed: {
  id: string;
  name: string;
  url: string;
}): Promise<RawArticle[]> {
  try {
    const result = await parser.parseURL(feed.url);
    const now = new Date().toISOString();

    return (result.items || []).slice(0, 10).map((item) => ({
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

async function fetchMarketData(): Promise<MarketSnapshot[]> {
  const now = new Date().toISOString();
  const snapshots: MarketSnapshot[] = [];

  for (const { symbol, name } of MARKET_SYMBOLS) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "DawnMarket/1.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.error(`Yahoo Finance ${symbol}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta) continue;

      const price = meta.regularMarketPrice ?? 0;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = price - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

      snapshots.push({
        symbol,
        name,
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        collectedAt: now,
      });
    } catch (error) {
      console.error(`Failed to fetch market data for ${symbol}:`, error);
    }
  }

  return snapshots;
}

export async function collectNews(): Promise<CollectionResult> {
  const errors: string[] = [];
  const now = new Date().toISOString();

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

  let marketData: MarketSnapshot[] = [];
  try {
    marketData = await fetchMarketData();
  } catch (error) {
    errors.push(`Market data: ${error}`);
  }

  return {
    articles,
    marketData,
    collectedAt: now,
    errors,
  };
}
