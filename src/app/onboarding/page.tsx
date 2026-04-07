"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sunrise,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { updateSectorPreferences } from "@/app/actions/preferences";
import PushToggle from "@/components/push/PushToggle";

const POPULAR_SECTORS = new Set(["semiconductor", "shipbuilding-defense"]);

const SECTORS = [
  {
    id: "semiconductor",
    label: "반도체",
    icon: "🔬",
    description: "삼성전자, SK하이닉스, NVIDIA, TSMC",
  },
  {
    id: "shipbuilding-defense",
    label: "조선/방산",
    icon: "🚢",
    description: "HD한국조선해양, 한화에어로스페이스, 한화오션",
  },
  {
    id: "ai-infra",
    label: "AI 인프라",
    icon: "🤖",
    description: "NAVER, 카카오, Microsoft, Alphabet",
  },
  {
    id: "secondary-battery",
    label: "2차전지",
    icon: "🔋",
    description: "LG에너지솔루션, 삼성SDI, 에코프로비엠",
  },
  {
    id: "bio-healthcare",
    label: "바이오/헬스케어",
    icon: "🧬",
    description: "삼성바이오로직스, 셀트리온, Eli Lilly, Novo Nordisk",
  },
  {
    id: "finance",
    label: "금융/은행",
    icon: "🏦",
    description: "KB금융, 신한지주, 하나금융지주, JPMorgan",
  },
];

const MOCK_HEADLINE =
  "미-이란 긴장 고조로 국제유가 +3.2%. 한국 방산주 강세 예상. 반도체는 단기 조정 후 반등 구간 진입.";
const MOCK_NEWS = [
  "TSMC, 美 공장 투자 확대 발표",
  "삼성전자 HBM 공급 계약 체결",
  "방산주 외국인 매수세 재개",
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 bg-[var(--color-primary)]"
              : i < current
                ? "w-1.5 bg-[var(--color-primary)]/50"
                : "w-1.5 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

function StepIntro({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
        <Sunrise className="h-10 w-10 text-[var(--color-primary)]" />
      </div>

      <h1 className="text-2xl font-bold">
        <span className="text-[var(--color-primary)]">새벽</span>시장에 오신 것을
        환영합니다
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
        밤사이 해외 시장에서 무슨 일이 있었는지,
        <br />
        AI가 매일 새벽 간결하게 정리해드립니다.
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        매일 아침 8시, 밤사이 해외이슈 → 한국장 영향 분석
      </p>

      {/* Briefing preview card */}
      <div className="mt-8 w-full max-w-xs rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
          <span className="text-xs font-medium text-[var(--color-primary)]">
            Dawn Briefing
          </span>
        </div>
        <p className="mt-2 text-sm font-medium leading-relaxed">
          {MOCK_HEADLINE}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
            주의
          </span>
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
            안전
          </span>
        </div>
      </div>

      {/* Checklist bullets */}
      <div className="mt-6 w-full max-w-xs space-y-2.5">
        {[
          "섹터별 AI 브리핑 매일 새벽 도착",
          "관심 섹터 맞춤 뉴스 우선 정리",
          "중요 시장 변동 실시간 알림",
        ].map((text) => (
          <div key={text} className="flex items-center gap-2.5 text-left">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            <span className="text-sm">{text}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto w-full max-w-xs space-y-3 pb-8 pt-10">
        <button
          type="button"
          onClick={onNext}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white"
        >
          시작하기
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-sm text-[var(--color-muted)]"
        >
          나중에
        </button>
      </div>
    </div>
  );
}

function StepSectors({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(sectorId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sectorId)) {
        next.delete(sectorId);
      } else {
        next.add(sectorId);
      }
      return next;
    });
  }

  function handleNext() {
    if (selected.size === 0) {
      onNext();
      return;
    }
    startTransition(async () => {
      await updateSectorPreferences(Array.from(selected));
      onNext();
    });
  }

  return (
    <div className="flex flex-1 flex-col px-6">
      <div className="mt-8">
        <h2 className="text-xl font-bold">관심 섹터를 선택하세요</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          선택한 섹터의 브리핑을 상단에 먼저 보여드립니다.
          <br />
          나중에 설정에서 변경할 수 있어요.
        </p>
      </div>

      {selected.size > 0 && (
        <p className="mt-3 text-sm font-medium text-[var(--color-primary)]">
          {selected.size}개 선택됨
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {SECTORS.map((sector) => {
          const isSelected = selected.has(sector.id);
          const isPopular = POPULAR_SECTORS.has(sector.id);
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => toggle(sector.id)}
              className={`relative rounded-xl border p-3 text-left transition-colors ${
                isSelected
                  ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {isPopular && (
                <span className="absolute top-2 right-2 rounded-full bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-primary)]">
                  인기
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg">{sector.icon}</span>
                <span className="text-sm font-bold">{sector.label}</span>
              </div>
              <p className="mt-1 text-xs leading-tight text-[var(--color-muted)]">
                {sector.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-auto w-full space-y-3 pb-8 pt-10">
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white disabled:opacity-50"
        >
          {isPending ? (
            "저장 중..."
          ) : (
            <>
              {selected.size > 0 ? "다음" : "일단 건너뛰기"}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2 text-sm text-[var(--color-muted)]"
          >
            나중에
          </button>
        )}
      </div>
    </div>
  );
}

function StepBriefingPreview({ onNext }: { onNext: () => void }) {
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="flex flex-1 flex-col px-6">
      <div className="mt-8">
        <h2 className="text-xl font-bold">이런 브리핑을 매일 받아보세요</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          아침 8시, 맞춤 분석이 도착합니다
        </p>
      </div>

      {/* Briefing mockup card */}
      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
          <span className="text-xs font-medium text-[var(--color-primary)]">
            Dawn Briefing
          </span>
          <span className="ml-auto text-xs text-[var(--color-muted)]">
            {dateStr}
          </span>
        </div>

        {/* Headline */}
        <p className="mt-3 text-sm font-medium leading-relaxed">
          {MOCK_HEADLINE}
        </p>

        {/* News items */}
        <div className="mt-4 space-y-2">
          {MOCK_NEWS.map((news, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-[var(--color-muted)]"
            >
              <span className="text-xs text-[var(--color-primary)]">
                {i + 1}
              </span>
              {news}
            </div>
          ))}
        </div>

        {/* Pro teaser row */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 p-3">
          <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
          <span className="flex-1 text-xs text-[var(--color-muted)]">
            Pro 구독 시 종목별 상세 분석
          </span>
          <Link
            href="/pricing"
            className="text-xs font-medium text-[var(--color-primary)]"
          >
            구독하기 →
          </Link>
        </div>
      </div>

      <div className="mt-auto w-full space-y-3 pb-8 pt-10">
        <button
          type="button"
          onClick={onNext}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white"
        >
          알림 설정하고 매일 받기 →
        </button>
      </div>
    </div>
  );
}

function StepPush({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-6">
      <div className="mt-8">
        <h2 className="text-xl font-bold">알림을 켜보세요</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          중요한 시장 변동이 있을 때 바로 알려드립니다.
          <br />
          나중에 설정에서 변경할 수 있어요.
        </p>
      </div>

      <div className="mt-6">
        <PushToggle />
      </div>

      {/* Pro teaser card */}
      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-[var(--color-primary)]" />
          <span className="text-sm font-bold">Pro로 업그레이드하면</span>
        </div>
        <ul className="mt-3 space-y-2">
          {[
            "종목별 맞춤 분석",
            "관심종목 무제한",
            "위험 신호 즉시 알림",
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
              {benefit}
            </li>
          ))}
        </ul>
        <Link
          href="/pricing"
          className="mt-3 block w-full rounded-lg border border-[var(--color-primary)]/30 py-2 text-center text-sm font-medium text-[var(--color-primary)]"
        >
          Pro 살펴보기
        </Link>
      </div>

      <div className="mt-auto w-full space-y-3 pb-8 pt-10">
        <button
          type="button"
          onClick={onComplete}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white"
        >
          시작하기
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="w-full py-2 text-sm text-[var(--color-muted)]"
        >
          나중에
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  function complete() {
    localStorage.setItem("onboarding_complete", "true");
    router.replace("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <div className="flex items-center px-6 pt-6">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mr-3 text-xs text-[var(--color-muted)]"
          >
            ← 이전
          </button>
        ) : (
          <div className="mr-3 w-[34px]" />
        )}
        <StepIndicator current={step} total={4} />
      </div>

      {step === 0 && (
        <StepIntro onNext={() => setStep(1)} onSkip={complete} />
      )}
      {step === 1 && (
        <StepSectors onNext={() => setStep(2)} onSkip={complete} />
      )}
      {step === 2 && <StepBriefingPreview onNext={() => setStep(3)} />}
      {step === 3 && <StepPush onComplete={complete} />}
    </div>
  );
}
