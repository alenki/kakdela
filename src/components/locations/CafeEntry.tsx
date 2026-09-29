import type { CSSProperties, ReactNode } from "react";
import type { Cafe } from "@/content/types";
import { yandexReviews, yandexRoute } from "@/content/routes";
import { Photo } from "@/components/brand/Photo";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { featureLine, splitAddress } from "./address";
import { InviteButton } from "./islands/InviteButton";

function External({ href, children, className, describedBy }: { href: string; children: ReactNode; className?: string; describedBy?: string }) {
  return (
    <a className={className ? `dlink ${className}` : "dlink"} href={href} target="_blank" rel="noreferrer" aria-describedby={describedBy}>
      {children}
      <span className="dlink__ext" aria-hidden="true">↗</span>
      <span className="sr-only"> {t.a11y.newTab}</span>
    </a>
  );
}

/**
 * One café of the plan's legend: its key, the address as the item title, whether it is open now, what it has,
 * what guests say on Yandex, and the ways there (call, route, ask a friend along). The row is the target of
 * /locations#<id>, where the plan's marks and a friend's link land. The photo comes last in the source, so a
 * screen reader meets the address first; the grid sets it beside the words.
 */
export function CafeEntry({ cafe: c, n }: { cafe: Cafe; n: number }) {
  const { pre, rest } = splitAddress(c.address);
  const titleId = `${c.id}-title`;
  return (
    <li
      id={c.id}
      className="lc-cafe"
      data-lc-cafe={c.id}
      data-lc-rise
      style={c.photo.thumb ? ({ "--lc-photo-pos": `${c.photo.thumb.x * 100}% ${c.photo.thumb.y * 100}%` } as CSSProperties) : undefined}
    >
      <div className="lc-cafe__body">
        <div className="lc-cafe__head">
          <span className="lc-key display" aria-hidden="true">
            {n}
          </span>
          <h3 id={titleId} className="lc-cafe__addr display item-title">
            {/* NBSP, not a space: Chrome drops a span's trailing space from the heading's accessible name. */}
            {pre && <span className="lc-cafe__pre">{pre}{NBSP}</span>}
            {typograf(rest)}
          </h3>
          {c.alias && <span className="lc-cafe__alias">{c.alias}</span>}
        </div>

        <p className="lc-cafe__when">
          <CafeStatus cafe={c} hoursWhenClosed />
          {/* A friend's invitation (shown before paint from html[data-lc-invited]), then the distance once asked. */}
          <span className="lc-cafe__invited label">{t.locationsPage.invited}</span>
          <span className="lc-cafe__near label" data-lc-near hidden />
        </p>
        <p className="lc-cafe__feat label">{typograf(featureLine(c.tags))}</p>
        <p className="lc-cafe__rating label">
          <External href={yandexReviews(c.yandexOrgId)} describedBy={titleId}>
            {typograf(t.locationsPage.rating(c.rating, c.ratingsCount))}
          </External>
        </p>

        <p className="lc-cafe__ways">
          <a className="dlink mono lc-cafe__tel" href={`tel:${c.phone}`}>
            <span className="sr-only">{t.locations.call}: </span>
            {c.phoneDisplay}
          </a>
          <External className="lc-cafe__route" href={yandexRoute(c.coords.lat, c.coords.lon)} describedBy={titleId}>
            {t.locations.route}
          </External>
          <InviteButton id={c.id} address={c.address} titleId={titleId} />
        </p>
      </div>
      <Photo
        photo={c.photo}
        aspect="4/5"
        sizes="(min-width: 1024px) 14vw, (min-width: 480px) 128px, max(96px, 27vw)"
        loading="lazy"
        className="lc-cafe__photo"
      />
    </li>
  );
}
