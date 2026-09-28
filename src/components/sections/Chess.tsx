import type { ReactNode } from "react";
import { answerById } from "@/content/answers";
import { chessEvent } from "@/content/people";
import { external } from "@/content/routes";
import { Slip } from "@/components/brand/Slip";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { describeRu, GRADES, puzzleFor, spokenRu, startOf, weekNumber, type Grade } from "@/lib/puzzle";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { boardVM, initGame, logVM } from "./chess/model";
import { BoardView, ControlsView, LogView, PieceDefs } from "./chess/views";
import { PuzzleIsland } from "./chess/PuzzleIsland";
import { ChessMotion } from "./chess/ChessMotion";

// The page is built ahead of time: this is the week of the build. The game swaps in the current week's
// puzzle as it loads; without JS the build's week stays, still a sound puzzle.
const BUILD_WEEK = weekNumber(new Date());

/** The end of a solve: the grade lands as the hero's torn tab. */
function Payoff({ grade }: { grade: Grade }) {
  const a = answerById[grade];
  return (
    <div className="chess__payoff">
      <Slip seed={a.id} label={a.label} mood={a.mood} className="chess__slip" />
    </div>
  );
}

/**
 * «Задача недели.»: after the desserts, before the runner. A mate in two from a real game, new every
 * Monday (src/content/puzzles.ts), set on a big board beside the transcript, where the café answers
 * every move; then the blitz in Nalchik. The one moment is the board.
 */
export function ChessSection() {
  const pz = puzzleFor(BUILD_WEEK);
  const { before, setup, start } = startOf(pz);
  const still = initGame(pz, BUILD_WEEK, {});
  const log = logVM(still);
  const payoffs = Object.fromEntries(GRADES.map((g) => [g, <Payoff key={g} grade={g} />])) as Record<Grade, ReactNode>;
  const labels = Object.fromEntries(GRADES.map((g) => [g, answerById[g].label])) as Record<Grade, string>;
  const alt = `${describeRu(start)} ${t.chess.say.last}: ${spokenRu(before, setup)}.`;

  return (
    <section id="shahmaty" className="field section-pad chess" data-theme="ink" aria-labelledby="shahmaty-title">
      <PieceDefs />
      <div className="wrap chess__grid">
        <header className="chess__head" data-ch-block>
          <DialogueHeading id="shahmaty-title" q={t.chess.q} a={typograf(t.chess.a)} />
          <p className="lead">{typograf(t.chess.lead)}</p>
        </header>

        <PuzzleIsland payoffs={payoffs} labels={labels}>
          <div className="chess__board">
            <BoardView vm={boardVM(still)} alt={alt} />
          </div>
          <LogView rows={log.rows} pending={log.pending} />
          <ControlsView label={t.chess.hint} />
        </PuzzleIsland>

        <article className="chess__event" aria-labelledby="shahmaty-blitz" data-ch-block>
          <h3 id="shahmaty-blitz" className="chess__invite display item-title">
            {typograf(t.chess.invite)}
          </h3>
          <p className="chess__facts">
            {typograf(chessEvent.body)} {typograf(chessEvent.when)}.
          </p>
          <p className="chess__cta">
            <a className="btn btn-primary" href={external.telegram} target="_blank" rel="noreferrer">
              <BtnLabel>
                {typograf(t.chess.vote)}
                <span className="chess__ext" aria-hidden="true">
                  ↗
                </span>
              </BtnLabel>
              <span className="sr-only"> {t.a11y.newTab}</span>
            </a>
          </p>
        </article>
      </div>
      <ChessMotion />
    </section>
  );
}
