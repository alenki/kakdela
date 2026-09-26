import Image from "next/image";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { team } from "@/content/people";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { TeamMotion } from "./team/TeamMotion";

// Card widths: a quarter of the capped 1600px wrap on desktop, half on tablet, the rail on phones.
const CARD_SIZES = "(min-width: 1600px) 360px, (min-width: 1024px) 22vw, (min-width: 640px) 45vw, 78vw";

/** The verbatim About line, with «как дела?» lifted into the heavy tomato voice. */
function Lead() {
  const lead = typograf(t.team.lead);
  const quoted = `«${t.team.phrase}»`;
  const at = lead.indexOf(quoted);
  if (at < 0) return <>{lead}</>;
  // «как дела?» and the dash after it travel as one unbreakable unit, in the paragraph and in
  // the split lines alike (SplitText would otherwise allow a break at the nested span's edge).
  const dash = lead.startsWith(`${NBSP}—`, at + quoted.length) ? `${NBSP}—` : "";
  return (
    <>
      {lead.slice(0, at)}
      <span className="team__bind">
        «<span className="team__phrase a-voice">{t.team.phrase}</span>»{dash}
      </span>
      {lead.slice(at + quoted.length + dash.length)}
    </>
  );
}

/**
 * «— А у вас как дела?» The guest asks back, and the team answers: first the café's founding line
 * in large roman, then four people, each with their own answer and one line of their own.
 * Everything is server-rendered; the island only adds the line-mask reveal and the card rise.
 */
export function TeamSection() {
  const hasPlaceholders = team.some((p) => p.placeholder);

  return (
    <section id="komanda" className="field section-pad team" data-theme="cream" aria-labelledby="komanda-title">
      <div className="wrap">
        <div className="team__intro">
          <DialogueHeading id="komanda-title" q={t.team.q} className="team__title" />

          <figure className="team__quote">
            <blockquote className="team__lead">
              <p className="team__lead-text" data-team-lead>
                <Lead />
              </p>
            </blockquote>
            <figcaption className="team__source label" data-team-source>
              {typograf(t.team.leadSource)}
            </figcaption>
          </figure>
        </div>

        <div className="team__people">
          <ul className="team__rail" data-team-rail aria-label={t.team.listLabel}>
            {team.map((p) => (
              <li key={p.id} className="team-card" data-team-card>
                <div className="team-card__photo" data-placeholder={p.photo.placeholder ? "" : undefined}>
                  <Image
                    src={p.photo.src}
                    alt={p.photo.alt}
                    fill
                    sizes={CARD_SIZES}
                    placeholder="blur"
                    className="team-card__img"
                  />
                </div>
                <p className="team-card__who label">
                  <span className="team-card__name">{p.name}</span>
                  <span className="team-card__sep" aria-hidden="true">
                    {" · "}
                  </span>
                  <span className="team-card__role">{typograf(p.role)}</span>
                </p>
                <p className="team-card__answer a-voice">
                  <span className="dash">—</span>
                  <span className="team-card__word">{typograf(p.answer)}.</span>
                </p>
                <p className="team-card__line reply">{typograf(p.line)}</p>
              </li>
            ))}
          </ul>
          <div className="team__progress" aria-hidden="true" />
        </div>

        {hasPlaceholders && <p className="team__note label">{typograf(t.team.placeholderNote)}</p>}
      </div>
      <TeamMotion />
    </section>
  );
}
