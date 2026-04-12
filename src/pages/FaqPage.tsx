import { PATCHES } from "@/types";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

const faqCategories = [
  {
    title: "Patches",
    items: [
      {
        q: "Why does switching patches clear my production goals?",
        a: "Different patches can have different recipes and item availability. Switching patches resets the production plan to avoid mixing data from different patch versions.",
      },
      {
        q: "What patches are currently available?",
        a: `Available patches: ${PATCHES.join(", ")}. You can switch between them using the patch selector in the header.`,
      },
      {
        q: "Will my results change between patches?",
        a: "Yes. Some items, recipes, and facilities may differ between patches. Always verify you're using the correct patch for your in-game progress.",
      },
    ],
  },
  {
    title: "Regions",
    items: [
      {
        q: "Why can't I use water-based recipes in the Valley?",
        a: "Clean water is only available in Wuling, not the Valley. Fluid-mode recipes require clean water, so they're excluded when the Valley is selected as your active region.",
      },
      {
        q: "What raw materials are available in each region?",
        a: "Valley: Originium Ore (560/min), Amethyst Ore (240/min), Ferrium Ore (1080/min). Wuling: Originium Ore (480/min), Ferrium Ore (90/min), Cuprium Ore (120/min), Clean Water (unlimited). Raw material caps vary by region and patch.",
      },
      {
        q: "How do I unlock sites in a region?",
        a: "Use the Region & Site Control panel to lock or unlock sites. Core sites are always active. Unlock sub-sites to include their production in your plan.",
      },
    ],
  },
  {
    title: "Recipes & Solver",
    items: [
      {
        q: "Why does the solver say an item can't be produced?",
        a: "The item may require a recipe that isn't available in your current region or patch. It could also be a raw material that must be supplied manually, or the solver may have encountered a cycle it cannot resolve.",
      },
      {
        q: "What is the seed/plant loop?",
        a: "The only real production cycle in the game: Seeds → Planting Unit → Plants → Seed-Picking Unit → Seeds. Jincao and Yazhen break even on seeds; Buckflower, Citrome, Sandleaf, and Aketine produce a seed surplus.",
      },
      {
        q: "What do recipe overrides do?",
        a: "Recipe overrides let you force the solver to use a specific recipe for an item, bypassing the default selection logic. This is useful when multiple recipes exist for the same output.",
      },
    ],
  },
  {
    title: "Errors & Limits",
    items: [
      {
        q: "Why am I seeing a raw material cap error?",
        a: "Your production plan requires more of a raw material than the region can supply per minute. Either reduce your goals, supply the material manually, or switch to a region with higher caps.",
      },
      {
        q: "What does 'Failed to solve' mean?",
        a: "The solver couldn't find a valid production path for the goal item within the current constraints. Try simplifying your goals, switching regions, or checking for missing raw materials.",
      },
      {
        q: "Are there limits on how much I can produce?",
        a: "Raw materials have per-minute caps based on your active region. The solver will warn you if your plan exceeds these caps.",
      },
    ],
  },
];

const FaqPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;
    const q = searchQuery.trim().toLowerCase();
    return faqCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          const question = item.q.toLowerCase();
          const answer: string =
            typeof item.a === "function"
              ? ""
              : item.a.toLowerCase();
          const category = cat.title.toLowerCase();
          return (
            question.includes(q) || answer.includes(q) || category.includes(q)
          );
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const toggle = (catIndex: number, itemIndex: number) => {
    const key = catIndex * 100 + itemIndex;
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-text-muted">
          Help
        </span>
        <span className="text-text-dim text-xs">/</span>
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-accent">
          FAQ
        </span>
      </div>

      <div className="help-page-header">
        <h2 className="help-page-title">Frequently Asked Questions</h2>
        <p className="help-page-subtitle">COMMON QUESTIONS</p>
      </div>

      {/* Search */}
      <div className="faq-search">
        <Search className="faq-search-icon" strokeWidth={2} />
        <input
          type="text"
          className="faq-search-input"
          placeholder="Search FAQ..."
          aria-label="Search FAQ"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Results */}
      {filteredCategories.length > 0 ? (
        <div className="faq-list">
          {filteredCategories.map((cat, catIndex) => (
            <div key={cat.title} className="faq-category">
              <h3 className="faq-category-title">{cat.title}</h3>
              <div className="faq-items">
                {cat.items.map((item, itemIndex) => {
                  const key = catIndex * 100 + itemIndex;
                  const isOpen = openItems.has(key);
                  const answer: string =
                    typeof item.a === "function"
                      ? (item.a as () => string)()
                      : item.a;
                  return (
                    <div key={`${catIndex}-${itemIndex}`} className="faq-item">
                      <button
                        type="button"
                        className="faq-question w-full"
                        onClick={() => toggle(catIndex, itemIndex)}
                        aria-expanded={isOpen}
                      >
                        <span
                          className="text-text-muted hover:text-text-primary transition-colors w-6 shrink-0 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" strokeWidth={2} />
                          ) : (
                            <ChevronRight className="w-4 h-4" strokeWidth={2} />
                          )}
                        </span>
                        <span className="flex-1 text-left">{item.q}</span>
                      </button>
                      <div className={`faq-answer${isOpen ? " expanded" : ""}`}>
                        <div>
                          <p>{answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="faq-search-empty">
          No FAQ entries match &ldquo;{searchQuery}&rdquo;
        </div>
      )}
    </div>
  );
};

export default FaqPage;
