import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidSlot } from "@/lib/slots";

export async function POST(req: Request) {
  const { date, slot } = await req.json();

  if (!date || !slot) return NextResponse.json({ error: "Missing date or slot" }, { status: 400 });
  if (!isValidSlot(slot)) return NextResponse.json({ error: "Slot inválido" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ cancelled: true })
    .eq("date", date)
    .eq("slot", slot);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}