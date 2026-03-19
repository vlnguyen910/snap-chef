import { SlidersHorizontal } from "lucide-react";

type FilterOption = "all" | "popular" | "recent";

interface FeedFilterBarProps {
  active: FilterOption;
  onChange: (filter: FilterOption) => void;
}

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: "all", label: "All" },
  { key: "popular", label: "Popular" },
  { key: "recent", label: "Recent" },
];

export default function FeedFilterBar({
  active,
  onChange,
}: Readonly<FeedFilterBarProps>) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black tracking-tight">Latest Recipes</h2>
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
              active === key
                ? "bg-primary/10 text-primary font-bold"
                : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors"
          aria-label="More filters"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
