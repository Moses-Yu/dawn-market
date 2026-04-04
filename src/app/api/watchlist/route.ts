import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface WatchlistItem {
  symbol: string;
  name: string;
  sector: string;
}

const MAX_WATCHLIST_SIZE = 20;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const watchlist: WatchlistItem[] = data?.watchlist ?? [];
    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json(
      { error: "관심종목을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const watchlist: WatchlistItem[] = Array.isArray(body.watchlist)
      ? body.watchlist.slice(0, MAX_WATCHLIST_SIZE)
      : [];

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          watchlist,
          updated_at: now,
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

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Failed to save watchlist:", error);
    return NextResponse.json(
      { error: "관심종목 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
