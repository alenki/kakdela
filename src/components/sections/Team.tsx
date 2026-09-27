import Image, { type StaticImageData } from "next/image";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { team } from "@/content/people";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { TeamMotion } from "./team/TeamMotion";

/**
 * The width each portrait really renders at (the row has no cap, so vw holds at 2560 too).
 * Desktop: a quarter of the gutter-to-gutter row (≈ 22vw) at most 4:5 of that width (≈ 28vw tall;
 * less on ultrawide screens, where the frame height is capped by the viewport), and the two outer
 * frames bleed one gutter (3.4vw) further to the screen edge. Tablet: half the row, square, every
 * frame bled to its edge (≈ 49vw). Phones: the swipe rail, min(78vw, 340px) at 4:5.
 * `object-fit: cover` scales a landscape picture to the frame's height, so it needs more pixels
 * than the frame is wide.
 */
function photoSizes(src: StaticImageData, edge: boolean) {
  const ratio = src.width / src.height;
  const fit = (w: number, h: number) => Math.ceil(Math.max(w, h * ratio));
  return [
    `(min-width: 1024px) ${fit(edge ? 26 : 23, 28)}vw`,
    `(min-width: 640px) ${fit(49, 49)}vw`,
    `(min-width: 436px) ${fit(340, 425)}px`,
    `${fit(78, 98)}vw`,
  ].join(", ");
}

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
            {team.map((p, i) => (
              <li key={p.id} className="team-card" data-team-card>
                <div className="team-card__photo" data-placeholder={p.photo.placeholder ? "" : undefined}>
                  <Image
                    src={p.photo.src}
                    alt={p.photo.alt}
                    fill
                    sizes={photoSizes(p.photo.src, i === 0 || i === team.length - 1)}
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
