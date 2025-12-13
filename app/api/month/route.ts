import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidSlot } from "@/lib/slots";

function startOfMonth(ym: string) {
  return `${ym}-01`;
}
function startOfNextMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ym = searchParams.get("ym");
  if (!ym) return NextResponse.json({ error: "Missing ym" }, { status: 400 });

  const start = startOfMonth(ym);
  const end = startOfNextMonth(ym);

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("date,slot,name")
    .gte("date", start)
    .lt("date", end)
    .eq("cancelled", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byDate: Record<string, { slot: string; name: string }[]> = {};
  for (const r of data ?? []) {
    if (!r.date || !isValidSlot(r.slot)) continue;
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push({ slot: r.slot, name: r.name || "—" });
  }

  return NextResponse.json({ byDate });
}