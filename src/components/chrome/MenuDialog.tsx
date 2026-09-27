"use client";

import { useEffect, useRef, useState } from "react";
import type { RouteKey } from "@/content/routes";
import { RouteLink } from "./RouteLink";
import { CitySwitch } from "./CitySwitch";
import { CafeStatus } from "./CafeStatus";
import { cafes, flagship } from "@/content/cafes";
import { external } from "@/content/routes";
import type { City } from "@/content/types";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

type LenisLike = { stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

// The four places, set large; the services follow in the text face (the footer splits them the same way).
const PRIMARY: RouteKey[] = ["menu", "locations", "events", "about"];
const primary = t.nav.links.filter((l) => PRIMARY.includes(l.key));
const services = t.nav.links.filter((l) => !PRIMARY.includes(l.key));
const CITIES = Object.keys(flagship) as City[];

/** «Разделы»: native modal dialog (top layer, inert page, Esc, focus return for free). */
export function MenuDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => {
      setOpen(false);
      document.documentElement.removeAttribute("data-dialog");
      lenis()?.start();
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const show = () => {
    const d = ref.current;
    if (!d) return;
    d.showModal();
    setOpen(true);
    document.documentElement.setAttribute("data-dialog", "");
    lenis()?.stop();
  };
  const hide = () => ref.current?.close();

  return (
    <>
      <button type="button" className="hdr-burger" aria-haspopup="dialog" aria-expanded={open} onClick={show}>
        <span className="hdr-burger__label">{t.nav.sections}</span>
        <span className="hdr-burger__lines" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>
      <dialog
        ref={ref}
        className="menu-dialog field"
        data-theme="cream"
        aria-label={t.nav.sections}
        data-lenis-prevent
      >
        <div className="menu-dialog__inner wrap">
          <div className="menu-dialog__top">
            <span className="label">{t.nav.sections}</span>
            <button type="button" className="menu-dialog__close" onClick={hide}>
              {t.nav.close}
              <span className="menu-dialog__x" aria-hidden="true" />
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
            <ul className="menu-dialog__cafes" role="list">
              {cafes.map((c) => (
                <li key={c.id} data-city-only={c.city}>
                  <span className="menu-dialog__addr">{typograf(c.address)}</span>
                  <CafeStatus cafe={c} />
                </li>
              ))}
            </ul>
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
      </dialog>
    </>
  );
}
