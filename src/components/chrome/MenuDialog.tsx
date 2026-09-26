"use client";

import { useEffect, useRef, useState } from "react";
import { RouteLink } from "./RouteLink";
import { CitySwitch } from "./CitySwitch";
import { CafeStatus } from "./CafeStatus";
import { cafes } from "@/content/cafes";
import { external } from "@/content/routes";
import { t } from "@/i18n";

type LenisLike = { stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

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
        onClick={(e) => {
          if (e.target === ref.current) hide();
        }}
      >
        <div className="menu-dialog__inner wrap">
          <div className="menu-dialog__top">
            <span className="label">{t.nav.sections}</span>
            <button type="button" className="menu-dialog__close" onClick={hide}>
              <span>{t.nav.close}</span>
              <span className="menu-dialog__x" aria-hidden="true" />
            </button>
          </div>
          <div className="menu-dialog__grid">
            <nav aria-label={t.nav.sections}>
              <ul className="menu-dialog__links" role="list">
                {t.nav.links.map((l, i) => (
                  <li key={l.key} style={{ "--i": i } as React.CSSProperties}>
                    <RouteLink to={l.key} className="menu-link" onClick={hide}>
                      <span className="menu-link__aside reply">{l.aside}</span>
                      <span className="menu-link__label a-voice">
                        <span className="dash">—</span>
                        {l.label}
                      </span>
                    </RouteLink>
                  </li>
                ))}
              </ul>
            </nav>
            <aside className="menu-dialog__side">
              <CitySwitch />
              <ul className="menu-dialog__cafes" role="list">
                {cafes.map((c) => (
                  <li key={c.id} data-city-only={c.city}>
                    <span className="menu-dialog__addr">{c.address}</span>
                    <CafeStatus cafe={c} />
                  </li>
                ))}
              </ul>
              <div className="menu-dialog__contacts">
                <a className="mono" href="tel:+79280826111" data-city-only="nalchik">+7 (928) 082-61-11</a>
                <a className="mono" href="tel:+79280773249" data-city-only="vladikavkaz">+7 (928) 077-32-49</a>
                <a className="dlink" href={external.telegram} target="_blank" rel="noreferrer">
                  <span className="dash">—</span>Telegram <span className="label" lang="en">how you doin’?</span>
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
                <a className="dlink" href={external.instagram} target="_blank" rel="noreferrer">
                  <span className="dash">—</span>Instagram <span className="label">@kakdela.coffee</span>
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
              </div>
              <p className="label menu-dialog__halal">{t.nav.halal}</p>
              {/* A named group (aria-label is not allowed on a plain div); EN is text, not a control yet. */}
              <div className="menu-dialog__lang label" role="group" aria-label={t.nav.lang.label}>
                <span aria-current="true">{t.nav.lang.ru}</span>
                <span title={t.nav.lang.soon}>
                  {t.nav.lang.en} · {t.nav.lang.soon}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </dialog>
    </>
  );
}
