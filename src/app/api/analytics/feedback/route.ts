import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feedback_type, rating, message, page_path, email, session_id } =
      body as {
        feedback_type?: string;
        rating?: number;
        message?: string;
        page_path?: string;
        email?: string;
        session_id?: string;
      };

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 chars)" },
        { status: 400 }
      );
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be 1-5" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from("user_feedback").insert({
      feedback_type: feedback_type || "general",
      rating: rating || null,
      message: message.trim(),
      page_path: page_path || null,
      email: email || null,
      session_id: session_id || null,
    });

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
