import { Photo } from "@/components/brand/Photo";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { team } from "@/content/people";
import { bindLastWord, keepWhole, NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { TeamMotion } from "./team/TeamMotion";

/** Each portrait's frame: a quarter of the row on desktop, half of it on tablets and phones. */
const PHOTO_SIZES = "(min-width: 1024px) 23vw, (min-width: 640px) 46vw, calc(50vw - 24px)";

/** The founding line (typograf keeps the brand's «как дела?» on one line). */
const statement = bindLastWord(typograf(t.team.lead));

/** Card copy: names and answers stay whole («По-настоящему» never breaks at its hyphen). */
const card = (s: string) => keepWhole(typograf(s));

/**
 * The café's founding line is the heading, then four people, each with their own answer to
 * «как дела?» and one line of their own. Everything is server-rendered; the island only adds
 * the entrances.
 */
export function TeamSection() {
  const hasPlaceholders = team.some((p) => p.placeholder);

  return (
    <section id="komanda" className="field section-pad" data-theme="cream" aria-label={t.team.q}>
      <div className="wrap">
        <header className="section-head team__head" data-team-head>
          <DialogueHeading q={t.team.q}>
            <span className="team__statement reply">{statement}</span>
          </DialogueHeading>
        </header>

        <ul className="team__people" aria-label={t.team.listLabel}>
          {team.map((p) => (
            <li key={p.id} className="team-card" data-team-card>
              <Photo photo={p.photo} sizes={PHOTO_SIZES} aspect="4/5" />
              <p className="team-card__who label">
                {card(p.name)}
                {NBSP}
                <span className="team-card__sep" aria-hidden="true">
                  ·
                </span>
                <span className="sr-only">,</span>{" "}
                <span className="team-card__where">{card(p.role)}</span>
              </p>
              <p className="team-card__answer display item-title">{card(p.answer)}</p>
              <p className="team-card__line">{card(p.line)}</p>
            </li>
          ))}
        </ul>

        {hasPlaceholders && (
          <p className="team__note label" data-team-note>
            {typograf(t.team.placeholderNote)}
          </p>
        )}
      </div>
      <TeamMotion />
    </section>
  );
}
