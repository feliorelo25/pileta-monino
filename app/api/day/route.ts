import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidSlot } from "@/lib/slots";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("slot,name")
    .eq("date", date)
    .eq("cancelled", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bookings = (data ?? [])
    .filter((r: any) => isValidSlot(r.slot))
    .map((r: any) => ({ slot: r.slot as string, name: r.name as string }));

  return NextResponse.json({ bookings });
}