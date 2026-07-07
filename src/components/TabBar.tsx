import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/explore", label: "Explorer" },
  { to: "/saved", label: "Lookbook" },
  { to: "/profile", label: "Profil" }
];

export default function TabBar() {
  return (
    <nav className="flex border-t border-seam bg-chalk pb-[env(safe-area-inset-bottom)]">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            "flex-1 py-3 text-center text-sm font-medium " +
            (isActive ? "text-klein" : "text-smoke")
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
