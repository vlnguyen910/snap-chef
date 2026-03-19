import type { StepFromAPI } from '../../types/recipe-detail';

interface StepListProps {
  steps: StepFromAPI[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1 h-8 bg-orange-500 rounded-full" />
        Instructions
      </h2>
      
      {steps.length > 0 ? (
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4 group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {step.order_index}
                </div>
              </div>
              <div className="flex-1 pt-2">
                <p className="text-gray-700 leading-relaxed text-lg mb-3">
                  {step.content}
                </p>
                {step.image_url && (
                  <img 
                    src={step.image_url} 
                    alt={`Step ${step.order_index}`}
                    className="rounded-lg shadow-md max-h-96 w-full md:w-auto object-contain mt-3"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">No instructions available for this recipe.</p>
      )}
    </>
  );
}
