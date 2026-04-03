export type Severity = "긴급" | "주의" | "참고";
export type Category = "semiconductor" | "geopolitics" | "market" | "general";
export type Sentiment = "bullish" | "bearish" | "neutral";

export interface RawArticle {
  sourceId: string;
  sourceName: string;
  title: string;
  link: string;
  content: string;
  publishedAt: string;
  collectedAt: string;
}

export interface MarketSnapshot {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  collectedAt: string;
}

export interface ArticleSummary {
  articleSourceId: string;
  title: string;
  summaryKo: string;
  category: Category;
  severity: Severity;
  sentiment: Sentiment;
  sectorImpact: string[];
  keyTakeaway: string;
}

export interface MorningBriefing {
  date: string;
  generatedAt: string;
  marketOverview: {
    summary: string;
    keyIndices: MarketSnapshot[];
  };
  topStories: BriefingStory[];
  sectorAnalysis: {
    sector: string;
    outlook: string;
    sentiment: Sentiment;
  }[];
  actionItems: string[];
}

export interface BriefingStory {
  title: string;
  summary: string;
  category: Category;
  severity: Severity;
  sentiment: Sentiment;
  sources: string[];
}

export interface CollectionResult {
  articles: RawArticle[];
  marketData: MarketSnapshot[];
  collectedAt: string;
  errors: string[];
}

export interface SummarizationResult {
  summaries: ArticleSummary[];
  processedAt: string;
  errors: string[];
}
