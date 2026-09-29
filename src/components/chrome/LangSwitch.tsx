"use client";

import { usePathname } from "next/navigation";
import { EN, otherLocaleHref } from "@/i18n/locale";

/**
 * The same page in the other language: «EN» on the Russian site, «RU» on the English one (the header), or
 * the language's own name (`long`, the footer). A plain link, since the other language is another build.
 */
export function LangSwitch({ className, long = false }: { className?: string; long?: boolean }) {
  const path = usePathname();
  const other = EN ? "ru" : "en";
  const name = EN ? "Русская версия" : "English version";
  return (
    <a href={otherLocaleHref(path)} hrefLang={other} lang={other} className={className} aria-label={long ? undefined : name}>
      {long ? name : other.toUpperCase()}
    </a>
  );
}
