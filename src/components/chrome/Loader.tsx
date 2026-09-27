import { answers } from "@/content/answers";
import { Wordmark } from "@/components/brand/Wordmark";
import { LOADER_SCRIPT } from "@/lib/loader-script";
import { sheetTear } from "@/lib/tear";

const TEAR = sheetTear("ldr");

/**
 * The loading screen: the night before the café opens (the ink theme), on every full page load.
 * Server markup only; the choreography is the inline script after it (lib/loader-script.ts), which
 * runs before React and shows the screen by setting data-state. Hidden without JS and with reduced
 * motion (the script never starts), and never longer than 8 s. The page underneath is the real one:
 * the screen is decorative, so it is hidden from assistive technology.
 */
export function Loader() {
  return (
    <>
      <div id="ldr" className="ldr" data-theme="ink" aria-hidden="true" suppressHydrationWarning>
        <div className="ldr__sheet ldr__sheet--top" style={{ clipPath: TEAR.top }} data-ldr-top />
        <div className="ldr__sheet ldr__sheet--bottom" style={{ clipPath: TEAR.bottom }} data-ldr-bottom />
        {/* The tear line, and the progress: its holes light up as the page loads. */}
        <div className="ldr__perf" data-ldr-perf>
          <div className="ldr__perf-lit" data-ldr-lit />
        </div>
        <div className="ldr__fly" data-ldr-fly>
          <div className="ldr__lift" data-ldr-lift>
            <Wordmark variant="full" leaves className="ldr__mark" cloverClassName="ldr__clover" />
          </div>
        </div>
        {/* Every answer, stacked in one slot; the script rolls four of them through it. */}
        <p className="ldr__say" data-ldr-say>
          {answers.map((a) => (
            <span key={a.id} className="ldr__mood display" data-mood={a.id}>
              {a.label}.
            </span>
          ))}
        </p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />
    </>
  );
}
