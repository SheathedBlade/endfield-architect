import { BookOpen, Diamond } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Planner", icon: Diamond, end: true },
  { to: "/help", label: "Help", icon: BookOpen, end: false },
];

const MainNav = () => {
  return (
    <nav className="flex items-center gap-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `nav-link ${isActive ? "nav-link--active" : ""}`
          }
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MainNav;
