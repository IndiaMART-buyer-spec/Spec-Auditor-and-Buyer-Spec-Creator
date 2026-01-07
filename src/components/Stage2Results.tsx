import React from "react";
import type { ISQ } from "../types";

interface Stage2ResultsProps {
  isqs: {
    config: ISQ;
    keys: ISQ[];
  };
  onDownloadExcel: () => void;
}

// Helper function to clean options
function cleanOption(option: string): string {
  if (!option) return "";
  
  let cleaned = option.trim();
  
  // Remove surrounding quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Remove JSON artifacts like "options":[" prefix
  cleaned = cleaned.replace(/^options\s*:\s*\[\s*/i, '');
  cleaned = cleaned.replace(/\s*\]\s*$/i, '');
  
  // Fix escaped characters
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\n/g, ' ');
  cleaned = cleaned.replace(/\\t/g, ' ');
  
  // Remove any remaining JSON brackets
  cleaned = cleaned.replace(/^\[/, '');
  cleaned = cleaned.replace(/\]$/, '');
  
  return cleaned.trim();
}

export default function Stage2Results({ isqs }: Stage2ResultsProps) {
  // Clean all options before displaying
  const cleanConfigOptions = isqs.config.options.map(cleanOption).filter(opt => opt.length > 0);
  const cleanKeys = isqs.keys.map(key => ({
    ...key,
    options: key.options.map(cleanOption).filter(opt => opt.length > 0)
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Stage 2: ISQ Extraction Complete</h2>
      <p className="text-gray-600 mb-8">Review the extracted ISQs below</p>

      <div className="space-y-8">
        {/* Config ISQ */}
        <div className="mb-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-red-900 mb-4">Config ISQ</h2>
            <div className="mb-4">
              <p className="font-semibold text-lg text-gray-900">{isqs.config.name}</p>
              <p className="text-sm text-gray-600 mt-1">Influences pricing and primary product variation</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cleanConfigOptions.length > 0 ? (
                cleanConfigOptions.map((option, idx) => (
                  <span key={idx} className="bg-red-200 text-red-800 px-4 py-2 rounded-full font-medium">
                    {option}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 italic">No options available</span>
              )}
            </div>
          </div>
        </div>

        {/* Key ISQs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key ISQs ({cleanKeys.length})</h2>
          <div className="grid gap-4">
            {cleanKeys.map((isq, idx) => (
              <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                <p className="font-semibold text-lg text-gray-900 mb-3">
                  {idx + 1}. {isq.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {isq.options.length > 0 ? (
                    isq.options.map((option, oIdx) => (
                      <span key={oIdx} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {option}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No options available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}