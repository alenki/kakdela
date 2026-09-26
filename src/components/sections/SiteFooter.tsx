import { Fragment } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Clover } from "@/components/brand/Clover";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { flagship } from "@/content/cafes";
import { external, type RouteKey } from "@/content/routes";
import type { City } from "@/content/types";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { FooterAnswer, FooterGoodnight, FooterSignoff, FooterStatus } from "./footer/FooterVoice";
import { MotionToggle } from "./footer/MotionToggle";
import { FooterMotion } from "./footer/FooterMotion";

/**
 * Small-type rules for the footer copy: a dash or «·» never starts a line, an opening dash never
 * hangs alone, one-letter words stay with the next word. Level 1 keeps the footer's breaks as they
 * were (FooterVoice uses the same); the default level would also hold «на», «до», «во» (see typograf).
 */
const typo = (s: string) => typograf(s, 1);

/** The city's main line is its flagship's: Байсултанова, 1 in Nalchik, Куйбышева, 3 in Vladikavkaz. */
const phones = (Object.keys(flagship) as City[]).map((city) => ({
  city,
  tel: flagship[city].phone,
  display: flagship[city].phoneDisplay,
}));

const NAV: RouteKey[] = ["menu", "locations", "events", "about"];
const navLabel = (key: RouteKey) => t.nav.links.find((l) => l.key === key)?.label ?? key;

/** Small print: each «·»-separated phrase stays whole; lines break only after a «·». */
function Phrases({ text }: { text: string }) {
  const parts = text.split(" · ");
  return parts.map((p, i) => (
    <Fragment key={i}>
      <span className="ft-nobr">{typo(p)}</span>
      {i < parts.length - 1 && " · "}
    </Fragment>
  ));
}

/** «— Бонусная карта»: the dash never sits alone on a line, however narrow the door. */
function DoorLabel({ label }: { label: string }) {
  const [first, ...rest] = label.split(" ");
  return (
    <span className="ft-door__label a-voice">
      <span className="ft-nobr">
        <span className="dash">—</span>
        {first}
      </span>
      {rest.length > 0 && ` ${typo(rest.join(" "))}`}
    </span>
  );
}

/** ↗ drawn, not typed (glyph coverage varies across the four families). */
function ExtArrow() {
  return (
    <svg className="ft-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M2.5 7.5 7.5 2.5M3.6 2.5h3.9v3.9" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DoorArrow() {
  return (
    <svg className="ft-door__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 12h17M14 5.5 20.5 12 14 18.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Footer «— Спокойной ночи» (cobalt, slow). The conversation closes: the café asks once more,
 * the guest's own answer comes back in the heavy voice, and the café says goodnight by mood.
 * Then the service doors, contacts, the small print, and the giant wordmark closing like doors.
 */
export function SiteFooter() {
  return (
    <footer id="footer" className="field ft" data-theme="cobalt">
      <div className="wrap">
        {/* ── The closing exchange ── */}
        <div className="ft-talk" data-ft-talk>
          <p className="ft-kicker label" data-ft-kicker>
            {t.footer.kicker}
          </p>
          <DialogueHeading q={t.footer.q} id="footer-title" className="ft-dlg">
            <FooterAnswer />
          </DialogueHeading>
          <div className="ft-reply">
            <FooterGoodnight />
            <FooterSignoff>
              <Clover className="ft-signoff__clover" />
            </FooterSignoff>
          </div>
          <FooterStatus />
        </div>

        {/* ── Service doors: dialogue links ── */}
        <nav className="ft-doors" aria-label={t.footer.doorsLabel} data-ft-doors>
          <span className="ft-rule" data-ft-rule aria-hidden="true" />
          <ul className="ft-doors__list" role="list">
            {t.footer.doors.map((d) => (
              <li key={d.key} className="ft-doors__item" data-ft-door>
                <RouteLink to={d.key} className="ft-door">
                  <span className="ft-door__q reply">{typo(d.q)}</span>
                  <DoorLabel label={d.label} />
                  <DoorArrow />
                </RouteLink>
              </li>
            ))}
          </ul>
          <span className="ft-rule" data-ft-rule aria-hidden="true" />
        </nav>

        {/* ── Contacts ── */}
        <div className="ft-info">
          <div className="ft-col ft-col--social" data-ft-info>
            <p className="ft-col__label label">{t.footer.social}</p>
            <ul className="ft-social-list" role="list">
              <li>
                <a className="ft-social" href={external.telegram} target="_blank" rel="noreferrer">
                  <span className="ft-social__name">
                    <span className="dash">—</span>
                    {t.footer.telegram.label}
                    <ExtArrow />
                  </span>
                  <span className="ft-social__note">
                    <span className="ft-social__en" lang="en">
                      {t.footer.telegram.title}
                    </span>{" "}
                    <span className="reply">{t.footer.telegram.desc}</span>
                  </span>
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
              </li>
              <li>
                <a className="ft-social" href={external.instagram} target="_blank" rel="noreferrer">
                  <span className="ft-social__name">
                    <span className="dash">—</span>
                    {t.footer.instagram.label}
                    <ExtArrow />
                  </span>
                  <span className="ft-social__note mono">{t.footer.instagram.handle}</span>
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="ft-col ft-col--phone" data-ft-info>
            <p className="ft-col__label label">
              {t.footer.phone}
              {" · "}
              {phones.map((p) => (
                <span key={p.city} data-city-only={p.city}>
                  {t.city[p.city]}
                </span>
              ))}
            </p>
            {phones.map((p) => (
              <a key={p.city} className="ft-phone mono" href={`tel:${p.tel}`} data-city-only={p.city}>
                {p.display}
              </a>
            ))}
          </div>

          <nav className="ft-col ft-col--nav" aria-label={t.footer.navLabel} data-ft-info>
            <p className="ft-col__label label" aria-hidden="true">
              {t.nav.sections}
            </p>
            <ul className="ft-nav" role="list">
              {NAV.map((key) => (
                <li key={key}>
                  <RouteLink to={key} className="ft-nav__link">
                    <span className="dash">—</span>
                    {navLabel(key)}
                  </RouteLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Small print ── */}
        <div className="ft-print" data-ft-info>
          <p className="ft-utility label">
            <Phrases text={t.footer.utility} />
          </p>
          <div className="ft-legal label">
            <p>
              <Phrases text={t.footer.copyright} />
            </p>
            <p>{typo(t.footer.photoCredit)}</p>
            <MotionToggle />
          </div>
        </div>
      </div>

      {/* ── The doors close: the wordmark assembles as the page ends ── */}
      <div className="ft-sign" data-ft-sign>
        <Wordmark variant="full" className="ft-mark" />
      </div>
      <FooterMotion />
    </footer>
  );
}
