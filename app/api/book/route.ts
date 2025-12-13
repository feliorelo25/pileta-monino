import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidSlot } from "@/lib/slots";

export async function POST(req: Request) {
  try {
    const { date, slot, name } = await req.json();

    if (!date || !slot || !name) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }
    if (!isValidSlot(slot)) {
      return NextResponse.json({ error: "Slot inválido" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("bookings").insert({
      date,
      slot,
      name,
      cancelled: false,
    });

    if (error) {
      if ((error as any).code === "23505" || String(error.message).toLowerCase().includes("duplicate")) {
        return NextResponse.json({ error: "Ese turno ya está reservado" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error inesperado" }, { status: 500 });
  }
}