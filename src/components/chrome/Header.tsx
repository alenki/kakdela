import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { RouteLink } from "./RouteLink";
import { MenuDialog } from "./MenuDialog";
import { HeaderBehavior } from "./HeaderBehavior";
import { t } from "@/i18n";

export function Header() {
  return (
    <>
      <a href="#main" className="skip-link">
        {t.a11y.skip}
      </a>
      <header className="site-header" data-header data-theme="sky">
        <div className="site-header__inner wrap">
          {/* prefetch off: this is the homepage linking to itself */}
          <Link href="/" prefetch={false} className="site-header__logo" aria-label={t.a11y.home}>
            {/* Desktop: letters from a cached mask image (painted with currentColor) + inline badge that nods. */}
            <span className="site-header__mark site-header__mark--full" aria-hidden="true">
              <span className="site-header__letters" />
              <Wordmark variant="compact" letters={false} className="site-header__badge-in" cloverClassName="hdr-clover" />
            </span>
            <Wordmark variant="badge" className="site-header__mark site-header__mark--badge" cloverClassName="hdr-clover" />
          </Link>
          <nav className="site-header__nav" aria-label={t.a11y.mainNav}>
            <RouteLink to="menu" className="hdr-link">
              {t.nav.menu}
            </RouteLink>
            <MenuDialog />
          </nav>
        </div>
      </header>
      <HeaderBehavior />
    </>
  );
}
