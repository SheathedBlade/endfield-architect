const changelogEntries = [
  {
    version: "1.0.0",
    date: "April 4, 2026",
    type: "feature",
    entries: [
      "Initial Endfield Architect release",
      "Production goal planning with recursive solver",
      "Patch version selector (1.0, 1.1)",
      "Region selection (Valley, Wuling) with site lock/unlock",
      "Raw material cap enforcement and error display",
      "URL-based plan persistence via lz-string",
      "Help system with FAQ, How to Use, and Changelog",
    ],
  },
];

const ChangelogPage = () => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-text-muted">Help</span>
        <span className="text-text-dim text-xs">/</span>
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-accent">Changelog</span>
      </div>

      <div className="help-page-header">
        <h2 className="help-page-title">Changelog</h2>
        <p className="help-page-subtitle">PRODUCT HISTORY</p>
      </div>

      <div className="changelog">
        {changelogEntries.map((release) => (
          <div key={release.version} className="changelog-release">
            <div className="changelog-release-header">
              <span className="changelog-version">v{release.version}</span>
              <span className="changelog-date">{release.date}</span>
            </div>
            <ul className="changelog-entries">
              {release.entries.map((entry) => (
                <li key={entry} className="changelog-entry">
                  <span className="changelog-entry-bullet">—</span>
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangelogPage;
