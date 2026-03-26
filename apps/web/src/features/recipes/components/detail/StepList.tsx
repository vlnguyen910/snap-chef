import type { StepFromAPI } from "../../types/recipe-detail";

interface StepListProps {
  steps: StepFromAPI[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-card p-6 dark:border-slate-800">
      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
        Step-by-Step Instructions
      </h2>

      {steps.length > 0 ? (
        <div className="flex flex-col gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex shrink-0 flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.order_index}
                </div>
                {index < steps.length - 1 && (
                  <div className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-800" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
                  Step {step.order_index}
                </p>
                <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {step.content}
                </p>
                {step.image_url && (
                  <div
                    className="h-40 w-full rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${step.image_url})` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="italic text-slate-500">
          No instructions available for this recipe.
        </p>
      )}
    </section>
  );
}
