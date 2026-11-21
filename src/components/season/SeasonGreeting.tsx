import { PHASES } from "@/lib/season";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/**
 * The season's line at the end of a reply («…Это завтрак «Шик». С наступающим!»). All four phases are on the
 * page and CSS shows the one html[data-season] names (season.css), so it is right at first paint and on the
 * day it changes; outside the season none shows. Each carries its own space, so nothing is left behind.
 */
export function SeasonGreeting() {
  return (
    <>
      {PHASES.map((p) => (
        <span key={p} className="xm-greet" data-greet={p}>
          {` ${typograf(t.season.greet[p])}`}
        </span>
      ))}
    </>
  );
}
