import { NavLink } from "react-router-dom";
import { BookOpen, HelpCircle, ScrollText } from "lucide-react";

const helpNavItems = [
  { to: "/help", label: "Overview", icon: BookOpen, end: true },
  { to: "/help/faq", label: "FAQ", icon: HelpCircle, end: false },
  { to: "/help/how-to", label: "How to Use", icon: BookOpen, end: false },
];

const referenceNavItems = [
  { to: "/help/changelog", label: "Changelog", icon: ScrollText, end: true },
];

const HelpNav = () => {
  return (
    <div className="help-nav">
      <span className="help-nav-label">Help</span>
      <nav className="help-nav-links">
        {helpNavItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `help-nav-item ${isActive ? "help-nav-item--active" : ""}`
            }
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <span className="help-nav-label help-nav-label--reference">Reference</span>
      <nav className="help-nav-links">
        {referenceNavItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `help-nav-item ${isActive ? "help-nav-item--active" : ""}`
            }
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default HelpNav;
