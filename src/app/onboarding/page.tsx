"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sunrise,
  BarChart3,
  Bell,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { updateSectorPreferences } from "@/app/actions/preferences";
import PushToggle from "@/components/push/PushToggle";

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

function StepIntro({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
        <Sunrise className="h-10 w-10 text-[var(--color-primary)]" />
      </div>

      <h1 className="text-2xl font-bold">
        <span className="text-[var(--color-primary)]">새벽</span>시장에
        오신 것을 환영합니다
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        밤사이 해외 시장에서 무슨 일이 있었는지,
        <br />
        AI가 매일 새벽 간결하게 정리해드립니다.
      </p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3 text-left">
          <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
          <div>
            <p className="text-sm font-medium">섹터별 AI 브리핑</p>
            <p className="text-xs text-[var(--color-muted)]">
              반도체, 방산, AI, 2차전지 핵심 뉴스
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3 text-left">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
          <div>
            <p className="text-sm font-medium">실시간 시장 알림</p>
            <p className="text-xs text-[var(--color-muted)]">
              중요한 변동이 있으면 바로 알려드려요
            </p>
          </div>
        </div>
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
          선택한 섹터의 뉴스를 우선 브리핑해드립니다.
          <br />
          나중에 설정에서 변경할 수 있어요.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {SECTORS.map((sector) => {
          const isSelected = selected.has(sector.id);
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => toggle(sector.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                isSelected
                  ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{sector.icon}</span>
                <span className="text-sm font-bold">{sector.label}</span>
              </div>
              <p className="mt-1 text-[10px] leading-tight text-[var(--color-muted)]">
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
              {selected.size > 0 ? "다음" : "건너뛰기"}
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
      <div className="flex items-center justify-between px-6 pt-6">
        <StepIndicator current={step} total={3} />
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-xs text-[var(--color-muted)]"
          >
            이전
          </button>
        )}
      </div>

      {step === 0 && (
        <StepIntro onNext={() => setStep(1)} onSkip={complete} />
      )}
      {step === 1 && (
        <StepSectors onNext={() => setStep(2)} onSkip={complete} />
      )}
      {step === 2 && <StepPush onComplete={complete} />}
    </div>
  );
}
