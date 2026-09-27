import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { CurrentLink } from "./CurrentLink";
import { MenuDialog } from "./MenuDialog";
import { HeaderBehavior } from "./HeaderBehavior";
import { t } from "@/i18n";

export function Header() {
  return (
    <>
      <a href="#main" className="skip-link">
        {t.a11y.skip}
      </a>
      {/* data-theme follows the section under the bar (HeaderBehavior); the theme tokens do the rest. */}
      <header className="site-header" data-header data-theme="cream">
        <div className="site-header__inner wrap">
          {/* prefetch off: this is the homepage linking to itself */}
          <Link href="/" prefetch={false} className="site-header__logo" aria-label={t.a11y.home}>
            {/* Desktop: letters from a cached mask image (painted with currentColor) + the inline badge. */}
            <span className="site-header__mark site-header__mark--full" aria-hidden="true">
              <span className="site-header__letters" />
              <Wordmark variant="compact" letters={false} className="site-header__badge-in" cloverClassName="site-header__clover" />
            </span>
            <Wordmark variant="badge" className="site-header__mark site-header__mark--badge" cloverClassName="site-header__clover" />
          </Link>
          <nav className="site-header__nav" aria-label={t.a11y.mainNav}>
            <CurrentLink to="menu" className="hdr-link">
              {t.nav.menu}
            </CurrentLink>
            <MenuDialog />
          </nav>
        </div>
      </header>
      <HeaderBehavior />
    </>
  );
}
