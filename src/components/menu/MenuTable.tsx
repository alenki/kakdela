import type { MenuItem } from "@/content/types";
import { Slip } from "@/components/brand/Slip";
import { keepWhole, typograf } from "@/lib/typograf";
import { answerForItem, citiesById, tableItems } from "./model";
import { InlineScript } from "@/components/chrome/InlineScript";
import { TABLE_SCRIPT } from "./pick-script";
import { Placard, Plate } from "./Plate";
import { Facts, Price } from "./Price";

/** The frame's width: columns 9 to 12 from 1024px (sized in menu.css), so about 30% of the canvas. */
const SIZES = "(min-width: 1024px) 30vw, 1px";

/**
 * «Стол»: one place at the table, beside the notice's back and the kitchen (from 1024px, CSS-sticky under the
 * header). It serves one dish at a time: the answer on show while the notice is read, then whichever row the
 * guest reads, points at or tabs to (TableController). Every photo is laid by its plate (Plate.tsx), so the
 * plate stands still and only the food changes; a dish without a photo is served as its name on the notice's
 * paper. The dish an answer stands for carries that answer's slip across it, as on the homepage.
 *
 * A decorative duplicate of the rows (aria-hidden): the rows carry everything it shows. Every slide is
 * server-rendered and stacked in one cell; only the one on show and its neighbours are displayed, so the other
 * lazy photos never load. Without JS it stands beside the notice with the first answer's dish and scrolls away
 * with it, and the kitchen's rows carry their own photos.
 */
export function MenuTable() {
  return (
    <aside className="mn-table" aria-hidden="true" data-mn-table>
      <div className="mn-table__sticky" data-mn-sticky>
        <div className="mn-table__stage">
          {tableItems.map((item) => (
            <Slide key={item.id} item={item} />
          ))}
        </div>
        <div className="mn-table__caps">
          {tableItems.map((item) => (
            <Caption key={item.id} item={item} />
          ))}
        </div>
      </div>
      <InlineScript code={TABLE_SCRIPT} />
    </aside>
  );
}

function Slide({ item }: { item: MenuItem }) {
  const answer = answerForItem[item.id];
  return (
    <div className="mn-slide" data-key={item.id}>
      {item.photo ? (
        <Plate id={item.id} photo={item.photo} aspect="1/1" sizes={SIZES} decorative className="mn-slide__plate" />
      ) : (
        <Placard name={item.name} aspect="1/1" className="mn-slide__plate" />
      )}
      {/* The tab that answers with this dish, landed on its side across the dish, as in the hero. */}
      {answer && <Slip seed={answer.id} label={answer.label} mood={answer.mood} className="mn-slide__slip" />}
    </div>
  );
}

function Caption({ item }: { item: MenuItem }) {
  const answer = answerForItem[item.id];
  return (
    <div className="mn-cap" data-key={item.id}>
      <p className="mn-cap__line">
        <span className="mn-cap__name">{keepWhole(typograf(item.name))}</span>
        <span className="mn-cap__price mono">
          <Price item={item} cities={citiesById[item.id]} />
        </span>
      </p>
      {/* The café's reply to the answer this dish stands for: the table's one italic line. */}
      {answer && <p className="mn-cap__reply reply">{keepWhole(typograf(answer.reply))}</p>}
      <Facts item={item} volume={false} className="mn-cap__facts label mono" />
    </div>
  );
}
