import Link from "next/link";
import { Clover } from "@/components/brand/Clover";
import { SKYLINES, Skyline } from "@/components/brand/Skyline";
import type { City } from "@/content/types";
import { external } from "@/content/routes";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

export const metadata = { title: "Ещё варим — «Как дела?»" };

const CITIES: City[] = ["nalchik", "vladikavkaz"];
/** The copy opens each line with «— »; set that dash in tomato like every other dialogue line. */
const undash = (s: string) => s.replace(/^—\s*/, "");
/** «Ещё варим.» | «Загляните чуть позже.»: the answer breaks between its sentences, never inside them. */
const [answerHead, ...answerTail] = undash(t.notFound.a).split(/(?<=[.!?…])\s+/u);

/**
 * The Skyline masks its mountains below the foothills with a flat `--bg` fill, which would leave a
 * grain-free strip along the bottom of the page. Clip the mass to the band between the ridge and the
 * foothills instead (even-odd of the two closed outlines); chrome.css swaps the clip in.
 */
const closed = (d: string) => `${d}L1440 240L0 240Z`;
function NotFoundSkyClips() {
  return (
    <svg className="not-found__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {CITIES.map((city) => (
          <clipPath key={city} id={`nf-mass-${city}`} clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" d={closed(SKYLINES[city].ridge) + closed(SKYLINES[city].foothills)} />
          </clipPath>
        ))}
      </defs>
    </svg>
  );
}

/** The voiced 404: every link to a page that isn't built yet lands here. */
export default function NotFound() {
  return (
    <main id="main" tabIndex={-1}>
      <section className="field not-found" data-theme="sky">
        <div className="wrap not-found__inner">
          <p className="label not-found__code">404 · Ск<Clover className="not-found__clover" />ро</p>
          <h1 className="dlg not-found__dlg">
            <span className="dlg-line dlg-q q-voice">
              <span className="dash">—</span> {typograf(undash(t.notFound.q))}
            </span>
            <span className="dlg-line dlg-a a-voice">
              <span className="not-found__line">
                <span className="dash">—</span>
                {typograf(answerHead)}
              </span>{" "}
              <span className="not-found__line">{typograf(answerTail.join(" "))}</span>
            </span>
          </h1>
          <ul className="not-found__links" role="list">
            <li>
              <Link href="/" className="dlink"><span className="dash">—</span>{typograf(t.notFound.home)}</Link>
            </li>
            <li>
              <a href={external.telegram} className="dlink" target="_blank" rel="noreferrer">
                <span className="dash">—</span>{typograf(t.notFound.telegram)}
                <span className="sr-only"> {t.a11y.newTab}</span>
              </a>
            </li>
            <li>
              {/* The chain on the map of the guest's own city; both are rendered and CSS shows the active one. */}
              {CITIES.map((city) => (
                <a
                  key={city}
                  href={city === "nalchik" ? external.yandexNalchik : external.yandexVladikavkaz}
                  className="dlink"
                  target="_blank"
                  rel="noreferrer"
                  data-city-only={city}
                >
                  <span className="dash">—</span>{typograf(t.notFound.maps)}
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
              ))}
            </li>
          </ul>
        </div>
        {/* The city's horizon, edge to edge; both are rendered and CSS shows the active one. */}
        <div className="not-found__sky" aria-hidden="true">
          <NotFoundSkyClips />
          {CITIES.map((city) => (
            <div key={city} data-city-only={city}>
              <Skyline city={city} className="not-found__svg" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
