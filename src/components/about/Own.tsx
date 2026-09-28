import { own } from "@/content/about";
import { Photo } from "@/components/brand/Photo";
import { Slip } from "@/components/brand/Slip";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/** Names and answers stay whole («Как в сказке» never breaks inside its quotes). */
const whole = (s: string) => keepWhole(typograf(s));

/**
 * «Что у вас своё?» / «Голландез, сироп из горных трав и названия.»: the two things the menu says are
 * made in-house, and the names, which come from the answers to «как дела?». Three printed menu entries,
 * set like the evening's desserts: a photo, the name, a line, the way to it on the menu. The names' photo
 * is the breakfast «Лучше всех», with its answer's slip lying across the top, as in the hero.
 */
export function Own() {
  return (
    <section id="svoyo" className="field section-pad ab-own" data-theme="cream" aria-labelledby="svoyo-title">
      <div className="wrap">
        <header className="section-head" data-ab-rise>
          <DialogueHeading id="svoyo-title" q={t.about.own.ask} ask={typograf(t.about.own.ask)} a={typograf(t.about.own.a)} />
          <p className="lead">{typograf(t.about.own.lead)}</p>
        </header>

        <ul className="ab-own__list" role="list" data-ab-rise>
          {own.map((item) => (
            <li key={item.id} className="ab-own__item" data-ab-item>
              <div className="ab-own__visual">
                {"slip" in item && (
                  <Slip seed={item.slip.id} label={item.slip.label} mood={item.slip.mood} className="ab-own__slip" data-ab-slip aria-hidden="true" />
                )}
                {/* A third of the canvas from 640, the full width on phones. */}
                <Photo photo={item.photo} aspect="4/5" sizes="(min-width: 640px) 31vw, calc(100vw - 32px)" loading="lazy" className="ab-own__photo" />
              </div>
              <h3 className="ab-own__name display item-title">{typograf(item.name)}</h3>
              <p className="ab-own__desc">{whole(item.desc)}</p>
              <p className="ab-own__link">
                <RouteLink to="menu" hash={item.link.hash} className="dlink">
                  {whole(item.link.label)}
                </RouteLink>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
