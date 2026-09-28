import { Photo } from "@/components/brand/Photo";
import { Slip } from "@/components/brand/Slip";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { answerById } from "@/content/answers";
import { team } from "@/content/people";
import { bindLastWord, keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { TeamMotion } from "./team/TeamMotion";

/** Each portrait's frame: a quarter of the row on desktop, half of it on tablets and phones. */
const PHOTO_SIZES = "(min-width: 1024px) 23vw, (min-width: 640px) 46vw, calc(50vw - 24px)";

/** The founding line (typograf keeps the brand's «как дела?» on one line). */
const statement = bindLastWord(typograf(t.team.lead));

/** Card copy: names and answers stay whole («По-настоящему» never breaks at its hyphen). */
const card = (s: string) => keepWhole(typograf(s));

/** The breakfast of the answer's name, split at its «: a card too narrow for the widest name sets every
 *  name on a line of its own (team.css), and none ever breaks inside its quotes. */
function Dish({ name, anchor }: { name: string; anchor: string }) {
  const i = Math.max(0, name.indexOf("«"));
  return (
    <p className="team-card__dish">
      <RouteLink to="menu" hash={anchor} className="dlink">
        {name.slice(0, i)}
        <span className="team-card__dish-name">{card(name.slice(i))}</span>
      </RouteLink>
    </p>
  );
}

/**
 * The café's founding line is the heading, then four people and their answers to «как дела?». Each
 * answer is one of the notice's tabs, torn off and lying across the foot of its person's portrait (the
 * same seeded slip that lands on the dish in the hero), then the person's own line and the breakfast of
 * that name. When the guest's answer in the hero is the same (torn today, or being browsed with the arrow
 * keys; never a time-of-day guess), that slip turns red and the caption says «как у вас» (team.css reads
 * the html attributes the head script and the store set, so no island is needed). Everything is
 * server-rendered; the island only adds the entrances.
 */
export function TeamSection() {
  return (
    <section id="komanda" className="field section-pad" data-theme="cream" aria-label={t.team.q}>
      <div className="wrap">
        <header className="section-head team__head" data-team-head>
          <DialogueHeading q={t.team.q}>
            <span className="team__statement reply">{statement}</span>
          </DialogueHeading>
        </header>

        {/* role="list": without list-style, Safari drops the list semantics. */}
        <ul className="team__people" role="list" aria-label={t.team.listLabel}>
          {team.map((p) => {
            const a = p.answerId ? answerById[p.answerId] : undefined;
            const label = p.answerId ? answerById[p.answerId].label : p.answer;
            return (
              <li key={p.id} className="team-card" data-team-card data-team-answer={a?.id}>
                <Photo photo={p.photo} sizes={PHOTO_SIZES} aspect="4/5" />
                {/* The tab's cell is a container, so the word is sized against the card (team.css). */}
                <div className="team-card__tab">
                  <Slip seed={a?.id ?? p.id} label={label} mood={a?.mood} className="team-card__slip" data-team-slip />
                </div>
                {/* Shown (and read) only while the guest's answer in the hero is this one (team.css). */}
                <p className="team-card__match label">
                  <span className="team-card__same">{typograf(t.team.same)}</span>
                </p>
                <p className="team-card__line">{card(p.line)}</p>
                {a && <Dish name={a.item.name} anchor={a.item.anchor} />}
              </li>
            );
          })}
        </ul>
      </div>
      <TeamMotion />
    </section>
  );
}
