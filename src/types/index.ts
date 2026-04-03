export interface Briefing {
  id: string;
  title: string;
  summary: string;
  category: "semiconductor" | "shipbuilding-defense" | "ai-infra" | "secondary-battery" | "geopolitics" | "market" | "general";
  sentiment: "bullish" | "bearish" | "neutral";
  publishedAt: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  read: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  interests: string[];
  notificationsEnabled: boolean;
}
