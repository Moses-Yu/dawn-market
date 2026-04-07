import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  SEED_TERMS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  termToSlug,
  findTermBySlug,
  type GlossaryTerm,
  type Difficulty,
} from "@/lib/glossary/terms";
import type { Category } from "@/lib/pipeline/types";
import PageTransition from "@/components/PageTransition";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://dawn-market.vercel.app";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "bg-green-500/15 text-green-400",
  intermediate: "bg-yellow-500/15 text-yellow-400",
  advanced: "bg-red-500/15 text-red-400",
};

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  beginner: "\uD83D\uDFE2",
  intermediate: "\uD83D\uDFE1",
  advanced: "\uD83D\uDD34",
};

const CATEGORY_COLORS: Record<Category, string> = {
  semiconductor: "bg-blue-500/15 text-blue-400",
  "shipbuilding-defense": "bg-teal-500/15 text-teal-400",
  "ai-infra": "bg-cyan-500/15 text-cyan-400",
  "secondary-battery": "bg-green-500/15 text-green-400",
  "bio-healthcare": "bg-pink-500/15 text-pink-400",
  finance: "bg-amber-500/15 text-amber-400",
  geopolitics: "bg-orange-500/15 text-orange-400",
  market: "bg-purple-500/15 text-purple-400",
  general: "bg-gray-500/15 text-gray-400",
};

async function getTerms(): Promise<GlossaryTerm[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("glossary_terms")
    .select(
      "id, term_ko, term_en, definition_ko, category, difficulty, related_terms, example_ko"
    )
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

type Props = {
  params: Promise<{ term: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term: slug } = await params;
  const terms = await getTerms();
  const term = findTermBySlug(terms, slug);

  if (!term) {
    return { title: "용어를 찾을 수 없습니다" };
  }

  const title = `${term.termKo} 뜻 - 주식투자 용어사전`;
  const description = term.definitionKo.slice(0, 155);
  const termSlug = termToSlug(term.termKo);

  return {
    title,
    description,
    alternates: { canonical: `/glossary/${encodeURIComponent(termSlug)}` },
    openGraph: {
      title: `${term.termKo} 뜻 — 새벽시장 용어사전`,
      description,
      type: "article",
      url: `${SITE_URL}/glossary/${encodeURIComponent(termSlug)}`,
    },
    twitter: {
      card: "summary",
      title: `${term.termKo} 뜻 — 새벽시장 용어사전`,
      description,
    },
  };
}

function TermJsonLd({ term }: { term: GlossaryTerm }) {
  const termSlug = termToSlug(term.termKo);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.termKo,
    description: term.definitionKo,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "새벽시장 주식투자 용어사전",
      url: `${SITE_URL}/glossary`,
    },
    url: `${SITE_URL}/glossary/${encodeURIComponent(termSlug)}`,
    ...(term.termEn ? { alternateName: term.termEn } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function GlossaryTermPage({ params }: Props) {
  const { term: slug } = await params;
  const terms = await getTerms();
  const term = findTermBySlug(terms, slug);

  if (!term) {
    notFound();
  }

  // Find related terms that exist in glossary for linking
  const relatedTermObjects = term.relatedTerms
    .map((rt) => terms.find((t) => t.termKo === rt || t.termKo.startsWith(rt)))
    .filter(Boolean) as GlossaryTerm[];

  return (
    <PageTransition>
      <TermJsonLd term={term} />

      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/glossary"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          용어 사전
        </Link>

        {/* Term header */}
        <div>
          <h1 className="text-2xl font-bold">{term.termKo}</h1>
          {term.termEn && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {term.termEn}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${DIFFICULTY_COLORS[term.difficulty]}`}
            >
              {DIFFICULTY_EMOJI[term.difficulty]} {DIFFICULTY_LABELS[term.difficulty]}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_COLORS[term.category]}`}
            >
              {CATEGORY_LABELS[term.category]}
            </span>
          </div>
        </div>

        {/* Definition */}
        <section>
          <h2 className="flex items-center gap-2 mb-3 text-base font-semibold">
            <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
            정의
          </h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm leading-relaxed">{term.definitionKo}</p>
          </div>
        </section>

        {/* Example */}
        {term.exampleKo && (
          <section>
            <h2 className="flex items-center gap-2 mb-3 text-base font-semibold">
              <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
              예시
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-relaxed italic text-[var(--color-foreground)]/80">
                &ldquo;{term.exampleKo}&rdquo;
              </p>
            </div>
          </section>
        )}

        {/* Related terms */}
        {term.relatedTerms.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 mb-3 text-base font-semibold">
              <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
              관련 용어
            </h2>
            <div className="flex flex-wrap gap-2">
              {term.relatedTerms.map((rt) => {
                const linked = relatedTermObjects.find(
                  (t) => t.termKo === rt || t.termKo.startsWith(rt)
                );
                if (linked) {
                  return (
                    <Link
                      key={rt}
                      href={`/glossary/${encodeURIComponent(termToSlug(linked.termKo))}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-primary)] hover:bg-white/10 transition-colors"
                    >
                      {rt}
                    </Link>
                  );
                }
                return (
                  <span
                    key={rt}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-muted)]"
                  >
                    {rt}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Back to glossary CTA */}
        <div className="pt-2">
          <Link
            href="/glossary"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            전체 용어 사전 보기
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
