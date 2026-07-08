import type { ComponentType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { IconBookmark, IconCompass, IconUser } from "./icons";

interface Tab {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { to: "/explore", label: "Explorer", icon: IconCompass },
  { to: "/saved", label: "Lookbook", icon: IconBookmark },
  { to: "/profile", label: "Profil", icon: IconUser }
];

export default function TabBar() {
  const { pathname } = useLocation();
  const activeIndex = tabs.findIndex(
    (t) => pathname === t.to || pathname.startsWith(t.to + "/")
  );

  return (
    <nav className="relative flex border-t border-seam bg-chalk pb-[env(safe-area-inset-bottom)]">
      {activeIndex !== -1 && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 flex justify-center transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)]"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${activeIndex * 100}%)`
          }}
        >
          <span className="h-0.5 w-9 rounded-full bg-klein" />
        </span>
      )}
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            "flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-center text-xs font-medium transition-colors duration-150 " +
            (isActive ? "text-klein" : "text-smoke")
          }
        >
          <t.icon className="h-[22px] w-[22px]" />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
