import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("slot")
    .eq("date", date)
    .eq("cancelled", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const taken = Array.from(new Set((data ?? []).map((r) => r.slot)));
  return NextResponse.json({ taken });
}
