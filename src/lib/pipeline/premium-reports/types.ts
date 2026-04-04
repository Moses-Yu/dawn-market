import type { ReportContent, ReportType } from "../reports/types";

export type PremiumReportPeriod = "weekly" | "monthly";

export type PremiumSector =
  | "semiconductor"
  | "shipbuilding-defense"
  | "ai-infra"
  | "secondary-battery"
  | "market-overview"
  | "geopolitical"
  | "all-sectors";

/** Maps premium sectors to daily report types used as source data */
export const SECTOR_TO_REPORT_TYPES: Record<PremiumSector, ReportType[]> = {
  semiconductor: ["semiconductor"],
  "shipbuilding-defense": ["shipbuilding-defense"],
  "ai-infra": ["ai-infra"],
  "secondary-battery": ["secondary-battery"],
  "market-overview": ["us-market", "asian-premarket", "currency", "technical"],
  geopolitical: ["geopolitical"],
  "all-sectors": [
    "us-market",
    "semiconductor",
    "shipbuilding-defense",
    "ai-infra",
    "secondary-battery",
    "geopolitical",
    "currency",
    "asian-premarket",
    "technical",
    "dawn-briefing",
  ],
};

export const SECTOR_TITLES: Record<PremiumSector, string> = {
  semiconductor: "반도체 섹터 주간/월간 인텔리전스",
  "shipbuilding-defense": "조선/방산 섹터 주간/월간 인텔리전스",
  "ai-infra": "AI 인프라 섹터 주간/월간 인텔리전스",
  "secondary-battery": "2차전지 섹터 주간/월간 인텔리전스",
  "market-overview": "시장 종합 주간/월간 리포트",
  geopolitical: "지정학 & 거시경제 주간/월간 리포트",
  "all-sectors": "전체 섹터 종합 리포트",
};

/** Suggested prices for single-report purchases (KRW) */
export const SECTOR_PRICES: Record<PremiumSector, number> = {
  semiconductor: 5900,
  "shipbuilding-defense": 5900,
  "ai-infra": 5900,
  "secondary-battery": 5900,
  "market-overview": 7900,
  geopolitical: 3900,
  "all-sectors": 9900,
};

export interface PremiumReport {
  id: string;
  reportPeriod: PremiumReportPeriod;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  sector: PremiumSector;
  title: string;
  summary: string | null;
  content: PremiumReportContent;
  priceKrw: number;
  modelUsed: string;
  tokensUsed: number;
  createdAt: string;
}

export interface PremiumReportContent {
  headline: string;
  executiveSummary: string;
  sections: PremiumReportSection[];
  weeklyTrends: TrendItem[];
  outlook: MarketOutlook;
  keyTakeaways: string[];
}

export interface PremiumReportSection {
  title: string;
  body: string;
  dataPoints?: { label: string; value: string; change?: string }[];
  charts?: ChartData[];
}

export interface TrendItem {
  label: string;
  direction: "up" | "down" | "sideways";
  detail: string;
}

export interface MarketOutlook {
  shortTerm: string; // 1-2 weeks
  mediumTerm: string; // 1-3 months
  risks: string[];
  opportunities: string[];
}

export interface ChartData {
  type: "line" | "bar";
  title: string;
  labels: string[];
  values: number[];
}

export interface PremiumReportInput {
  period: PremiumReportPeriod;
  periodStart: string;
  periodEnd: string;
  sector: PremiumSector;
  /** Daily reports from the period to synthesize */
  dailyReports: ReportContent[];
  dailyDates: string[];
}

export interface ReportPurchase {
  id: string;
  userId: string;
  premiumReportId: string;
  amountKrw: number;
  tossPaymentKey: string | null;
  purchasedAt: string;
}
