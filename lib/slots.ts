export type Slot = { id: string; label: string };

export const SLOTS: Slot[] = [
  { id: "10:00-13:30", label: "10:00 – 13:30" },
  { id: "13:30-19:00", label: "13:30 – 19:00" },
  { id: "19:00-22:30", label: "19:00 – 22:30" },
];

export function isValidSlot(slot: string) {
  return SLOTS.some((s) => s.id === slot);
}
