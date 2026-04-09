import { Link, useLocation } from "react-router-dom";

const ADMIN_PORTAL_LINKS = [
  { label: "Portfolio", href: "/admin" },
  { label: "Lessons", href: "/admin/lessons" },
  { label: "Submissions", href: "/admin/submissions" },
  { label: "Community", href: "/admin/community" },
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/admin") {
    return currentPath === "/admin";
  }

  return currentPath.startsWith(href);
}

export default function AdminPortalNav() {
  const location = useLocation();

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {ADMIN_PORTAL_LINKS.map((link) => {
        const active = isActivePath(location.pathname, link.href);

        return (
          <Link
            key={link.href}
            to={link.href}
            className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] transition-colors duration-300 ${
              active
                ? "border-tertiary bg-tertiary text-background"
                : "border-border bg-secondary text-neutral-300 hover:border-tertiary hover:text-tertiary"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
