import { Link } from "react-router-dom";
import {
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
} from "@phosphor-icons/react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-neutral-900 border-t border-border"
      role="contentinfo"
    >
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="font-serif text-foreground text-xl mb-3 block hover:text-tertiary transition-colors duration-300"
            >
              Joey Dodd
            </Link>
            <p className="font-sans text-neutral-400 text-body font-light leading-relaxed max-w-xs">
              Visual artist and illustrator crafting worlds through character,
              concept, and illustration.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-4">
              Navigation
            </p>
            <ul className="flex flex-col gap-3" role="list">
              {[
                { label: "Home", href: "/" },
                { label: "Portfolio", href: "/portfolio" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="font-sans text-neutral-300 text-body hover:text-tertiary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-4">
              Connect
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:joeydodd@gmail.com"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-neutral-800 text-neutral-300 transition-colors duration-300 hover:text-tertiary"
                aria-label="Email Joey Dodd"
              >
                <EnvelopeSimple size={18} weight="regular" />
              </a>
              <a
                href="https://instagram.com/joeydoddart"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-neutral-800 text-neutral-300 transition-colors duration-300 hover:text-tertiary"
                aria-label="Joey Dodd on Instagram"
              >
                <InstagramLogo size={18} weight="regular" />
              </a>
              <a
                href="https://www.linkedin.com/in/joey-dodd-014b9961/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-neutral-800 text-neutral-300 transition-colors duration-300 hover:text-tertiary"
                aria-label="Joey Dodd on LinkedIn"
              >
                <LinkedinLogo size={18} weight="regular" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-neutral-500 text-body text-sm">
            &copy; {currentYear} Joey Dodd. All rights reserved.
          </p>
          <p className="font-mono text-neutral-600 text-xs uppercase tracking-widest">
            Visual Artist &amp; Illustrator
          </p>
        </div>
      </div>
    </footer>
  );
}
