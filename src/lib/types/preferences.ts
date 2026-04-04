export const VALID_SECTORS = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "bio-healthcare",
  "finance",
] as const;

export type SectorType = (typeof VALID_SECTORS)[number];

export const VALID_ALERT_THRESHOLDS = [
  "critical",
  "warning",
  "medium",
  "info",
] as const;

export type AlertSeverityThreshold = (typeof VALID_ALERT_THRESHOLDS)[number];

export interface UserPreferences {
  userId: string;
  preferredSectors: SectorType[];
  alertSeverityThreshold: AlertSeverityThreshold;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistEntry {
  symbol: string;
  name: string;
  sector: SectorType;
}

export interface UserPreferencesInput {
  preferredSectors?: string[];
  alertSeverityThreshold?: string;
}
