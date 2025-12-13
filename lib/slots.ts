export const SLOTS = [
  { id: "manana", label: "☀️ Mañana (10:00 – 13:30)" },
  { id: "tarde", label: "🌤️ Tarde (13:30 – 19:00)" },
  { id: "noche", label: "🌙 Noche (19:00 – 22:30)" },
] as const;

export type SlotId = (typeof SLOTS)[number]["id"];

export function isValidSlot(slot: string): slot is SlotId {
  return SLOTS.some((s) => s.id === slot);
}