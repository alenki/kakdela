import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { CurrentLink } from "./CurrentLink";
import { MenuDialog } from "./MenuDialog";
import { HeaderBehavior } from "./HeaderBehavior";
import type { RouteKey } from "@/content/routes";
import { cn } from "@/lib/format";
import { t } from "@/i18n";

// The five places, as in «Разделы». Phones keep only «Меню»: the action bar and the dialog carry the rest.
// Below 1280px «Главная» steps out as well (the logo is the way home), or the other four wrap.
const PRIMARY: RouteKey[] = ["home", "menu", "about", "locations", "feedback"];
const primary = t.nav.links.filter((l) => PRIMARY.includes(l.key));

export function Header() {
  return (
    <>
      <a href="#main" className="skip-link">
        {t.a11y.skip}
      </a>
      {/* data-theme follows the section under the bar (HeaderBehavior); the theme tokens do the rest. */}
      <header className="site-header" data-header data-theme="cream">
        {/* The page links on the left, the logo centred, the sections button on the right. */}
        <div className="site-header__inner wrap">
          <nav className="site-header__nav" aria-label={t.a11y.mainNav}>
            {primary.map((l) => (
              <CurrentLink
                key={l.key}
                to={l.key}
                className={cn("hdr-link", l.key !== "menu" && "hdr-link--wide", l.key === "home" && "hdr-link--home")}
              >
                {l.label}
              </CurrentLink>
            ))}
          </nav>
          {/* prefetch off: this is the homepage linking to itself */}
          <Link href="/" prefetch={false} className="site-header__logo" aria-label={t.a11y.home}>
            {/* Desktop: letters from a cached mask image (painted with currentColor) + the inline clover (no octagon frame). */}
            <span className="site-header__mark site-header__mark--full" aria-hidden="true">
              <span className="site-header__letters" />
              <Wordmark variant="compact" letters={false} className="site-header__badge-in" octagon={false} cloverClassName="site-header__clover" />
            </span>
            <Wordmark variant="badge" className="site-header__mark site-header__mark--badge" octagon={false} cloverClassName="site-header__clover" />
          </Link>
          <div className="site-header__end">
            <MenuDialog />
          </div>
        </div>
      </header>
      <HeaderBehavior />
    </>
  );
}
