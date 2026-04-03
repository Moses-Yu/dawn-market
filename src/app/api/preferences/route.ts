import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  VALID_SECTORS,
  VALID_ALERT_THRESHOLDS,
  type SectorType,
  type AlertSeverityThreshold,
  type UserPreferences,
  type UserPreferencesInput,
} from "@/lib/types/preferences";

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
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Failed to fetch preferences:", error);
      return NextResponse.json(
        { error: "설정을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    const preferences: UserPreferences = {
      userId: user.id,
      preferredSectors: (data?.preferred_sectors as SectorType[]) ?? [],
      alertSeverityThreshold:
        (data?.alert_severity_threshold as AlertSeverityThreshold) ?? "medium",
      createdAt: data?.created_at ?? new Date().toISOString(),
      updatedAt: data?.updated_at ?? new Date().toISOString(),
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { error: "설정을 불러오는데 실패했습니다." },
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

    const body: UserPreferencesInput = await request.json();

    // Validate sectors
    const preferredSectors = (body.preferredSectors ?? []).filter(
      (s): s is SectorType =>
        VALID_SECTORS.includes(s as SectorType)
    );

    // Validate alert threshold
    const alertSeverityThreshold: AlertSeverityThreshold =
      body.alertSeverityThreshold &&
      VALID_ALERT_THRESHOLDS.includes(
        body.alertSeverityThreshold as AlertSeverityThreshold
      )
        ? (body.alertSeverityThreshold as AlertSeverityThreshold)
        : "medium";

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          preferred_sectors: preferredSectors,
          alert_severity_threshold: alertSeverityThreshold,
          updated_at: now,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to save preferences:", error);
      return NextResponse.json(
        { error: "설정 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    const preferences: UserPreferences = {
      userId: data.user_id,
      preferredSectors: data.preferred_sectors as SectorType[],
      alertSeverityThreshold:
        data.alert_severity_threshold as AlertSeverityThreshold,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Failed to save preferences:", error);
    return NextResponse.json(
      { error: "설정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
