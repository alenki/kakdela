import Link from "next/link";
import { Clover } from "@/components/brand/Clover";
import { external } from "@/content/routes";
import { t } from "@/i18n";

export const metadata = { title: "Ещё варим — «Как дела?»" };

/** The voiced 404: every link to a page that isn't built yet lands here. */
export default function NotFound() {
  return (
    <main id="main" tabIndex={-1}>
      <section className="field not-found" data-theme="sky">
        <div className="wrap not-found__inner">
          <p className="label">404 · Ск<Clover className="not-found__clover" />ро</p>
          <h1 className="dlg">
            <span className="dlg-line dlg-q q-voice">{t.notFound.q}</span>
            <span className="dlg-line dlg-a a-voice">{t.notFound.a}</span>
          </h1>
          <ul className="not-found__links" role="list">
            <li>
              <Link href="/" className="dlink"><span className="dash">—</span>{t.notFound.home}</Link>
            </li>
            <li>
              <a href={external.telegram} className="dlink" target="_blank" rel="noreferrer">
                <span className="dash">—</span>{t.notFound.telegram}
                <span className="sr-only"> {t.a11y.newTab}</span>
              </a>
            </li>
            <li>
              <a href={external.yandexNalchik} className="dlink" target="_blank" rel="noreferrer">
                <span className="dash">—</span>{t.notFound.maps}
                <span className="sr-only"> {t.a11y.newTab}</span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
