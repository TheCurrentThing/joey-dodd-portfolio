import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Learn", href: "/learn" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/contact" },
];

// Admin link not shown in main nav — accessible at /admin directly

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href.startsWith("/#"))
      return location.pathname === "/" && location.hash === href.slice(1);
    return location.pathname.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith("/#")) {
      const sectionId = href.slice(2);
      if (location.pathname === "/") {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${scrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"}`}
      role="banner"
    >
      <nav
        className="max-w-screen-xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="font-serif text-navbar-text text-xl tracking-tight hover:text-tertiary transition-colors duration-300"
          aria-label="Joey Dodd - Home"
        >
          Joey Dodd
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              {link.href.startsWith("/#") ? (
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`relative font-sans font-normal text-label uppercase tracking-widest text-sm px-4 py-3 cursor-pointer transition-colors duration-300 block ${isActive(link.href) ? "text-tertiary" : "text-navbar-text hover:text-tertiary"}`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span
                      className="absolute bottom-1 left-4 right-4 h-px bg-tertiary"
                      aria-hidden="true"
                    />
                  )}
                </a>
              ) : (
                <Link
                  to={link.href}
                  className={`relative font-sans font-normal text-label uppercase tracking-widest text-sm px-4 py-3 cursor-pointer transition-colors duration-300 block ${isActive(link.href) ? "text-tertiary" : "text-navbar-text hover:text-tertiary"}`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span
                      className="absolute bottom-1 left-4 right-4 h-px bg-tertiary"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile Burger */}
        <button
          className="md:hidden text-navbar-text hover:text-tertiary transition-colors duration-300 p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? (
            <X size={28} weight="regular" />
          ) : (
            <List size={28} weight="regular" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className="md:hidden bg-secondary border-t border-border"
          role="dialog"
          aria-label="Mobile navigation menu"
        >
          <ul className="flex flex-col py-4" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                {link.href.startsWith("/#") ? (
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                    className={`block font-sans font-normal text-label uppercase tracking-widest text-sm px-6 py-4 cursor-pointer transition-colors duration-300 ${isActive(link.href) ? "text-tertiary" : "text-navbar-text hover:text-tertiary"}`}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.href}
                    className={`block font-sans font-normal text-label uppercase tracking-widest text-sm px-6 py-4 cursor-pointer transition-colors duration-300 ${isActive(link.href) ? "text-tertiary" : "text-navbar-text hover:text-tertiary"}`}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
