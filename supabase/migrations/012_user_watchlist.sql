-- Add watchlist JSONB column to user_preferences
-- Each entry: { "symbol": "005930.KS", "name": "삼성전자", "sector": "semiconductor" }
-- Max 20 items enforced at API level

ALTER TABLE user_preferences
ADD COLUMN watchlist JSONB DEFAULT '[]'::jsonb;
