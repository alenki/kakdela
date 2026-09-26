// Generates the procedural lace doily (after the white lace under the client's studio food photos)
// as one static, cacheable SVG per tone, so pages reference it instead of inlining ~14 KB per photo.
//   public/brand/lace.svg        milk
//   public/brand/lace-cream.svg  cream
import { mkdirSync, writeFileSync } from "node:fs";
import { optimize } from "svgo";

const C = 100;
const r1 = (n) => Math.round(n * 10) / 10;

function scallopPath(n, r, bulge) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
    const x0 = C + r * Math.cos(a0), y0 = C + r * Math.sin(a0);
    const x1 = C + r * Math.cos(a1), y1 = C + r * Math.sin(a1);
    const cx = C + (r + bulge) * Math.cos(am), cy = C + (r + bulge) * Math.sin(am);
    d += `${i === 0 ? `M${r1(x0)} ${r1(y0)}` : ""}Q${r1(cx)} ${r1(cy)} ${r1(x1)} ${r1(y1)}`;
  }
  return d + "Z";
}
const ring = (n, r, fn) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return fn(r1(C + r * Math.cos(a)), r1(C + r * Math.sin(a)), (a * 180) / Math.PI, i);
  }).join("");

const OUTER = scallopPath(40, 93, 7);
const holes = [
  ring(40, 90, (x, y) => `<circle cx="${x}" cy="${y}" r="1.9"/>`),
  ring(20, 80, (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="5.2" ry="2.3" transform="rotate(${r1(a + 90)} ${x} ${y})"/>`),
  ring(20, 80, (_x, _y, a) => {
    const b = ((a + 9) * Math.PI) / 180;
    return `<circle cx="${r1(C + 80 * Math.cos(b))}" cy="${r1(C + 80 * Math.sin(b))}" r="1.1"/>`;
  }),
  ring(56, 71, (x, y) => `<circle cx="${x}" cy="${y}" r="1"/>`),
  ring(56, 66.5, (x, y) => `<circle cx="${x}" cy="${y}" r=".9"/>`),
].join("");

const svg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><mask id="m" maskUnits="userSpaceOnUse"><path d="${OUTER}" fill="#fff"/><g fill="#000">${holes}</g><circle cx="100" cy="100" r="61" fill="none" stroke="#000" stroke-width=".8"/></mask></defs><circle cx="100" cy="100" r="101" fill="${fill}" mask="url(#m)"/><path d="${OUTER}" fill="none" stroke="#141210" stroke-opacity=".12" stroke-width=".6"/></svg>`;

mkdirSync("public/brand", { recursive: true });
for (const [file, fill] of [["lace.svg", "#fff8ee"], ["lace-cream.svg", "#f3ebdc"]]) {
  const out = optimize(svg(fill), { multipass: true, floatPrecision: 1 }).data;
  writeFileSync(`public/brand/${file}`, out);
  console.log(file, out.length, "bytes");
}
