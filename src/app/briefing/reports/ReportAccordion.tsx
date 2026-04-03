"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

function AccordionItem({
  isOpen,
  onToggle,
  header,
  children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  header: ReactNode;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div
      className={`rounded-xl border border-white/10 transition-colors duration-200 ${
        isOpen ? "bg-white/[0.04]" : "bg-white/[0.02]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 p-4 select-none text-left"
      >
        {header}
        <span
          className={`text-[var(--color-muted)] transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      <div
        className="overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: isOpen ? height : 0 }}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ReportAccordion({
  items,
}: {
  items: { key: string; header: ReactNode; content: ReactNode }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <AccordionItem
          key={item.key}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          header={item.header}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}
