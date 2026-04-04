import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ALL_SYMBOLS,
  SEMICONDUCTOR_SYMBOLS,
  SHIPBUILDING_DEFENSE_SYMBOLS,
  AI_INFRA_SYMBOLS,
  SECONDARY_BATTERY_SYMBOLS,
  BIO_HEALTHCARE_SYMBOLS,
  FINANCE_SYMBOLS,
  US_MARKET_SYMBOLS,
  CURRENCY_SYMBOLS,
  ASIAN_SYMBOLS,
  COMMODITY_SYMBOLS,
} from "@/lib/pipeline/reports/types";

const MAX_WATCHLIST_SIZE = 20;

// Build symbol-to-sector lookup
const SYMBOL_SECTOR_MAP = new Map<string, string>();
const sectorGroups: [typeof US_MARKET_SYMBOLS, string][] = [
  [SEMICONDUCTOR_SYMBOLS, "semiconductor"],
  [SHIPBUILDING_DEFENSE_SYMBOLS, "shipbuilding-defense"],
  [AI_INFRA_SYMBOLS, "ai-infra"],
  [SECONDARY_BATTERY_SYMBOLS, "secondary-battery"],
  [BIO_HEALTHCARE_SYMBOLS, "bio-healthcare"],
  [FINANCE_SYMBOLS, "finance"],
  [US_MARKET_SYMBOLS, "us-market"],
  [CURRENCY_SYMBOLS, "currency"],
  [ASIAN_SYMBOLS, "asian"],
  [COMMODITY_SYMBOLS, "commodity"],
];
for (const [symbols, sector] of sectorGroups) {
  for (const s of symbols) {
    // First sector wins for symbols that appear in multiple groups
    if (!SYMBOL_SECTOR_MAP.has(s.symbol)) {
      SYMBOL_SECTOR_MAP.set(s.symbol, sector);
    }
  }
}

// Build symbol-to-name lookup
const SYMBOL_NAME_MAP = new Map<string, string>(
  ALL_SYMBOLS.map((s) => [s.symbol, s.name])
);

interface WatchlistEntry {
  symbol: string;
  name: string;
  sector: string;
}

function validateEntry(
  entry: { symbol?: string; name?: string; sector?: string },
): { valid: WatchlistEntry } | { error: string } {
  const { symbol, sector } = entry;

  if (!symbol || typeof symbol !== "string") {
    return { error: "symbol은 필수입니다." };
  }

  const knownName = SYMBOL_NAME_MAP.get(symbol);
  if (!knownName) {
    return { error: `유효하지 않은 종목입니다: ${symbol}` };
  }

  const knownSector = SYMBOL_SECTOR_MAP.get(symbol);
  if (sector && sector !== knownSector) {
    return {
      error: `${symbol}의 섹터가 올바르지 않습니다. 올바른 섹터: ${knownSector}`,
    };
  }

  return {
    valid: {
      symbol,
      name: entry.name || knownName,
      sector: sector || knownSector || "unknown",
    },
  };
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/watchlist — return user's watchlist
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select("watchlist")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Failed to fetch watchlist:", error);
      return NextResponse.json(
        { error: "관심종목을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stocks: (data?.watchlist as WatchlistEntry[]) ?? [],
    });
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json(
      { error: "관심종목을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/watchlist — replace entire watchlist
export async function PUT(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const stocks: unknown[] = body.stocks;

    if (!Array.isArray(stocks)) {
      return NextResponse.json(
        { error: "stocks 배열이 필요합니다." },
        { status: 400 }
      );
    }

    if (stocks.length > MAX_WATCHLIST_SIZE) {
      return NextResponse.json(
        { error: `관심종목은 최대 ${MAX_WATCHLIST_SIZE}개까지 가능합니다.` },
        { status: 400 }
      );
    }

    const validated: WatchlistEntry[] = [];
    for (const entry of stocks) {
      const result = validateEntry(entry as { symbol?: string; name?: string; sector?: string });
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      validated.push(result.valid);
    }

    // Deduplicate by symbol
    const deduped = validated.filter(
      (s, i, arr) => arr.findIndex((x) => x.symbol === s.symbol) === i
    );

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          watchlist: deduped,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Failed to save watchlist:", error);
      return NextResponse.json(
        { error: "관심종목 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ stocks: deduped });
  } catch (error) {
    console.error("Failed to save watchlist:", error);
    return NextResponse.json(
      { error: "관심종목 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/watchlist — add a single stock
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = validateEntry(body);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Get current watchlist
    const { data, error: fetchError } = await supabase
      .from("user_preferences")
      .select("watchlist")
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Failed to fetch watchlist:", fetchError);
      return NextResponse.json(
        { error: "관심종목을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    const current: WatchlistEntry[] = (data?.watchlist as WatchlistEntry[]) ?? [];

    // Check duplicate
    if (current.some((s) => s.symbol === result.valid.symbol)) {
      return NextResponse.json(
        { error: "이미 관심종목에 등록된 종목입니다." },
        { status: 409 }
      );
    }

    if (current.length >= MAX_WATCHLIST_SIZE) {
      return NextResponse.json(
        { error: `관심종목은 최대 ${MAX_WATCHLIST_SIZE}개까지 가능합니다.` },
        { status: 400 }
      );
    }

    const updated = [...current, result.valid];

    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          watchlist: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Failed to add to watchlist:", upsertError);
      return NextResponse.json(
        { error: "관심종목 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ stocks: updated }, { status: 201 });
  } catch (error) {
    console.error("Failed to add to watchlist:", error);
    return NextResponse.json(
      { error: "관심종목 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlist?symbol=XXX — remove a stock by symbol
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const symbol = request.nextUrl.searchParams.get("symbol");
    if (!symbol) {
      return NextResponse.json(
        { error: "symbol 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error: fetchError } = await supabase
      .from("user_preferences")
      .select("watchlist")
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Failed to fetch watchlist:", fetchError);
      return NextResponse.json(
        { error: "관심종목을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    const current: WatchlistEntry[] = (data?.watchlist as WatchlistEntry[]) ?? [];
    const updated = current.filter((s) => s.symbol !== symbol);

    if (updated.length === current.length) {
      return NextResponse.json(
        { error: "해당 종목이 관심종목에 없습니다." },
        { status: 404 }
      );
    }

    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          watchlist: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Failed to remove from watchlist:", upsertError);
      return NextResponse.json(
        { error: "관심종목 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ stocks: updated });
  } catch (error) {
    console.error("Failed to remove from watchlist:", error);
    return NextResponse.json(
      { error: "관심종목 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
