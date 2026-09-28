import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Props = {
  as?: "h2" | "h3";
  /** The section's plain name («Кофе»). Not shown; it is the title only when there is no `a` and no children. */
  q: string;
  /** The title, in display type («А с кофе мы не шутим.»). Without it (and without children), `q` is the title. */
  a?: string;
  /**
   * A question line over the title, in the thin display voice («А кофе?»). Only the coffee poster asks
   * one. It is part of the heading, so the heading reads «А кофе? А с кофе мы не шутим.».
   */
  ask?: string;
  id?: string;
  className?: string;
  answerClassName?: string;
  /** Extra title content, rendered after the title inside the heading. */
  children?: ReactNode;
};

/**
 * Every section heading: one title in heavy condensed caps. No dashes. Put it in a `.section-head`
 * with an optional `.lead` sibling to get the shared desktop layout. data-dlg-q (the `ask` line) and
 * data-dlg-a (the title) are motion hooks.
 */
export function DialogueHeading({ as: Tag = "h2", q, a, ask, id, className, answerClassName, children }: Props) {
  const title = a ?? (children ? undefined : q);
  return (
    <Tag id={id} className={cn("dlg", className)}>
      {ask && (
        <>
          <span className="dlg-ask" data-dlg-q>
            {ask}
          </span>{" "}
        </>
      )}
      {title && (
        <span className={cn("dlg-title display", answerClassName)} data-dlg-a>
          {title}
        </span>
      )}
      {children}
    </Tag>
  );
}
