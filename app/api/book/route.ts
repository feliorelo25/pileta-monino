import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = { date: string; slot: string; name: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Body>;
  const date = (body.date || "").trim();
  const slot = (body.slot || "").trim();
  const name = (body.name || "").trim();

  if (!date || !slot || !name) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("bookings").insert({
    date,
    slot,
    name,
    note: null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
