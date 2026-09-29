import { NBSP } from "@/lib/typograf";

/** «ул.» stays quieter than the street: the name is what a guest reads on the sign (as on the homepage). */
export function splitAddress(address: string) {
  const m = /^(ул\.|пр\.)\s+(.+)$/.exec(address);
  return m ? { pre: m[1], rest: m[2] } : { pre: "", rest: address };
}

/** «Лермонтова, 4»: the address as a label on the plan and in speech, without «ул.» or «пр.». */
export const shortAddress = (address: string) => splitAddress(address).rest;

/**
 * «Все завтраки · летняя веранда»: the tags are stored lowercase, the line reads in sentence case, and a line
 * breaks only after a «·», never inside a tag.
 */
export function featureLine(tags: string[]) {
  const s = tags.map((tag) => tag.replace(/ /g, NBSP)).join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
