import { RunnerIsland } from "./RunnerIsland";
import { RunnerPoster } from "./RunnerPoster";

/**
 * The runner, for the homepage section and the 404. The poster is rendered here on the server and
 * handed to the island as children, so its drawing data never ships in the page's JavaScript.
 * `aside`: a secondary block (the 404), whose button never competes with the page's primary action.
 */
export function Runner({ variant = "section" }: { variant?: "section" | "aside" }) {
  return (
    <RunnerIsland variant={variant}>
      <RunnerPoster />
    </RunnerIsland>
  );
}
