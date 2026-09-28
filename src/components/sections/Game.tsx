import { Runner } from "@/components/game/Runner";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/**
 * «Игра со стаканчиком.»: after the evening, before the footer, a takeaway cup runs through the café.
 * The section's one moment is the game itself, and it moves only once the guest starts it.
 */
export function GameSection() {
  return (
    <section id="igra" className="field section-pad game" data-theme="ink" aria-labelledby="igra-title">
      <div className="wrap">
        <header className="section-head">
          <DialogueHeading id="igra-title" q={t.game.q} a={typograf(t.game.a)} />
        </header>
        <Runner />
      </div>
    </section>
  );
}
