export const metadata = {
  title: "시작하기",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-background)]">
      {children}
    </div>
  );
}
