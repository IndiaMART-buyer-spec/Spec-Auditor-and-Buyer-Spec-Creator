import React, { useState } from "react";
import type { ISQ } from "../types";

interface Stage3ResultsProps {
  commonSpecs: Array<{
    spec_name: string;
    options: string[];
    category: string;
  }>;
  buyerISQs: ISQ[];
}

export default function Stage3Results({ commonSpecs, buyerISQs }: Stage3ResultsProps) {
  const [showAllBuyerISQs, setShowAllBuyerISQs] = useState(false);

  const primaryCommonSpecs = commonSpecs.filter((s) => s.category === "Primary");
  const secondaryCommonSpecs = commonSpecs.filter((s) => s.category === "Secondary");

  const displayedBuyerISQs = showAllBuyerISQs ? buyerISQs : buyerISQs.slice(0, 2);
  const hasMoreBuyerISQs = buyerISQs.length > 2;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Stage 3: Final Specifications</h2>
      <p className="text-gray-600 mb-8">
        Common Specifications & Buyer ISQs
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Common Specifications with ALL Options */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              Common Specifications
            </h3>
          </div>
          <p className="text-sm text-blue-700 mb-6">
            Specifications that appear in both Stage 1 & Stage 2
          </p>

          <div className="max-h-[600px] overflow-y-auto pr-2">
            {commonSpecs.length === 0 ? (
              <div className="bg-white border border-blue-200 p-4 rounded-lg text-center">
                <p className="text-gray-600">No common specifications found</p>
              </div>
            ) : (
              <div className="bg-white border border-blue-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-200 bg-blue-100">
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">Specification</th>
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">Category</th>
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">Common Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commonSpecs.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                        <td className="px-4 py-3 font-medium text-gray-900 border-b border-blue-100">
                          {spec.spec_name}
                        </td>
                        <td className="px-4 py-3 border-b border-blue-100">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {spec.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-blue-100">
                          {spec.options.length === 0 ? (
                            <span className="text-gray-400 italic text-xs">No options</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {spec.options.map((option, optIdx) => (
                                <span
                                  key={optIdx}
                                  className="inline-block bg-blue-50 border border-blue-300 text-blue-800 px-2 py-1 rounded text-xs"
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Buyer ISQs */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-amber-900 flex items-center gap-2">
              Buyer ISQs
            </h3>
          </div>
          <p className="text-sm text-amber-700 mb-6">
           Bases on Seller ISQs & Website Benchmarking
          </p>

          <div className="max-h-[600px] overflow-y-auto pr-2">
            {buyerISQs.length === 0 ? (
              <div className="bg-white border border-amber-200 p-4 rounded-lg text-center">
                <p className="text-gray-600">No Buyer ISQs generated</p>
              </div>
            ) : (
              <>
                <div className="bg-white border border-amber-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-amber-200 bg-amber-100">
                        <th className="px-4 py-3 text-left font-semibold text-amber-900">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold text-amber-900">Specification</th>
                        <th className="px-4 py-3 text-left font-semibold text-amber-900">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedBuyerISQs.map((spec, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                          <td className="px-4 py-3 font-medium text-amber-900 border-b border-amber-100 w-8">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 border-b border-amber-100">
                            {spec.name}
                          </td>
                          <td className="px-4 py-3 border-b border-amber-100">
                            {spec.options.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {spec.options.map((option, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className="inline-block bg-amber-50 border border-amber-300 text-amber-800 px-2 py-1 rounded text-xs"
                                  >
                                    {option}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">No options</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasMoreBuyerISQs && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowAllBuyerISQs(!showAllBuyerISQs)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg transition-colors"
                    >
                      {showAllBuyerISQs ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Show Less
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show All {buyerISQs.length} Buyer ISQs
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}