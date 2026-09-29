import { cafes } from "@/content/cafes";
import { readNote, type NoteState } from "@/lib/feedback";

const CAFE_IDS = new Set(cafes.map((c) => c.id));

/**
 * The static export's stand-in for `sendNote` (next.config.ts aliases it in): a static host has no
 * server to send from, so the note is never sent and the guest is told so, as when mail isn't set up.
 */
export async function sendNote(_prev: NoteState, form: FormData): Promise<NoteState> {
  return { status: "failed", fields: readNote((key) => form.get(key), CAFE_IDS) };
}
