"use server";

import { createClient } from "@/lib/supabase/server";

const VALID_SECTORS = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
];

export async function updateSectorPreferences(sectors: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Validate input
  const validSectors = sectors.filter((s) => VALID_SECTORS.includes(s));

  const { error } = await supabase
    .from("user_profiles")
    .update({ interests: validSectors, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: "설정 저장에 실패했습니다." };
  }

  return { success: true, sectors: validSectors };
}

export async function getSectorPreferences(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("user_profiles")
    .select("interests")
    .eq("id", user.id)
    .single();

  return data?.interests ?? [];
}
