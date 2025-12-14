"use client";

import { useEffect, useMemo, useState } from "react";
import { SLOTS } from "@/lib/slots";

type Booking = { slot: string; name: string };

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function ymFromDate(date: string) {
  return date.slice(0, 7);
}
function toDateParts(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return { y, m };
}
function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}
function weekdayOfFirst(y: number, m: number) {
  return new Date(y, m - 1, 1).getDay();
}

// ✅ helpers para navegar meses
function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + delta);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}
function firstDayISO(ym: string) {
  return `${ym}-01`;
}

export default function Page() {
  const [date, setDate] = useState(todayISO());
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  const [monthMap, setMonthMap] = useState<Record<string, Booking[]>>({});
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);

  // ✅ mes visible (para poder ir a enero/febrero sin depender del date)
  const [viewYm, setViewYm] = useState(ymFromDate(todayISO()));

  // si el usuario hace click en un día (setDate), el calendario acompaña ese mes
  useEffect(() => {
    setViewYm(ymFromDate(date));
  }, [date]);

  const { y, m } = useMemo(() => toDateParts(viewYm), [viewYm]);

  // Month summary (colors) — ahora depende del mes visible
  useEffect(() => {
    fetch(`/api/month?ym=${encodeURIComponent(viewYm)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setMonthMap(j && typeof j.byDate === "object" ? j.byDate : {}))
      .catch(() => setMonthMap({}));
  }, [viewYm]);

  // Day detail (who booked what)
  useEffect(() => {
    setStatus("");
    fetch(`/api/day?date=${encodeURIComponent(date)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setDayBookings(Array.isArray(j.bookings) ? j.bookings : []))
      .catch(() => setDayBookings([]));
  }, [date]);

  const bySlot = useMemo(() => {
    const map = new Map<string, Booking>();
    dayBookings.forEach((b) => map.set(b.slot, b));
    return map;
  }, [dayBookings]);

  async function refresh() {
    const d = await fetch(`/api/day?date=${encodeURIComponent(date)}`, { cache: "no-store" }).then((r) => r.json());
    setDayBookings(Array.isArray(d.bookings) ? d.bookings : []);

    const mo = await fetch(`/api/month?ym=${encodeURIComponent(viewYm)}`, { cache: "no-store" }).then((r) => r.json());
    setMonthMap(mo && typeof mo.byDate === "object" ? mo.byDate : {});
  }

  async function reservar(slot: string) {
    setStatus("");
    if (!name.trim()) return setStatus("Poné tu nombre");

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, slot, name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(j.error || "Error reservando");

    setStatus("Reserva confirmada ✅");
    await refresh();
  }

  async function cancelar(slot: string) {
    setStatus("");
    const res = await fetch("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, slot }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(j.error || "Error cancelando");

    setStatus("Reserva eliminada 🗑️");
    await refresh();
  }

  // Calendar cells (usa y,m del viewYm)
  const calCells = useMemo(() => {
    const totalDays = daysInMonth(y, m);
    const firstW = weekdayOfFirst(y, m);
    const cells: (null | { day: number; iso: string; count: number })[] = [];

    for (let i = 0; i < firstW; i++) cells.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const iso = `${y}-${mm}-${dd}`;
      const count = monthMap[iso]?.length ?? 0;
      cells.push({ day: d, iso, count });
    }

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [y, m, monthMap]);

  const monthLabel = useMemo(() => {
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString("es-AR", { month: "long", year: "numeric" });
  }, [y, m]);

  const maxSlots = SLOTS.length;
  function dayBg(count: number, selected: boolean) {
    if (selected) return "#333";
    if (count === 0) return "rgba(0, 200, 120, 0.12)";
    if (count < maxSlots) return "rgba(255, 200, 0, 0.12)";
    return "rgba(255, 80, 80, 0.12)";
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 640, width: "100%", padding: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>🏊‍♂️ Pileta Monino</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Elegí un día y reservá un turno.</p>

        {/* Calendar */}
        <div style={{ marginTop: 18, border: "1px solid #333", borderRadius: 14, padding: 16 }}>
          {/* ✅ header con flechas */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>Calendario</div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => {
                  const next = addMonths(viewYm, -1);
                  setViewYm(next);
                  setDate(firstDayISO(next));
                }}
                style={{
                  border: "1px solid #666",
                  background: "transparent",
                  color: "white",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                  opacity: 0.9,
                }}
                aria-label="Mes anterior"
                title="Mes anterior"
              >
                ←
              </button>

              <div style={{ opacity: 0.9 }}>{monthLabel}</div>

              <button
                onClick={() => {
                  const next = addMonths(viewYm, 1);
                  setViewYm(next);
                  setDate(firstDayISO(next));
                }}
                style={{
                  border: "1px solid #666",
                  background: "transparent",
                  color: "white",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                  opacity: 0.9,
                }}
                aria-label="Mes siguiente"
                title="Mes siguiente"
              >
                →
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, opacity: 0.7 }}>
            {["D", "L", "M", "M", "J", "V", "S"].map((w, i) => (
              <div key={`${w}-${i}`} style={{ textAlign: "center", fontSize: 12 }}>{w}</div>
            ))}
          </div>

          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {calCells.map((c, idx) => {
              if (!c) return <div key={idx} style={{ height: 42 }} />;
              const selected = c.iso === date;
              return (
                <button
                  key={c.iso}
                  onClick={() => setDate(c.iso)}
                  style={{
                    height: 42,
                    borderRadius: 10,
                    border: "1px solid #444",
                    background: dayBg(c.count, selected),
                    color: "white",
                    cursor: "pointer",
                  }}
                  title={c.count === 0 ? "Libre" : c.count < maxSlots ? "Parcial" : "Completo"}
                >
                  {c.day}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, fontSize: 12, opacity: 0.8 }}>
            <span>🟩 libre</span>
            <span>🟨 parcial</span>
            <span>🟥 completo</span>
            <span style={{ marginLeft: "auto" }}>Día: <strong>{date}</strong></span>
          </div>
        </div>

        {/* Name */}
        <div style={{ marginTop: 18 }}>
          <label style={{ fontWeight: 700 }}>Tu nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Felipe"
            style={{
              display: "block",
              marginTop: 8,
              padding: 10,
              width: "100%",
              fontSize: 16,
              borderRadius: 10,
              border: "1px solid #333",
              background: "transparent",
              color: "white",
            }}
          />
        </div>

        {/* Slots */}
        <div style={{ marginTop: 16, border: "1px solid #333", borderRadius: 14, padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Turnos para {date}</div>

          <div style={{ display: "grid", gap: 10 }}>
            {SLOTS.map((s) => {
              const b = bySlot.get(s.id);
              const ocupado = !!b;

              return (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid #444",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    opacity: ocupado ? 0.85 : 1,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>{s.label}</div>
                    <div style={{ marginTop: 2, opacity: 0.8, fontSize: 13 }}>
                      {ocupado ? `Ocupado — ${b?.name}` : "Libre"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => reservar(s.id)}
                      disabled={ocupado}
                      style={{
                        border: "1px solid #666",
                        background: ocupado ? "transparent" : "#111",
                        color: "white",
                        borderRadius: 10,
                        padding: "10px 12px",
                        cursor: ocupado ? "not-allowed" : "pointer",
                        fontSize: 14,
                        fontWeight: 800,
                        opacity: ocupado ? 0.4 : 1,
                        minWidth: 110,
                      }}
                    >
                      {ocupado ? "Ocupado" : "Reservar"}
                    </button>

                    {ocupado && (
                      <button
                        onClick={() => cancelar(s.id)}
                        style={{
                          border: "1px solid #666",
                          background: "transparent",
                          color: "white",
                          borderRadius: 10,
                          padding: "10px 12px",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 800,
                          opacity: 0.8,
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {status && <div style={{ marginTop: 12, opacity: 0.9 }}>{status}</div>}
        </div>
      </div>
    </main>
  );
}