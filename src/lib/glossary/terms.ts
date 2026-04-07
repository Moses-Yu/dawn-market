import type { Category } from "@/lib/pipeline/types";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface GlossaryTerm {
  id: string;
  termKo: string;
  termEn: string | null;
  definitionKo: string;
  category: Category;
  difficulty: Difficulty;
  relatedTerms: string[];
  exampleKo: string | null;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const CATEGORY_LABELS: Record<Category, string> = {
  semiconductor: "반도체",
  "shipbuilding-defense": "조선/방산",
  "ai-infra": "AI 인프라",
  "secondary-battery": "2차전지",
  "bio-healthcare": "바이오/헬스케어",
  finance: "금융/은행",
  geopolitics: "지정학",
  market: "시장",
  general: "일반",
};

export { DIFFICULTY_LABELS, CATEGORY_LABELS };

/** Convert a Korean term name to a URL-safe slug */
export function termToSlug(termKo: string): string {
  return termKo
    .replace(/\s*\(.*?\)\s*/g, "") // Strip parenthetical content e.g. "(KOSPI)"
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/** Find a term by its slug (computed from termKo) */
export function findTermBySlug(
  terms: GlossaryTerm[],
  slug: string
): GlossaryTerm | undefined {
  const decoded = decodeURIComponent(slug);
  return terms.find((t) => termToSlug(t.termKo) === decoded);
}

// Static seed data — will be replaced by Supabase query once migration 007 lands
export const SEED_TERMS: GlossaryTerm[] = [
  // === 시장 (Market) — 초급 ===
  {
    id: "1",
    termKo: "코스피 (KOSPI)",
    termEn: "Korea Composite Stock Price Index",
    definitionKo:
      "한국거래소에 상장된 대형 기업들의 주가를 종합한 지수입니다. 한국 주식시장의 전체 흐름을 보여주는 대표 지표로, 삼성전자·SK하이닉스 등 대형주 비중이 큽니다.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["코스닥", "시가총액", "지수"],
    exampleKo: "오늘 코스피가 2% 상승하며 2,800선을 회복했습니다.",
  },
  {
    id: "2",
    termKo: "코스닥 (KOSDAQ)",
    termEn: "Korea Securities Dealers Automated Quotation",
    definitionKo:
      "주로 중소·벤처 기업이 상장된 주식시장입니다. 코스피보다 변동성이 크고, 기술·바이오 기업이 많습니다. 초보 투자자는 코스닥 종목의 높은 변동성에 주의해야 합니다.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["코스피", "벤처기업", "변동성"],
    exampleKo: "코스닥 기술주가 급등하며 지수가 900선을 돌파했습니다.",
  },
  {
    id: "3",
    termKo: "시가총액",
    termEn: "Market Capitalization",
    definitionKo:
      "기업의 전체 가치를 나타내는 지표로, 주가 × 발행 주식 수로 계산합니다. 시가총액이 클수록 대형주, 작을수록 소형주로 분류합니다.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["대형주", "소형주", "코스피"],
    exampleKo:
      "삼성전자의 시가총액은 약 400조 원으로 한국 증시 1위입니다.",
  },
  {
    id: "4",
    termKo: "PER (주가수익비율)",
    termEn: "Price-to-Earnings Ratio",
    definitionKo:
      "주가를 주당순이익(EPS)으로 나눈 값입니다. PER이 낮으면 이익 대비 주가가 저평가, 높으면 고평가되었다고 봅니다. 다만 업종별로 평균 PER이 다르므로 같은 업종 내에서 비교해야 합니다.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["PBR", "EPS", "밸류에이션"],
    exampleKo:
      "이 종목의 PER이 8배로 업종 평균(15배) 대비 저평가 상태입니다.",
  },
  {
    id: "5",
    termKo: "공매도",
    termEn: "Short Selling",
    definitionKo:
      "주식을 빌려서 먼저 팔고, 나중에 더 싼 가격에 사서 갚는 투자 방법입니다. 주가 하락에 베팅하는 것으로, 주가가 오르면 손실이 무한대가 될 수 있어 위험합니다.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["대차거래", "숏스퀴즈", "변동성"],
    exampleKo:
      "외국인의 대규모 공매도로 반도체주가 급락했습니다.",
  },
  {
    id: "6",
    termKo: "변동성",
    termEn: "Volatility",
    definitionKo:
      "주가가 얼마나 크게 오르내리는지를 나타내는 지표입니다. 변동성이 크면 단기간에 큰 수익 또는 큰 손실이 발생할 수 있어 초보 투자자에게 위험합니다.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["VIX", "리스크", "공매도"],
    exampleKo: "지정학 리스크로 시장 변동성이 급격히 확대되고 있습니다.",
  },

  // === 반도체 (Semiconductor) ===
  {
    id: "7",
    termKo: "HBM (고대역폭메모리)",
    termEn: "High Bandwidth Memory",
    definitionKo:
      "여러 층의 DRAM 칩을 수직으로 쌓아 데이터를 빠르게 처리하는 차세대 메모리입니다. AI 학습에 필수적이며, SK하이닉스가 세계 1위 업체입니다.",
    category: "semiconductor",
    difficulty: "intermediate",
    relatedTerms: ["DRAM", "GPU", "AI 가속기"],
    exampleKo:
      "엔비디아 H200에 SK하이닉스 HBM3E가 독점 공급되며 주가가 급등했습니다.",
  },
  {
    id: "8",
    termKo: "파운드리",
    termEn: "Foundry",
    definitionKo:
      "반도체 설계는 하지 않고 위탁 생산만 전문으로 하는 사업입니다. TSMC가 세계 1위이며, 삼성전자가 2위 파운드리 업체입니다.",
    category: "semiconductor",
    difficulty: "beginner",
    relatedTerms: ["팹리스", "TSMC", "EUV"],
    exampleKo:
      "삼성전자 파운드리 수율 개선 소식에 시장이 긍정적으로 반응했습니다.",
  },
  {
    id: "9",
    termKo: "EUV (극자외선 노광)",
    termEn: "Extreme Ultraviolet Lithography",
    definitionKo:
      "반도체 회로를 매우 미세하게 그릴 수 있는 최첨단 장비 기술입니다. ASML이 독점 생산하며, 3나노 이하 공정에 필수적입니다.",
    category: "semiconductor",
    difficulty: "advanced",
    relatedTerms: ["ASML", "파운드리", "나노 공정"],
    exampleKo: "EUV 장비 수출 규제로 중국 반도체 산업에 타격이 예상됩니다.",
  },

  // === 지정학 (Geopolitics) ===
  {
    id: "10",
    termKo: "지정학 리스크",
    termEn: "Geopolitical Risk",
    definitionKo:
      "국가 간 정치·군사적 갈등이 금융 시장에 미치는 위험입니다. 전쟁, 무역 분쟁, 제재 등이 해당하며, 주가 급락과 환율 변동의 주요 원인입니다.",
    category: "geopolitics",
    difficulty: "beginner",
    relatedTerms: ["안전자산", "환율", "원유"],
    exampleKo:
      "미국-이란 긴장 고조로 지정학 리스크가 커지며 코스피가 2% 하락했습니다.",
  },
  {
    id: "11",
    termKo: "안전자산",
    termEn: "Safe Haven Asset",
    definitionKo:
      "시장 불안 시 투자자들이 자금을 옮기는 비교적 안전한 자산입니다. 금, 미국 국채, 일본 엔화, 스위스 프랑 등이 대표적입니다.",
    category: "geopolitics",
    difficulty: "beginner",
    relatedTerms: ["금", "미국 국채", "지정학 리스크"],
    exampleKo:
      "전쟁 우려에 안전자산인 금 가격이 온스당 3,000달러를 돌파했습니다.",
  },
  {
    id: "12",
    termKo: "관세",
    termEn: "Tariff",
    definitionKo:
      "수입 물품에 부과하는 세금으로, 무역 전쟁의 핵심 수단입니다. 관세가 오르면 수입 가격이 상승해 물가와 기업 원가에 영향을 줍니다.",
    category: "geopolitics",
    difficulty: "beginner",
    relatedTerms: ["무역전쟁", "공급망", "환율"],
    exampleKo:
      "미국의 중국산 반도체 관세 인상으로 글로벌 IT 공급망이 흔들리고 있습니다.",
  },

  // === 조선/방산 (Shipbuilding-Defense) ===
  {
    id: "13",
    termKo: "수주잔고",
    termEn: "Order Backlog",
    definitionKo:
      "아직 생산·납품하지 않은 주문 물량을 금액으로 나타낸 것입니다. 수주잔고가 많을수록 향후 매출이 안정적이라는 뜻입니다. 조선업의 핵심 지표입니다.",
    category: "shipbuilding-defense",
    difficulty: "intermediate",
    relatedTerms: ["신규 수주", "건조량", "클라크슨 지수"],
    exampleKo:
      "HD한국조선해양의 수주잔고가 역대 최대인 60조 원을 돌파했습니다.",
  },
  {
    id: "14",
    termKo: "LNG 운반선",
    termEn: "LNG Carrier",
    definitionKo:
      "액화천연가스(LNG)를 영하 163도로 냉각해 운반하는 초대형 선박입니다. 한국 조선사가 기술력 1위이며, 한 척당 2,500억 원 이상입니다.",
    category: "shipbuilding-defense",
    difficulty: "beginner",
    relatedTerms: ["수주잔고", "천연가스", "에너지 안보"],
    exampleKo:
      "카타르 LNG 프로젝트에서 한국 조선사가 대규모 수주를 따냈습니다.",
  },

  // === AI 인프라 ===
  {
    id: "15",
    termKo: "GPU (그래픽 처리 장치)",
    termEn: "Graphics Processing Unit",
    definitionKo:
      "원래 그래픽 연산용이었으나 현재는 AI 학습의 핵심 하드웨어입니다. 엔비디아의 H100, H200이 대표적이며, 수요 폭증으로 가격이 급등했습니다.",
    category: "ai-infra",
    difficulty: "beginner",
    relatedTerms: ["HBM", "엔비디아", "데이터센터"],
    exampleKo: "엔비디아 GPU 수요 급증으로 반도체 공급 부족이 심화되고 있습니다.",
  },
  {
    id: "16",
    termKo: "데이터센터",
    termEn: "Data Center",
    definitionKo:
      "서버, 네트워크 장비를 모아둔 시설로 AI 서비스의 물리적 기반입니다. 전력 소비가 막대해 에너지·냉각 기술이 핵심이며, 한국에서도 대규모 투자가 진행 중입니다.",
    category: "ai-infra",
    difficulty: "beginner",
    relatedTerms: ["GPU", "클라우드", "전력 인프라"],
    exampleKo: "MS·구글이 한국에 1조 원 규모 데이터센터 투자를 발표했습니다.",
  },

  // === 2차전지 (Secondary Battery) ===
  {
    id: "17",
    termKo: "전고체 배터리",
    termEn: "All-Solid-State Battery",
    definitionKo:
      "액체 전해질 대신 고체 전해질을 사용하는 차세대 배터리입니다. 화재 위험이 낮고 에너지 밀도가 높아 전기차의 게임체인저로 기대됩니다.",
    category: "secondary-battery",
    difficulty: "intermediate",
    relatedTerms: ["리튬이온 배터리", "에너지 밀도", "전기차"],
    exampleKo:
      "삼성SDI가 전고체 배터리 시제품 생산에 성공했다는 소식에 주가가 급등했습니다.",
  },
  {
    id: "18",
    termKo: "양극재",
    termEn: "Cathode Material",
    definitionKo:
      "배터리의 성능과 용량을 결정하는 핵심 소재입니다. 니켈·코발트·망간 등의 비율에 따라 종류가 나뉘며, 에코프로비엠이 대표 기업입니다.",
    category: "secondary-battery",
    difficulty: "intermediate",
    relatedTerms: ["음극재", "전해질", "에코프로비엠"],
    exampleKo:
      "양극재 가격 하락으로 2차전지 기업들의 수익성이 개선될 전망입니다.",
  },

  // === 시장 — 고급 ===
  {
    id: "19",
    termKo: "연준 (Fed)",
    termEn: "Federal Reserve",
    definitionKo:
      "미국의 중앙은행으로, 금리를 결정해 전 세계 금융 시장에 막대한 영향을 미칩니다. 금리를 올리면 주가에 부정적, 내리면 긍정적인 경향이 있습니다.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["기준금리", "FOMC", "달러"],
    exampleKo:
      "연준이 금리를 0.25%p 인하하면서 글로벌 증시가 일제히 상승했습니다.",
  },
  {
    id: "20",
    termKo: "FOMC",
    termEn: "Federal Open Market Committee",
    definitionKo:
      "연준 산하 통화정책 결정 기구입니다. 연 8회 회의를 열어 기준금리를 결정하며, 회의 결과와 의사록 공개 시 시장이 크게 움직입니다.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["연준", "기준금리", "점도표"],
    exampleKo:
      "다음 주 FOMC 회의를 앞두고 투자자들이 관망세를 보이고 있습니다.",
  },
  {
    id: "21",
    termKo: "환율",
    termEn: "Exchange Rate",
    definitionKo:
      "한 나라 화폐와 다른 나라 화폐의 교환 비율입니다. 원/달러 환율이 오르면(원화 약세) 수출 기업에 유리하지만 수입 물가가 올라갑니다.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["달러", "원화", "수출"],
    exampleKo:
      "원/달러 환율이 1,400원을 돌파하며 수출주가 강세를 보이고 있습니다.",
  },
  {
    id: "22",
    termKo: "선물 (Futures)",
    termEn: "Futures",
    definitionKo:
      "미래 특정 시점에 미리 정한 가격으로 자산을 사고팔기로 하는 계약입니다. 야간 선물 시장 동향은 다음 날 한국 시장 방향을 예측하는 데 중요합니다.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["옵션", "파생상품", "야간시장"],
    exampleKo:
      "야간 선물이 1.5% 하락하며 내일 시장 약세가 예상됩니다.",
  },
  {
    id: "23",
    termKo: "밸류에이션",
    termEn: "Valuation",
    definitionKo:
      "기업의 가치를 평가하는 것입니다. PER, PBR, EV/EBITDA 등 다양한 지표를 사용하며, 현재 주가가 적정한지 판단하는 데 활용합니다.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["PER", "PBR", "적정주가"],
    exampleKo:
      "반도체 섹터의 밸류에이션이 역사적 평균을 크게 상회하고 있어 주의가 필요합니다.",
  },
  {
    id: "24",
    termKo: "공급망",
    termEn: "Supply Chain",
    definitionKo:
      "원자재부터 완제품까지 상품이 생산·유통되는 전 과정입니다. 글로벌 공급망 차질은 가격 상승, 생산 지연 등을 초래해 관련 기업 주가에 직접적 영향을 미칩니다.",
    category: "general",
    difficulty: "beginner",
    relatedTerms: ["관세", "물류", "리쇼어링"],
    exampleKo:
      "대만 해협 긴장으로 반도체 공급망 리스크가 부각되고 있습니다.",
  },
];
