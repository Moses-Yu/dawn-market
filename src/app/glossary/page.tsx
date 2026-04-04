import {
  SEED_TERMS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type GlossaryTerm,
  type Difficulty,
} from "@/lib/glossary/terms";
import type { Category } from "@/lib/pipeline/types";
import { createClient } from "@/lib/supabase/server";
import GlossaryClient from "./GlossaryClient";

export const metadata = {
  title: "용어 사전",
  description:
    "초보 투자자를 위한 주식·경제 용어 사전. 반도체, 방산, AI, 2차전지 핵심 용어를 쉽게 배워보세요.",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "용어 사전 — 새벽시장",
    description:
      "초보 투자자를 위한 주식·경제 용어 사전. 반도체, 방산, AI, 2차전지 핵심 용어를 쉽게 배워보세요.",
  },
};

async function getTerms(): Promise<GlossaryTerm[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("glossary_terms")
    .select("id, term_ko, term_en, definition_ko, category, difficulty, related_terms, example_ko")
    .order("term_ko");

  if (!data || data.length === 0) return SEED_TERMS;

  return data.map((row) => ({
    id: row.id,
    termKo: row.term_ko,
    termEn: row.term_en,
    definitionKo: row.definition_ko,
    category: row.category as Category,
    difficulty: row.difficulty as Difficulty,
    relatedTerms: row.related_terms ?? [],
    exampleKo: row.example_ko,
  }));
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
