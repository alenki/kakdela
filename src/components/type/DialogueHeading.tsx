import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Props = {
  as?: "h2" | "h3";
  /** Question line (thin voice). */
  q: string;
  /** Answer line (heavy voice). Optional: some sections only ask. */
  a?: string;
  id?: string;
  className?: string;
  answerClassName?: string;
  children?: ReactNode;
};

/**
 * Russian dialogue typesetting: every line opens with a real em-dash (read naturally by screen
 * readers), set in tomato. Question in the thin voice, answer in the heavy voice.
 */
export function DialogueHeading({ as: Tag = "h2", q, a, id, className, answerClassName, children }: Props) {
  return (
    <Tag id={id} className={cn("dlg", className)}>
      <span className="dlg-line dlg-q q-voice" data-dlg-q>
        <span className="dash">—</span> {q}
      </span>
      {a && (
        <span className={cn("dlg-line dlg-a a-voice", answerClassName)} data-dlg-a>
          <span className="dash">—</span>
          {a}
        </span>
      )}
      {children}
    </Tag>
  );
}
