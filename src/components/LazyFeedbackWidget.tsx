"use client";

import dynamic from "next/dynamic";

const FeedbackWidget = dynamic(() => import("@/components/FeedbackWidget"), {
  ssr: false,
});

export default function LazyFeedbackWidget() {
  return <FeedbackWidget />;
}
