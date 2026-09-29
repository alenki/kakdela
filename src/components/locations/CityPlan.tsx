import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import nalchikPrint from "@/assets/plans/nalchik.svg";
import vladikavkazPrint from "@/assets/plans/vladikavkaz.svg";
import { cafesByCity } from "@/content/cafes";
import { planFrames } from "@/content/plans";
import { external } from "@/content/routes";
import type { City } from "@/content/types";
import { labelSide, labelUnits, PHONE_MIN_UNITS, pct, project, spread } from "@/lib/plan";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { shortAddress } from "./address";

const PRINTS: Record<City, StaticImageData> = { nalchik: nalchikPrint, vladikavkaz: vladikavkazPrint };

const at = (v: number) => `${v.toFixed(3)}%`;

/**
 * The city's pocket plan: a sheet of the notice's paper with the real streets engraved in ink (the print, a
 * static SVG drawn from OpenStreetMap by scripts/fetch-plans.mjs), the cafés as numbered marks keyed to the list,
 * the cartouche with the scale, and the credit under it. The print is the named image; the marks, the guest and
 * the line are one layer over it, hidden from screen readers and out of the tab order: the list is the readable
 * plan. Marks are links to their rows, for the pointer. Phones set the closest marks a few pixels apart.
 */
export function CityPlan({ city }: { city: City }) {
  const frame = planFrames[city];
  const list = cafesByCity(city);
  const points = list.map((c) => project(frame, c.coords));
  const phone = spread(points, PHONE_MIN_UNITS);
  const scale = frame.scaleM / frame.widthM;

  return (
    <div className="lc-plan" data-lc-plan={city}>
      <div className="lc-plan__sheet">
        <div className="lc-plan__map" data-lc-map>
          {/* Eager: the print is the desktop's largest paint, and the other city's is only a few KB. */}
          <Image src={PRINTS[city]} alt={typograf(t.locationsPage.plan.label(city, list.length))} fill unoptimized loading="eager" className="lc-plan__print" />

          <div className="lc-plan__marks" aria-hidden="true" data-lc-marks>
            {/* The guest's way to the café, as the crow flies: a dotted line (the notice's perforation), revealed
                by its mask. No viewBox: its units are the layer's px, and % coordinates meet the marks exactly. */}
            <svg className="lc-plan__way">
              <defs>
                <mask id={`lc-reveal-${city}`} maskUnits="userSpaceOnUse" x="-5%" y="-5%" width="110%" height="110%">
                  <line data-lc-reveal stroke="#fff" strokeWidth="12" strokeLinecap="round" />
                </mask>
              </defs>
              <line className="lc-plan__line" data-lc-line mask={`url(#lc-reveal-${city})`} />
            </svg>

            <span className="lc-you" data-lc-you hidden>
              <span className="lc-you__ring" />
              <span className="lc-you__dot" />
              <span className="lc-you__label label">{t.locationsPage.plan.you}</span>
            </span>

            {list.map((c, i) => {
              const label = shortAddress(c.address);
              const others = points.filter((_, j) => j !== i);
              const p = pct(points[i]);
              const s = pct(phone[i]);
              return (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="lc-mk"
                  data-lc-mk={c.id}
                  data-side={labelSide(points[i], others, labelUnits(label))}
                  data-open={c.open}
                  data-close={c.close}
                  tabIndex={-1}
                  style={{ "--x": at(p.x), "--y": at(p.y), "--xs": at(s.x), "--ys": at(s.y) } as CSSProperties}
                >
                  <span className="lc-mk__drop">
                    <span className="lc-mk__disc display">{i + 1}</span>
                  </span>
                  <span className="lc-mk__label display">{typograf(label)}</span>
                </a>
              );
            })}
          </div>

          <div className="lc-plan__cartouche" data-corner={frame.cartouche} aria-hidden="true">
            <span className="lc-plan__title display">{t.city[city]}</span>
            <span className="lc-plan__scale label mono" style={{ "--bar": scale } as CSSProperties}>
              <span className="lc-plan__bar" />
              <span className="lc-plan__ticks">
                <span>0</span>
                <span>{t.locationsPage.plan.scale(frame.scaleM)}</span>
              </span>
            </span>
          </div>
        </div>

        <p className="lc-plan__foot label">
          <a className="dlink" href={external.osmCopyright} target="_blank" rel="noreferrer">
            {t.locationsPage.plan.credit}
            <span className="dlink__ext" aria-hidden="true">↗</span>
            <span className="sr-only"> {t.a11y.newTab}</span>
          </a>
        </p>
      </div>
    </div>
  );
}
