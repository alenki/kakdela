"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RouteKey } from "@/content/routes";
import { RouteLink } from "./RouteLink";
import { CitySwitch } from "./CitySwitch";
import { CafeStatus } from "./CafeStatus";
import { cafes, flagship } from "@/content/cafes";
import { external } from "@/content/routes";
import type { City } from "@/content/types";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { useMotionMode } from "@/lib/motion";
import { bindRoll, type Roll } from "./menu-roll";

type LenisLike = { stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

// The five places, set large; the services follow in the text face (the footer splits them the same way).
const PRIMARY: RouteKey[] = ["home", "menu", "about", "locations", "feedback"];
const primary = t.nav.links.filter((l) => PRIMARY.includes(l.key));
const services = t.nav.links.filter((l) => !PRIMARY.includes(l.key));
const CITIES = Object.keys(flagship) as City[];

/**
 * «Разделы»: native modal dialog (top layer, inert page, Esc, focus return for free), set on a sheet off
 * the café's paper roll. It comes down when opened and rolls back up when closed (menu-roll.ts). Every
 * way out goes through hide(): the button, a link and Esc all roll the sheet up first and close the
 * dialog when it is out of sight, so the close is seen in every browser, not only where CSS can keep
 * a closed dialog painted.
 */
export function MenuDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const roll = useRef<Roll | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  // True from hide() until the dialog has closed: the sheet is rolling up.
  const leaving = useRef(false);
  const [open, setOpen] = useState(false);
  const mode = useMotionMode();

  const hide = useCallback(() => {
    const d = ref.current;
    if (!d?.open || leaving.current) return;
    leaving.current = true;
    // The header's plate comes back while the sheet rolls up, not after.
    document.documentElement.removeAttribute("data-dialog");
    if (roll.current) roll.current.close(() => d.close());
    else d.close();
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const r = bindRoll(d);
    roll.current = r;
    // Esc rolls it up like the button, instead of closing at once.
    const onCancel = (e: Event) => {
      e.preventDefault();
      hide();
    };
    const onClose = () => {
      setOpen(false);
      document.documentElement.removeAttribute("data-dialog");
      lenis()?.start();
      // Closed by the browser itself (it may refuse to hold a second Esc): roll up anyway; chrome.css
      // keeps the closed dialog painted for it where it can.
      if (!leaving.current) r.close();
      leaving.current = false;
    };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("close", onClose);
    return () => {
      d.removeEventListener("cancel", onCancel);
      d.removeEventListener("close", onClose);
      r.kill();
      roll.current = null;
    };
  }, [hide]);

  // Reduced motion switched on mid-move: finish it at once.
  useEffect(() => {
    if (mode !== "full") roll.current?.settle();
  }, [mode]);

  const show = () => {
    const d = ref.current;
    if (!d || d.open) return;
    leaving.current = false;
    d.showModal();
    // Before the first paint: the sheet starts above the screen, not at rest.
    roll.current?.open();
    // On a short screen the page's scroller is focusable and comes first: start on «Закрыть» instead.
    // No scrolling: the sheet may still be above the screen.
    closeBtn.current?.focus({ preventScroll: true });
    setOpen(true);
    document.documentElement.setAttribute("data-dialog", "");
    lenis()?.stop();
  };

  return (
    <>
      <button
        type="button"
        className="hdr-burger"
        aria-label={t.nav.sections}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
      >
        <span className="hdr-burger__lines" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>
      <dialog ref={ref} className="menu-dialog" data-theme="cream" aria-label={t.nav.sections} data-lenis-prevent>
        {/* The sheet: under the paper its shadow, the lighter rim of its rip and a soft shade that only
            shows while it moves (chrome.css). The page scrolls inside the paper. */}
        <div className="menu-dialog__sheet" data-roll="sheet">
          <div className="menu-dialog__shade" data-roll="shade" aria-hidden="true" />
          <div className="menu-dialog__shadow" data-roll="shadow" aria-hidden="true" />
          <div className="menu-dialog__fibres" data-roll="fibres" aria-hidden="true" />
          <div className="menu-dialog__paper field" data-roll="paper">
            <div className="menu-dialog__scroll" data-roll="scroll">
              <div className="menu-dialog__inner wrap">
                <div className="menu-dialog__top">
                  <button ref={closeBtn} type="button" className="menu-dialog__close" onClick={hide}>
                    <span className="menu-dialog__close-label">{t.nav.close}</span>
                    <span className="menu-dialog__x" aria-hidden="true">
                      <span />
                      <span />
                    </span>
                  </button>
                </div>

                <nav className="menu-dialog__nav" aria-label={t.nav.sections}>
                  <ul className="menu-dialog__primary" role="list">
                    {primary.map((l) => (
                      <li key={l.key}>
                        <RouteLink to={l.key} className="menu-link display" onClick={hide}>
                          {l.label}
                        </RouteLink>
                      </li>
                    ))}
                  </ul>
                  <ul className="menu-dialog__services" role="list">
                    {services.map((l) => (
                      <li key={l.key}>
                        <RouteLink to={l.key} className="menu-service" onClick={hide}>
                          {l.label}
                        </RouteLink>
                      </li>
                    ))}
                  </ul>
                </nav>

                <aside className="menu-dialog__side">
                  <CitySwitch className="menu-dialog__city" />
                  {/* Both cities' lists share one cell, so the longer one holds the height and the contacts stay put. */}
                  <div className="menu-dialog__places">
                    {CITIES.map((city) => (
                      <ul key={city} className="menu-dialog__cafes" role="list" data-city-hold={city}>
                        {cafes
                          .filter((c) => c.city === city)
                          .map((c) => (
                            <li key={c.id}>
                              <span className="menu-dialog__addr">{typograf(c.address)}</span>
                              <CafeStatus cafe={c} />
                            </li>
                          ))}
                      </ul>
                    ))}
                  </div>
                  <div className="menu-dialog__contacts">
                    {CITIES.map((city) => (
                      <a key={city} className="mono menu-dialog__phone" href={`tel:${flagship[city].phone}`} data-city-only={city}>
                        {flagship[city].phoneDisplay}
                      </a>
                    ))}
                    <a className="dlink" href={external.telegram} target="_blank" rel="noreferrer">
                      Telegram<span className="dlink__ext" aria-hidden="true">↗</span>
                      <span className="sr-only"> {t.a11y.newTab}</span>
                    </a>
                    <a className="dlink" href={external.instagram} target="_blank" rel="noreferrer">
                      Instagram<span className="dlink__ext" aria-hidden="true">↗</span>
                      <span className="sr-only"> {t.a11y.newTab}</span>
                    </a>
                  </div>
                  <p className="label menu-dialog__note">{t.nav.halal}</p>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
