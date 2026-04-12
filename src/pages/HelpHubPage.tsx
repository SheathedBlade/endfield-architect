import { BookOpen, ExternalLink, HelpCircle, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";

const helpCards = [
  {
    to: "/help/faq",
    icon: HelpCircle,
    title: "FAQ",
    description:
      "Common questions about patches, regions, recipes, and solver behavior.",
  },
  {
    to: "/help/how-to",
    icon: BookOpen,
    title: "How to Use",
    description: "Step-by-step guide to planning your AIC production.",
  },
  {
    to: "/help/changelog",
    icon: ScrollText,
    title: "Changelog",
    description: "Product updates and feature history.",
  },
];

const HelpHubPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg uppercase font-bold text-accent tracking-wide">
          Help & Support
        </h2>
        <p className="font-display text-xs text-text-muted mt-1 tracking-wider">
          GUIDES AND REFERENCE
        </p>
      </div>

      <div className="about-section">
        <h3 className="about-title">About Endfield Architect</h3>
        <p className="about-body text-text-secondary">
          Endfield Architect is a fan-made production planning tool for
          Arknights: Endfield. If you want to find the most efficient way to
          meet your production goals, and don't want to work it out by hand,
          this tool is for you. It uses a solver engine to compute the optimal
          set of facilities and recipes based on your goals and current region.
        </p>
        <p className="about-body text-text-muted">
          All game content, including but not limited to facility names, item
          names, recipes, and locations, are property of their respective
          owners. This tool is not affiliated with, endorsed by, or connected to
          Hypergryph. Arknights and Arknights: Endfield are trademarks of
          Hypergryph.
        </p>
        <a
          href="https://github.com/SheathedBlade/endfield-architect"
          target="_blank"
          rel="noreferrer noopener"
          className="about-link"
        >
          View Source on GitHub
          <ExternalLink className="about-link-icon" strokeWidth={2} />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {helpCards.map(({ to, icon: Icon, title, description }, i) => (
          <Link key={to} to={to} className={`help-card group stagger-${i}`}>
            <div className="help-card-icon">
              <Icon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                {title}
              </span>
              <span className="font-sans text-xs text-text-muted leading-relaxed">
                {description}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HelpHubPage;
