import type { MarketSnapshot, RawArticle, ArticleSummary } from "../types";

export type ReportType =
  | "us-market"
  | "semiconductor"
  | "shipbuilding-defense"
  | "ai-infra"
  | "secondary-battery"
  | "bio-healthcare"
  | "finance"
  | "geopolitical"
  | "currency"
  | "asian-premarket"
  | "technical"
  | "dawn-briefing";

export const REPORT_ORDER: ReportType[] = [
  "us-market",
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "bio-healthcare",
  "finance",
  "geopolitical",
  "currency",
  "asian-premarket",
  "technical",
  "dawn-briefing",
];

export const REPORT_TITLES: Record<ReportType, string> = {
  "us-market": "미국/글로벌 시장 마감 리포트",
  semiconductor: "반도체 섹터 인텔리전스",
  "shipbuilding-defense": "조선/방산 섹터 인텔리전스",
  "ai-infra": "AI 인프라 섹터 인텔리전스",
  "secondary-battery": "2차전지 섹터 인텔리전스",
  "bio-healthcare": "바이오/헬스케어 섹터 인텔리전스",
  finance: "금융/은행 섹터 인텔리전스",
  geopolitical: "지정학 & 거시경제 리포트",
  currency: "환율 & 채권 리포트",
  "asian-premarket": "아시아 프리마켓 리포트",
  technical: "기술적 분석 & 센티먼트 리포트",
  "dawn-briefing": "새벽시장 종합 브리핑",
};

export interface Report {
  reportNumber: number;
  reportType: ReportType;
  title: string;
  date: string;
  dataWindowStart: string; // ISO string, 07:30 KST previous day
  dataWindowEnd: string; // ISO string, 07:30 KST today
  content: ReportContent;
  generatedAt: string;
  modelUsed: string;
  tokensUsed: number;
}

export interface ReportContent {
  headline: string;
  sections: ReportSection[];
  prediction: MarketPrediction;
  keyTakeaways: string[];
}

export interface ReportSection {
  title: string;
  body: string;
  dataPoints?: DataPoint[];
}

export interface DataPoint {
  label: string;
  value: string;
  change?: string;
  sentiment?: "bullish" | "bearish" | "neutral";
}

export interface MarketPrediction {
  direction: "up" | "down" | "sideways";
  confidence: "high" | "medium" | "low";
  summary: string;
  factors: string[];
}

export interface ReportSet {
  date: string;
  dataWindowStart: string;
  dataWindowEnd: string;
  reports: Report[];
  generatedAt: string;
}

// Data passed to each report generator
export interface ReportInput {
  date: string;
  dataWindowStart: string;
  dataWindowEnd: string;
  marketData: MarketSnapshot[];
  articles: RawArticle[];
  summaries: ArticleSummary[];
  previousReports: Report[]; // Reports generated earlier in the sequence
}

// Symbol groups for different report types
export const US_MARKET_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "ES=F", name: "S&P 500 선물" },
  { symbol: "NQ=F", name: "NASDAQ 선물" },
  { symbol: "^VIX", name: "VIX 공포지수" },
];

export const SEMICONDUCTOR_SYMBOLS = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSM", name: "TSMC" },
  { symbol: "ASML", name: "ASML" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "INTC", name: "Intel" },
  { symbol: "AMAT", name: "Applied Materials" },
  { symbol: "005930.KS", name: "삼성전자" },
  { symbol: "000660.KS", name: "SK하이닉스" },
];

export const CURRENCY_SYMBOLS = [
  { symbol: "USDKRW=X", name: "달러/원" },
  { symbol: "USDJPY=X", name: "달러/엔" },
  { symbol: "EURUSD=X", name: "유로/달러" },
  { symbol: "^TNX", name: "미국 10년물 국채" },
  { symbol: "^VIX", name: "VIX 공포지수" },
];

export const SHIPBUILDING_DEFENSE_SYMBOLS = [
  { symbol: "329180.KS", name: "HD현대중공업" },
  { symbol: "009540.KS", name: "HD한국조선해양" },
  { symbol: "042660.KS", name: "한화오션" },
  { symbol: "012450.KS", name: "한화에어로스페이스" },
  { symbol: "LMT", name: "Lockheed Martin" },
  { symbol: "RTX", name: "RTX (Raytheon)" },
  { symbol: "NOC", name: "Northrop Grumman" },
  { symbol: "GD", name: "General Dynamics" },
];

export const AI_INFRA_SYMBOLS = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "MRVL", name: "Marvell Technology" },
  { symbol: "035420.KS", name: "NAVER" },
  { symbol: "035720.KS", name: "카카오" },
];

export const SECONDARY_BATTERY_SYMBOLS = [
  { symbol: "373220.KS", name: "LG에너지솔루션" },
  { symbol: "006400.KS", name: "삼성SDI" },
  { symbol: "096770.KS", name: "SK이노베이션" },
  { symbol: "247540.KS", name: "에코프로비엠" },
  { symbol: "086520.KS", name: "에코프로" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "CATL", name: "CATL (300750.SZ)" },
  { symbol: "ALB", name: "Albemarle" },
];

export const BIO_HEALTHCARE_SYMBOLS = [
  { symbol: "207940.KS", name: "삼성바이오로직스" },
  { symbol: "068270.KS", name: "셀트리온" },
  { symbol: "326030.KS", name: "SK바이오팜" },
  { symbol: "145020.KS", name: "휴젤" },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "PFE", name: "Pfizer" },
  { symbol: "LLY", name: "Eli Lilly" },
  { symbol: "NVO", name: "Novo Nordisk" },
];

export const FINANCE_SYMBOLS = [
  { symbol: "105560.KS", name: "KB금융" },
  { symbol: "055550.KS", name: "신한지주" },
  { symbol: "086790.KS", name: "하나금융지주" },
  { symbol: "316140.KS", name: "우리금융지주" },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "GS", name: "Goldman Sachs" },
  { symbol: "^TNX", name: "미국 10년물 국채" },
  { symbol: "USDKRW=X", name: "달러/원" },
];

export const ASIAN_SYMBOLS = [
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "^HSI", name: "Hang Seng" },
  { symbol: "000300.SS", name: "CSI 300" },
];

export const COMMODITY_SYMBOLS = [
  { symbol: "CL=F", name: "WTI 원유" },
  { symbol: "GC=F", name: "금" },
  { symbol: "HG=F", name: "구리" },
];

/**
 * 원자재 → 영향받는 한국 섹터/종목 매핑
 * 브리핑 프롬프트에서 자동 매핑 컨텍스트로 사용
 */
export const COMMODITY_KR_IMPACT: Record<
  string,
  { sectors: string[]; stocks: string[] }
> = {
  "CL=F": {
    sectors: ["정유/화학", "항공", "해운"],
    stocks: [
      "SK이노베이션(096770)",
      "S-Oil(010950)",
      "대한항공(003490)",
      "HMM(011200)",
    ],
  },
  "GC=F": {
    sectors: ["안전자산", "귀금속/광업"],
    stocks: [
      "한국금거래소(Korea Gold Exchange)",
      "고려아연(010130)",
      "풍산(103140)",
    ],
  },
  "HG=F": {
    sectors: ["조선/건설", "전선/케이블", "제조"],
    stocks: [
      "LS(006260)",
      "LS전선(대한전선 009540 아님, 비상장)",
      "HD현대중공업(329180)",
      "포스코홀딩스(005490)",
    ],
  },
};

// All symbols combined (deduplicated)
export const ALL_SYMBOLS = [
  ...US_MARKET_SYMBOLS,
  ...SEMICONDUCTOR_SYMBOLS,
  ...SHIPBUILDING_DEFENSE_SYMBOLS,
  ...AI_INFRA_SYMBOLS,
  ...SECONDARY_BATTERY_SYMBOLS,
  ...BIO_HEALTHCARE_SYMBOLS,
  ...FINANCE_SYMBOLS,
  ...CURRENCY_SYMBOLS,
  ...ASIAN_SYMBOLS,
  ...COMMODITY_SYMBOLS,
].filter(
  (s, i, arr) => arr.findIndex((x) => x.symbol === s.symbol) === i
);
