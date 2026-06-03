import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const provider = formData.get("provider") as "google" | "github";

  const supabase = await createClient();
  const origin = request.nextUrl.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
  }

  return NextResponse.redirect(data.url);
}
