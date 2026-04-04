export const VALID_SECTORS = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
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

export interface UserPreferencesInput {
  preferredSectors?: string[];
  alertSeverityThreshold?: string;
}
