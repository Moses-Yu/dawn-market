"use client";

import { useState, useMemo } from "react";
import type { GlossaryTerm, Difficulty } from "@/lib/glossary/terms";
import type { Category } from "@/lib/pipeline/types";
import { Search, X, BookOpen } from "lucide-react";

const CATEGORY_COLORS: Record<Category, string> = {
  semiconductor: "bg-blue-500/15 text-blue-400",
  "shipbuilding-defense": "bg-teal-500/15 text-teal-400",
  "ai-infra": "bg-cyan-500/15 text-cyan-400",
  "secondary-battery": "bg-green-500/15 text-green-400",
  geopolitics: "bg-orange-500/15 text-orange-400",
  market: "bg-purple-500/15 text-purple-400",
  general: "bg-gray-500/15 text-gray-400",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "bg-green-500/15 text-green-400",
  intermediate: "bg-yellow-500/15 text-yellow-400",
  advanced: "bg-red-500/15 text-red-400",
};

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  beginner: "🟢",
  intermediate: "🟡",
  advanced: "🔴",
};

interface Props {
  terms: GlossaryTerm[];
  categoryLabels: Record<Category, string>;
  difficultyLabels: Record<Difficulty, string>;
}

export default function GlossaryClient({
  terms,
  categoryLabels,
  difficultyLabels,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | "all"
  >("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(terms.map((t) => t.category));
    return Array.from(cats).sort();
  }, [terms]);

  const filtered = useMemo(() => {
    return terms.filter((t) => {
      if (
        selectedCategory !== "all" &&
        t.category !== selectedCategory
      )
        return false;
      if (
        selectedDifficulty !== "all" &&
        t.difficulty !== selectedDifficulty
      )
        return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          t.termKo.toLowerCase().includes(q) ||
          (t.termEn && t.termEn.toLowerCase().includes(q)) ||
          t.definitionKo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [terms, query, selectedCategory, selectedDifficulty]);

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="용어 검색..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill
          active={selectedDifficulty === "all"}
          onClick={() => setSelectedDifficulty("all")}
        >
          전체 난이도
        </FilterPill>
        {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => (
          <FilterPill
            key={d}
            active={selectedDifficulty === d}
            onClick={() =>
              setSelectedDifficulty(selectedDifficulty === d ? "all" : d)
            }
          >
            {DIFFICULTY_EMOJI[d]} {difficultyLabels[d]}
          </FilterPill>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill
          active={selectedCategory === "all"}
          onClick={() => setSelectedCategory("all")}
        >
          전체 분야
        </FilterPill>
        {categories.map((cat) => (
          <FilterPill
            key={cat}
            active={selectedCategory === cat}
            onClick={() =>
              setSelectedCategory(selectedCategory === cat ? "all" : cat)
            }
          >
            {categoryLabels[cat as Category]}
          </FilterPill>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2">
        <p className="text-xs text-[var(--color-muted)]">
          {filtered.length}개 용어
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--color-muted)]" />
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              검색 결과가 없습니다
            </p>
          </div>
        ) : (
          filtered.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              categoryLabels={categoryLabels}
              difficultyLabels={difficultyLabels}
              expanded={expandedId === term.id}
              onToggle={() =>
                setExpandedId(expandedId === term.id ? null : term.id)
              }
            />
          ))
        )}
      </div>
    </>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--color-primary)] text-white"
          : "bg-white/5 text-[var(--color-muted)] hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function TermCard({
  term,
  categoryLabels,
  difficultyLabels,
  expanded,
  onToggle,
}: {
  term: GlossaryTerm;
  categoryLabels: Record<Category, string>;
  difficultyLabels: Record<Difficulty, string>;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/[0.08]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-base">{term.termKo}</h3>
          {term.termEn && (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {term.termEn}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[term.difficulty]}`}
          >
            {DIFFICULTY_EMOJI[term.difficulty]} {difficultyLabels[term.difficulty]}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[term.category]}`}
          >
            {categoryLabels[term.category]}
          </span>
        </div>
      </div>

      {/* Definition (always visible, truncated when collapsed) */}
      <p
        className={`mt-2 text-sm leading-relaxed text-[var(--color-foreground)]/80 ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {term.definitionKo}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          {/* Example */}
          {term.exampleKo && (
            <div>
              <p className="text-xs font-medium text-[var(--color-muted)]">
                예시
              </p>
              <p className="mt-1 rounded-lg bg-white/5 p-2.5 text-xs leading-relaxed italic">
                &ldquo;{term.exampleKo}&rdquo;
              </p>
            </div>
          )}

          {/* Related terms */}
          {term.relatedTerms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-muted)]">
                관련 용어
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {term.relatedTerms.map((rt) => (
                  <span
                    key={rt}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--color-muted)]"
                  >
                    {rt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
