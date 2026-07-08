import type { ComponentType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "motion/react";
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

const INDICATOR_SPRING = { type: "spring", stiffness: 380, damping: 34 } as const;

export default function TabBar() {
  const { pathname } = useLocation();
  const activeIndex = tabs.findIndex(
    (t) => pathname === t.to || pathname.startsWith(t.to + "/")
  );

  return (
    <nav className="relative flex border-t border-seam bg-chalk pb-[env(safe-area-inset-bottom)]">
      {activeIndex !== -1 && (
        <motion.span
          aria-hidden="true"
          className="absolute left-0 top-0 flex justify-center"
          style={{ width: `${100 / tabs.length}%` }}
          animate={{ x: `${activeIndex * 100}%` }}
          transition={INDICATOR_SPRING}
        >
          <span className="h-0.5 w-9 rounded-full bg-klein" />
        </motion.span>
      )}
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            "flex flex-1 justify-center pb-2 pt-2.5 text-center text-xs font-medium transition-colors duration-150 " +
            (isActive ? "text-klein" : "text-smoke")
          }
        >
          <motion.span whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1">
            <t.icon className="h-[22px] w-[22px]" />
            {t.label}
          </motion.span>
        </NavLink>
      ))}
    </nav>
  );
}
