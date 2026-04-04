const howToSteps = [
  {
    number: "01",
    title: "Choose Your Patch",
    body: "Use the patch selector in the header to choose the game patch matching your current progress. Different patches may have different recipes and item availability. Switching patches will clear your current goals.",
  },
  {
    number: "02",
    title: "Select Your Region",
    body: "Use the Region & Site Control panel to choose your active region. Each region has different raw material availability — Valley has ore deposits, Wuling has clean water for fluid-mode recipes.",
  },
  {
    number: "03",
    title: "Add Production Goals",
    body: "Click Add Goal in the Production Goals panel. Search for the item you want to produce, set your target rate per minute, and confirm. Add as many goals as you need.",
  },
  {
    number: "04",
    title: "Calculate Your Plan",
    body: "The solver will automatically compute the facility counts and raw material requirements needed to meet your goals. Results appear in the right panel as a collapsible tree.",
  },
  {
    number: "05",
    title: "Read the Results",
    body: "Expand nodes to see each step of the production chain. The tree shows which facilities are needed, how many, and what inputs they consume. Watch for cycle indicators on seed/plant loops.",
  },
  {
    number: "06",
    title: "Watch for Errors",
    body: "If the solver can't produce an item or exceeds raw material caps, errors appear at the top of the planner. Check the FAQ for guidance on common errors.",
  },
];

const HowToUsePage = () => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-text-muted">Help</span>
        <span className="text-text-dim text-xs">/</span>
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-accent">How to Use</span>
      </div>

      <div className="help-page-header">
        <h2 className="help-page-title">How to Use</h2>
        <p className="help-page-subtitle">GETTING STARTED</p>
      </div>

      <div className="how-to-steps">
        {howToSteps.map((step) => (
          <div key={step.number} className="how-to-step">
            <div className="how-to-step-number">{step.number}</div>
            <div className="how-to-step-content">
              <h3 className="how-to-step-title">{step.title}</h3>
              <p className="how-to-step-body">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="how-to-tip">
        <div className="how-to-tip-label">Tip</div>
        <p>
          You can override specific recipes or raw input rates in the store to
          experiment with custom production chains.
        </p>
      </div>
    </div>
  );
};

export default HowToUsePage;
