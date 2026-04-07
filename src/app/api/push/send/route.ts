import { NextResponse } from "next/server";
import { sendPushToAll, type PushPayload } from "@/lib/push/server";

export async function POST(request: Request) {
  // Protected endpoint — requires PIPELINE_API_KEY
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload: PushPayload = {
      title: body.title || "새벽시장",
      body: body.body || "새로운 알림이 있습니다.",
      url: body.url,
      tag: body.tag,
    };

    const result = await sendPushToAll(payload);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json(
      {
        error: "Failed to send push notifications",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
