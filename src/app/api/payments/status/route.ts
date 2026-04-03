import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/subscription";

export async function GET() {
  try {
    const info = await getUserSubscription();
    return NextResponse.json(info);
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
