import type { ReactNode } from "react";
import { DialogueHeading } from "@/components/type/DialogueHeading";

/** A chapter's heading: the shared section head (title 1–8, the lead 9–12 on its last baseline). */
export function ChapterHead({ id, q, a, children }: { id: string; q: string; a: string; children: ReactNode }) {
  return (
    <header className="section-head" data-mn-head>
      <DialogueHeading id={`${id}-title`} q={q} a={a} />
      <p className="lead">{children}</p>
    </header>
  );
}
