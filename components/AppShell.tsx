"use client";

import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string; external?: boolean };

export default function AppShell({
  nav,
  userLabel,
  children,
}: {
  nav: NavItem[];
  userLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function linkClass(item: NavItem) {
    const active = pathname === item.href;
    return `block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
      active
        ? "bg-brand text-white font-medium"
        : "text-blue-100 hover:bg-white/10"
    }`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy-900 border-b-4 border-accent">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-navy-900 font-bold text-sm">
              FP
            </span>
            <p className="text-white font-semibold">MUET Fee Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-blue-100">
              {userLabel}
            </span>
            <button
              onClick={logout}
              className="text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden md:block w-56 shrink-0 bg-navy-800 p-3 space-y-1">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              className={linkClass(item)}
            >
              {item.label}
            </a>
          ))}
        </aside>

        <div className="flex-1 min-w-0">
          <nav className="md:hidden flex gap-2 overflow-x-auto bg-navy-800 px-3 py-2">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                className={linkClass(item)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}