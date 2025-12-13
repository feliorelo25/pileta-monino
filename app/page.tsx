"use client";

import { useEffect, useMemo, useState } from "react";

const SLOTS = [
  { id: "mañana", label: "☀️ Mañana (10:00 – 13:30)" },
  { id: "tarde", label: "🌤️ Tarde (13:30 – 19:00)" },
  { id: "noche", label: "🌙 Noche (19:00 – 22:30)" },
];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function Page() {
  const [date, setDate] = useState(todayISO());
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setStatus("");
    fetch(`/api/availability?date=${encodeURIComponent(date)}`)
      .then((r) => r.json())
      .then((j) => setTaken(Array.isArray(j.taken) ? j.taken : []))
      .catch(() => setTaken([]));
  }, [date]);

  const takenSet = useMemo(() => new Set(taken), [taken]);

  async function reservar() {
    setStatus("");
    if (!slot) return setStatus("Elegí un turno");
    if (!name.trim()) return setStatus("Poné tu nombre");
    if (takenSet.has(slot)) return setStatus("Ese turno ya está ocupado");

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, slot, name }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(j.error || "Error reservando");

    setStatus("Reserva confirmada ✅");

    // refrescar ocupados
    const a = await fetch(`/api/availability?date=${encodeURIComponent(date)}`).then((r) =>
      r.json()
    );
    setTaken(Array.isArray(a.taken) ? a.taken : []);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, width: "100%", padding: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>🏊‍♂️ Pileta Monino</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Elegí día y turno</p>

        <div style={{ marginTop: 24 }}>
          <label style={{ fontWeight: 500 }}>Día</label>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => (e.currentTarget as any).showPicker?.()}
            style={{
              display: "block",
              marginTop: 8,
              padding: 10,
              width: "100%",
              fontSize: 16,
              cursor: "pointer",
            }}
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={{ fontWeight: 500 }}>Turno</label>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {SLOTS.map((s) => {
              const ocupado = takenSet.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => !ocupado && setSlot(s.id)}
                  disabled={ocupado}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #444",
                    background: slot === s.id ? "#333" : "transparent",
                    color: "white",
                    cursor: ocupado ? "not-allowed" : "pointer",
                    fontSize: 15,
                    opacity: ocupado ? 0.35 : 1,
                  }}
                >
                  {s.label} {ocupado ? "— Ocupado" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={{ fontWeight: 500 }}>Tu nombre</label>
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
            }}
          />
        </div>

        <button
          onClick={reservar}
          style={{
            marginTop: 18,
            padding: 12,
            width: "100%",
            borderRadius: 10,
            border: "1px solid #444",
            background: "#111",
            color: "white",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Reservar
        </button>

        {status && (
          <div style={{ marginTop: 12, opacity: 0.85 }}>
            {status}
          </div>
        )}
      </div>
    </main>
  );
}
