import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Props = {
  /** h1 only for a page's masthead (the /menu page); sections use h2. */
  as?: "h1" | "h2" | "h3";
  /** The small label above the title: the section's plain name («Кофе»). */
  q: string;
  /** The title, in display type («А с кофе мы не шутим.»). Without it (and without children), `q` is the title. */
  a?: string;
  id?: string;
  className?: string;
  answerClassName?: string;
  /** Extra title content, rendered after the title inside the heading. */
  children?: ReactNode;
};

/**
 * Every section heading: a sentence-case label over one title in heavy condensed caps. No dashes. Put
 * it in a `.section-head` with an optional `.lead` sibling to get the shared desktop layout.
 * data-dlg-q / data-dlg-a are motion hooks.
 */
export function DialogueHeading({ as: Tag = "h2", q, a, id, className, answerClassName, children }: Props) {
  const title = a ?? (children ? undefined : q);
  const label = title === q ? undefined : q;
  return (
    <Tag id={id} className={cn("dlg", className)}>
      {label && (
        <span className="dlg-label label" data-dlg-q>
          {label}
        </span>
      )}{" "}
      {title && (
        <span className={cn("dlg-title display", answerClassName)} data-dlg-a>
          {title}
        </span>
      )}
      {children}
    </Tag>
  );
}
