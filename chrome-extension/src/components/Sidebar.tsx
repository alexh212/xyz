import React from "react";

export type ReviewCategory = "security" | "performance" | "codeQuality" | "bestPractices";

export interface ReviewIssue {
  id: string;
  category: ReviewCategory;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  filePath?: string;
  line?: number;
  suggestion?: string;
}

export interface SidebarSummary {
  totalFindings: number;
  security: number;
  performance: number;
  codeQuality: number;
  bestPractices: number;
}

export interface SidebarProps {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  summary: SidebarSummary;
  issues: ReviewIssue[];
  onClose: () => void;
  onRetry?: () => void;
}

const categoryConfig: Record<
  ReviewCategory,
  { title: string; badgeClass: string; borderClass: string }
> = {
  security: {
    title: "Security Issues",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    borderClass: "border-red-200",
  },
  performance: {
    title: "Performance",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    borderClass: "border-yellow-200",
  },
  codeQuality: {
    title: "Code Quality",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    borderClass: "border-blue-200",
  },
  bestPractices: {
    title: "Best Practices",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    borderClass: "border-green-200",
  },
};

const categoryOrder: ReviewCategory[] = [
  "security",
  "performance",
  "codeQuality",
  "bestPractices",
];

const groupByCategory = (issues: ReviewIssue[]) =>
  issues.reduce<Record<ReviewCategory, ReviewIssue[]>>(
    (acc, issue) => {
      acc[issue.category].push(issue);
      return acc;
    },
    {
      security: [],
      performance: [],
      codeQuality: [],
      bestPractices: [],
    },
  );

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isLoading = false,
  error,
  summary,
  issues,
  onClose,
  onRetry,
}) => {
  const grouped = groupByCategory(issues);

  return (
    <aside
      className={`fixed right-0 top-0 z-[9999] h-screen w-[420px] max-w-[95vw] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">AI PR Review</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </header>

        <section className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Summary</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded border border-slate-200 bg-white p-2">
              <div className="text-xs text-slate-500">Total Findings</div>
              <div className="text-lg font-semibold text-slate-900">{summary.totalFindings}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-2">
              <div className="text-xs text-slate-500">Security</div>
              <div className="text-lg font-semibold text-red-600">{summary.security}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-2">
              <div className="text-xs text-slate-500">Performance</div>
              <div className="text-lg font-semibold text-yellow-600">{summary.performance}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-2">
              <div className="text-xs text-slate-500">Code Quality + Best Practices</div>
              <div className="text-lg font-semibold text-slate-900">
                {summary.codeQuality + summary.bestPractices}
              </div>
            </div>
          </div>
        </section>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="animate-pulse rounded border border-slate-200 p-3">
                  <div className="h-3 w-1/3 rounded bg-slate-200" />
                  <div className="mt-2 h-2 rounded bg-slate-200" />
                  <div className="mt-1 h-2 w-5/6 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Couldn&apos;t complete AI review.</p>
              <p className="mt-1">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-6">
              {categoryOrder.map((category) => {
                const categoryIssues = grouped[category];
                const config = categoryConfig[category];

                return (
                  <section key={category}>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">{config.title}</h4>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${config.badgeClass}`}
                      >
                        {categoryIssues.length}
                      </span>
                    </div>

                    {categoryIssues.length === 0 ? (
                      <div className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                        No findings in this category.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categoryIssues.map((issue) => (
                          <article
                            key={issue.id}
                            className={`rounded border bg-white p-3 ${config.borderClass}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-semibold text-slate-900">{issue.title}</h5>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {issue.severity}
                              </span>
                            </div>

                            {(issue.filePath || issue.line) && (
                              <p className="mt-1 text-xs text-slate-500">
                                {issue.filePath}
                                {issue.line ? `:${issue.line}` : ""}
                              </p>
                            )}

                            <p className="mt-2 text-xs leading-relaxed text-slate-700">
                              {issue.description}
                            </p>

                            {issue.suggestion && (
                              <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-700">
                                <span className="font-semibold">Suggested fix:</span> {issue.suggestion}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
