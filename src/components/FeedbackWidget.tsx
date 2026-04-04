"use client";

import { useState, useRef } from "react";
import { MessageSquarePlus, X, Send } from "lucide-react";

type FeedbackType = "bug" | "feature" | "general";

const feedbackLabels: Record<FeedbackType, string> = {
  general: "일반 의견",
  bug: "버그 제보",
  feature: "기능 요청",
};

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const sessionId = sessionStorage.getItem("dm_session_id") || undefined;
      await fetch("/api/analytics/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_type: type,
          rating: rating || undefined,
          message: message.trim(),
          page_path: window.location.pathname,
          session_id: sessionId,
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage("");
        setRating(0);
        setType("general");
      }, 2000);
    } catch {
      // Silent fail — feedback is non-critical
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="피드백 보내기"
        >
          <MessageSquarePlus size={20} />
        </button>
      )}

      {/* Feedback panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-80 rounded-2xl border border-[var(--color-muted)]/20 bg-[var(--color-bg,#0a0a0a)] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">의견을 들려주세요</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--color-muted)] hover:text-white"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div className="py-6 text-center">
              <p className="text-sm text-emerald-400">감사합니다! 소중한 의견 반영하겠습니다.</p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
              {/* Type selector */}
              <div className="flex gap-2">
                {(Object.keys(feedbackLabels) as FeedbackType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      type === t
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-[var(--color-muted)] hover:bg-white/20"
                    }`}
                  >
                    {feedbackLabels[t]}
                  </button>
                ))}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <span className="mr-2 text-xs text-[var(--color-muted)]">만족도</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    className={`text-lg transition-colors ${
                      star <= rating ? "text-yellow-400" : "text-white/20"
                    }`}
                    aria-label={`${star}점`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="어떤 점이 불편하거나 개선되면 좋겠는지 알려주세요..."
                className="w-full rounded-lg border border-[var(--color-muted)]/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[var(--color-muted)]/50 focus:border-blue-500 focus:outline-none"
                rows={3}
                maxLength={2000}
                required
              />

              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
              >
                <Send size={14} />
                {sending ? "전송 중..." : "보내기"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
