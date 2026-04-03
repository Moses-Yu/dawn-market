import {
  SEED_TERMS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type GlossaryTerm,
  type Difficulty,
} from "@/lib/glossary/terms";
import type { Category } from "@/lib/pipeline/types";
import GlossaryClient from "./GlossaryClient";

export const metadata = {
  title: "용어 사전",
  description:
    "초보 투자자를 위한 주식·경제 용어 사전. 반도체, 방산, AI, 2차전지 핵심 용어를 쉽게 배워보세요.",
  openGraph: {
    title: "용어 사전 — 새벽시장",
    description:
      "초보 투자자를 위한 주식·경제 용어 사전. 반도체, 방산, AI, 2차전지 핵심 용어를 쉽게 배워보세요.",
  },
};

// TODO: replace with Supabase query once migration 007 lands
async function getTerms(): Promise<GlossaryTerm[]> {
  return SEED_TERMS;
}

export default async function GlossaryPage() {
  const terms = await getTerms();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">용어 사전</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          초보 투자자를 위한 핵심 용어 {terms.length}개
        </p>
      </div>
      <GlossaryClient
        terms={terms}
        categoryLabels={CATEGORY_LABELS}
        difficultyLabels={DIFFICULTY_LABELS}
      />
    </div>
  );
}
