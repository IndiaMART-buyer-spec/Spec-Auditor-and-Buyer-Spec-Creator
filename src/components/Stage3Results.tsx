import React, { useState } from "react";
import type { Stage1Output, ISQ } from "../types";

interface Stage3ResultsProps {
  stage1Data: Stage1Output;
  isqs: {
    config: ISQ;
    keys: ISQ[];
    buyers: ISQ[];
  };
}

interface CommonSpecItem {
  spec_name: string;
  options: string[];
  input_type: string;
  category: "Primary" | "Secondary";
  priority: number;
}

interface BuyerISQItem {
  spec_name: string;
  options: string[];
  category: "Primary" | "Secondary";
}

export default function Stage3Results({ stage1Data, isqs }: Stage3ResultsProps) {
  if (!isqs || (!isqs.config && !isqs.keys?.length)) {
    return <div className="text-gray-500">No ISQ data found</div>;
  }

  const { commonSpecs, buyerISQs } = extractCommonAndBuyerSpecs(stage1Data, isqs);
  const [showAllBuyerISQs, setShowAllBuyerISQs] = useState(false);

  const primaryCommonSpecs = commonSpecs.filter((s) => s.category === "Primary");
  const secondaryCommonSpecs = commonSpecs.filter((s) => s.category === "Secondary");

  // Determine which Buyer ISQs to show
  const displayedBuyerISQs = showAllBuyerISQs ? buyerISQs : buyerISQs.slice(0, 2);
  const hasMoreBuyerISQs = buyerISQs.length > 2;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Stage 3: Final Specifications</h2>
      <p className="text-gray-600 mb-8">
        Specifications common to both Stage 1 and Stage 2
      </p>

      {commonSpecs.length === 0 && buyerISQs.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-yellow-800">
          <p className="font-semibold">No common specifications found</p>
          <p className="text-sm mt-2">
            There are no specifications that appear in both stages.
            <br />
            Stage 1 has {stage1Data.seller_specs?.reduce((total, ss) => 
              total + ss.mcats.reduce((mcatTotal, mcat) => 
                mcatTotal + 
                mcat.finalized_specs.finalized_primary_specs.specs.length +
                mcat.finalized_specs.finalized_secondary_specs.specs.length
              , 0)
            , 0)} specs.
            <br />
            Stage 2 has {isqs.config ? 1 : 0} config + {isqs.keys?.length || 0} keys + {isqs.buyers?.length || 0} buyers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Common Specifications */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
                  <span className="inline-block w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center text-blue-900 text-lg font-bold">
                    {commonSpecs.length}
                  </span>
                  Common Specifications
                </h3>
                <div className="text-sm text-blue-700 font-medium">
                  {primaryCommonSpecs.length} Primary, {secondaryCommonSpecs.length} Secondary
                </div>
              </div>
              <p className="text-sm text-blue-700 mb-6">
                Specifications that appear in both Stage 1 and Stage 2
              </p>

              <div className="space-y-6">
                {primaryCommonSpecs.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-blue-700 mb-3">Primary Specs</h4>
                    <div className="space-y-4">
                      {primaryCommonSpecs.map((spec, idx) => (
                        <SpecCard key={idx} spec={spec} color="blue" />
                      ))}
                    </div>
                  </div>
                )}

                {secondaryCommonSpecs.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 mb-3">Secondary Specs</h4>
                    <div className="space-y-4">
                      {secondaryCommonSpecs.map((spec, idx) => (
                        <SpecCard key={idx} spec={spec} color="green" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Buyer ISQs */}
          <div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-amber-900 flex items-center gap-2">
                  <span className="inline-block w-10 h-10 bg-amber-300 rounded-full flex items-center justify-center text-amber-900 text-lg font-bold">
                    {buyerISQs.length}
                  </span>
                  Buyer ISQs
                </h3>
                <div className="text-sm text-amber-700 font-medium">
                  Based on buyer search patterns
                </div>
              </div>
              <p className="text-sm text-amber-700 mb-6">
                Important specifications frequently searched by buyers
              </p>

              {buyerISQs.length > 0 ? (
                <div>
                  <div className="space-y-6">
                    {displayedBuyerISQs.map((spec, idx) => (
                      <SpecCard key={idx} spec={spec} color="amber" />
                    ))}
                  </div>
                  
                  {hasMoreBuyerISQs && (
                    <div className="mt-6 text-center">
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
                </div>
              ) : (
                <div className="bg-white border border-amber-200 p-6 rounded-lg text-center">
                  <p className="text-gray-600">No buyer ISQs available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-8 border-t-2 border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Common Specifications:</strong> {commonSpecs.length} specification
              {commonSpecs.length !== 1 ? "s" : ""} found across both stages.
              {primaryCommonSpecs.length > 0 && ` ${primaryCommonSpecs.length} Primary,`}
              {secondaryCommonSpecs.length > 0 && ` ${secondaryCommonSpecs.length} Secondary`}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Buyer ISQs:</strong> {buyerISQs.length} specification
              {buyerISQs.length !== 1 ? "s" : ""} based on buyer search patterns.
              {hasMoreBuyerISQs && !showAllBuyerISQs && ` Showing 2 of ${buyerISQs.length}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecCard({
  spec,
  color,
}: {
  spec: CommonSpecItem | BuyerISQItem;
  color: "blue" | "green" | "amber";
}) {
  const colorClasses = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100" },
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} border ${colors.border} p-4 rounded-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-lg">{spec.spec_name}</div>
          <div className="text-xs text-gray-600 mt-2">
            <span className={`inline-block ${colors.badge} px-2 py-1 rounded`}>
              {spec.category}
            </span>
            {spec.options.length === 0 && (
              <span className="inline-block ml-2 text-gray-500 text-xs">
                (No common options)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {spec.options.length > 0 ? (
          spec.options.map((option, idx) => (
            <span key={idx} className={`${colors.text} bg-white border border-current px-3 py-1 rounded-full text-sm`}>
              {option}
            </span>
          ))
        ) : (
          <span className="text-gray-400 italic text-sm">
            No common options available for this specification
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN FUNCTION
// ============================================

function extractCommonAndBuyerSpecs(
  stage1: Stage1Output,
  isqs: { config: ISQ; keys: ISQ[]; buyers: ISQ[] }
): { commonSpecs: CommonSpecItem[]; buyerISQs: BuyerISQItem[] } {
  console.log('🚀 Stage3: Starting extraction...');
  
  const stage1AllSpecs = extractAllStage1Specs(stage1);
  console.log('📊 Stage 1 specs:', stage1AllSpecs.length);
  
  const stage2AllISQs = extractAllStage2ISQs(isqs);
  console.log('📊 Stage 2 ISQs:', stage2AllISQs.length);
  
  const commonSpecs = findCommonSpecs(stage1AllSpecs, stage2AllISQs);
  console.log('🎯 Found common specs:', commonSpecs.length);
  
  const buyerISQs = selectBuyerISQs(commonSpecs, stage1AllSpecs);
  console.log('🛒 Buyer ISQs:', buyerISQs.length);
  
  return {
    commonSpecs,
    buyerISQs
  };
}

// Helper: Extract all specs from Stage 1
function extractAllStage1Specs(stage1: Stage1Output): Array<{
  spec_name: string;
  options: string[];
  input_type: string;
  tier: 'Primary' | 'Secondary';
  priority: number;
}> {
  const specs: Array<{
    spec_name: string;
    options: string[];
    input_type: string;
    tier: 'Primary' | 'Secondary';
    priority: number;
  }> = [];
  
  if (!stage1.seller_specs || stage1.seller_specs.length === 0) {
    console.warn('⚠️ No seller_specs found in Stage 1');
    return specs;
  }
  
  stage1.seller_specs.forEach(sellerSpec => {
    sellerSpec.mcats.forEach(mcat => {
      mcat.finalized_specs.finalized_primary_specs.specs.forEach(spec => {
        if (spec.spec_name && spec.options) {
          specs.push({
            spec_name: spec.spec_name,
            options: spec.options,
            input_type: spec.input_type || 'text',
            tier: 'Primary',
            priority: 3
          });
        }
      });
      
      mcat.finalized_specs.finalized_secondary_specs.specs.forEach(spec => {
        if (spec.spec_name && spec.options) {
          specs.push({
            spec_name: spec.spec_name,
            options: spec.options,
            input_type: spec.input_type || 'text',
            tier: 'Secondary',
            priority: 2
          });
        }
      });
      
      if (mcat.finalized_specs.finalized_tertiary_specs?.specs) {
        mcat.finalized_specs.finalized_tertiary_specs.specs.forEach(spec => {
          if (spec.spec_name && spec.options) {
            specs.push({
              spec_name: spec.spec_name,
              options: spec.options,
              input_type: spec.input_type || 'text',
              tier: 'Secondary',
              priority: 1
            });
          }
        });
      }
    });
  });
  
  return specs;
}

// Helper: Extract all ISQs from Stage 2
function extractAllStage2ISQs(isqs: { config: ISQ; keys: ISQ[]; buyers: ISQ[] }): Array<{
  name: string;
  options: string[];
  priority: number;
}> {
  const isqList: Array<{
    name: string;
    options: string[];
    priority: number;
  }> = [];
  
  if (isqs.config && isqs.config.name && isqs.config.options?.length > 0) {
    isqList.push({
      name: isqs.config.name,
      options: isqs.config.options,
      priority: 3
    });
  }
  
  if (isqs.keys && isqs.keys.length > 0) {
    isqs.keys.forEach(key => {
      if (key.name && key.options?.length > 0) {
        isqList.push({
          name: key.name,
          options: key.options,
          priority: 2
        });
      }
    });
  }
  
  if (isqs.buyers && isqs.buyers.length > 0) {
    isqs.buyers.forEach(buyer => {
      if (buyer.name && buyer.options?.length > 0) {
        isqList.push({
          name: buyer.name,
          options: buyer.options,
          priority: 1
        });
      }
    });
  }
  
  return isqList;
}

// Helper: Find common specs with semantic matching
function findCommonSpecs(
  stage1Specs: Array<{ spec_name: string; options: string[]; input_type: string; tier: 'Primary' | 'Secondary'; priority: number }>,
  stage2ISQs: Array<{ name: string; options: string[]; priority: number }>
): CommonSpecItem[] {
  const commonSpecs: CommonSpecItem[] = [];
  const matchedStage2Indices = new Set<number>();
  
  stage1Specs.forEach(stage1Spec => {
    let bestMatchIndex = -1;
    let bestMatchPriority = 0;
    let bestMatchOptions: string[] = [];
    
    stage2ISQs.forEach((stage2ISQ, index) => {
      if (matchedStage2Indices.has(index)) return;
      
      if (areSpecsSimilar(stage1Spec.spec_name, stage2ISQ.name)) {
        const combinedPriority = stage1Spec.priority + stage2ISQ.priority;
        
        if (combinedPriority > bestMatchPriority) {
          bestMatchIndex = index;
          bestMatchPriority = combinedPriority;
          bestMatchOptions = stage2ISQ.options;
        }
      }
    });
    
    if (bestMatchIndex !== -1) {
      matchedStage2Indices.add(bestMatchIndex);
      
      const commonOptions = findCommonOptions(stage1Spec.options, bestMatchOptions);
      
      commonSpecs.push({
        spec_name: stage1Spec.spec_name,
        options: commonOptions,
        input_type: stage1Spec.input_type,
        category: stage1Spec.tier,
        priority: bestMatchPriority
      });
    }
  });
  
  const uniqueSpecs = commonSpecs.filter((spec, index, self) => 
    index === self.findIndex(s => s.spec_name === spec.spec_name)
  );
  
  uniqueSpecs.sort((a, b) => b.priority - a.priority);
  
  return uniqueSpecs;
}

// Helper: Check if two specs are similar
function areSpecsSimilar(spec1: string, spec2: string): boolean {
  if (!spec1 || !spec2) return false;
  
  const norm1 = normalizeSpecName(spec1);
  const norm2 = normalizeSpecName(spec2);
  
  if (norm1 === norm2) return true;
  
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  const synonymGroups = [
    ['material', 'composition', 'fabric'],
    ['grade', 'quality', 'class', 'standard'],
    ['thickness', 'thk', 'gauge'],
    ['size', 'dimension', 'measurement'],
    ['diameter', 'dia', 'bore'],
    ['length', 'long', 'lng'],
    ['width', 'breadth', 'wide'],
    ['height', 'high', 'depth'],
    ['color', 'colour', 'shade'],
    ['finish', 'surface', 'coating', 'polish'],
    ['weight', 'wt', 'mass'],
    ['type', 'kind', 'variety', 'style'],
    ['shape', 'form', 'profile'],
    ['hole', 'perforation', 'aperture'],
    ['pattern', 'design', 'arrangement'],
    ['application', 'use', 'purpose', 'usage']
  ];
  
  for (const group of synonymGroups) {
    const hasSpec1 = group.some(word => norm1.includes(word));
    const hasSpec2 = group.some(word => norm2.includes(word));
    if (hasSpec1 && hasSpec2) return true;
  }
  
  return false;
}

// Helper: Normalize spec name
function normalizeSpecName(name: string): string {
  if (!name) return '';
  
  let normalized = name.toLowerCase().trim();
  normalized = normalized.replace(/[()\-_,.;]/g, ' ');
  
  const standardizations: Record<string, string> = {
    'material': 'material',
    'grade': 'grade',
    'thk': 'thickness',
    'thickness': 'thickness',
    'type': 'type',
    'shape': 'shape',
    'size': 'size',
    'dimension': 'size',
    'length': 'length',
    'width': 'width',
    'height': 'height',
    'dia': 'diameter',
    'diameter': 'diameter',
    'color': 'color',
    'colour': 'color',
    'finish': 'finish',
    'surface': 'finish',
    'weight': 'weight',
    'wt': 'weight',
    'capacity': 'capacity',
    'brand': 'brand',
    'model': 'model',
    'quality': 'quality',
    'standard': 'standard',
    'specification': 'spec',
    'perforation': 'hole',
    'hole': 'hole',
    'pattern': 'pattern',
    'design': 'design',
    'application': 'application',
    'usage': 'application'
  };
  
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  const standardizedWords = words.map(word => {
    if (standardizations[word]) {
      return standardizations[word];
    }
    
    for (const [key, value] of Object.entries(standardizations)) {
      if (word.includes(key) || key.includes(word)) {
        return value;
      }
    }
    
    return word;
  });
  
  const uniqueWords = [...new Set(standardizedWords)];
  const fillerWords = ['sheet', 'plate', 'pipe', 'rod', 'bar', 'in', 'for', 'of', 'the', 'and', 'or'];
  const filteredWords = uniqueWords.filter(word => !fillerWords.includes(word));
  
  return filteredWords.join(' ').trim();
}

// Helper: Extract number from option (ADD THIS AT TOP LEVEL)
function extractNumber(option: string): number | null {
  const match = option.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

// Helper: Find common options between Stage 1 and Stage 2 with range handling
function findCommonOptions(stage1Options: string[], stage2Options: string[]): string[] {
  const common: string[] = [];
  const seen = new Set<string>();
  
  // Helper: Check if option is a range
  const isRange = (option: string): boolean => {
    return /(?:\d+(?:\.\d+)?\s*(?:to|-|–)\s*\d+(?:\.\d+)?)/i.test(option);
  };
  
  // Helper: Parse range and get all numbers with 0.1 step
  const parseRange = (range: string): number[] => {
    const numbers: number[] = [];
    const match = range.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)/i);
    
    if (match) {
      const start = parseFloat(match[1]);
      const end = parseFloat(match[2]);
      const step = 0.1;
      let current = Math.ceil(start * 10) / 10;
      
      while (current <= end) {
        numbers.push(Math.round(current * 10) / 10);
        current += step;
      }
    }
    
    return numbers;
  };
  
  // Helper: Extract SS grade from option (e.g., "304" from "SS 304L")
  const extractSSGrade = (option: string): { number: string; suffix: string } | null => {
    const clean = option.toLowerCase();
    // Match patterns: 304, 304L, 316, 316L
    const match = clean.match(/(\d{3})([a-z])?/);
    if (match) {
      return {
        number: match[1],
        suffix: match[2] || ''
      };
    }
    return null;
  };
  
  // Helper: Check if two options are similar (considering SS grades)
  const areOptionsSimilarForCommon = (opt1: string, opt2: string): boolean => {
    const clean1 = opt1.toLowerCase();
    const clean2 = opt2.toLowerCase();
    
    // Exact match
    if (clean1 === clean2) return true;
    
    // Remove spaces
    if (clean1.replace(/\s+/g, '') === clean2.replace(/\s+/g, '')) return true;
    
    // Check SS grades
    const grade1 = extractSSGrade(clean1);
    const grade2 = extractSSGrade(clean2);
    
    if (grade1 && grade2) {
      // SS 304 vs 304 should match (same number, ignore prefix)
      if (grade1.number === grade2.number) {
        // But 304 vs 304L should NOT match (different suffix)
        if (grade1.suffix !== grade2.suffix) {
          return false;
        }
        return true;
      }
      return false;
    }
    
    return false;
  };
  
  // First pass: Exact matches
  stage1Options.forEach(opt1 => {
    const cleanOpt1 = opt1.toLowerCase();
    
    const exactMatch = stage2Options.find(opt2 => 
      opt2.toLowerCase() === cleanOpt1
    );
    
    if (exactMatch && !seen.has(cleanOpt1)) {
      common.push(opt1);
      seen.add(cleanOpt1);
    }
  });
  
  // Second pass: Similar matches (including SS 304 vs 304)
  if (common.length < 8) {
    stage1Options.forEach(opt1 => {
      if (common.length >= 8) return;
      
      const cleanOpt1 = opt1.toLowerCase();
      if (seen.has(cleanOpt1)) return;
      
      stage2Options.forEach(opt2 => {
        if (common.length >= 8) return;
        
        if (areOptionsSimilarForCommon(opt1, opt2) && !seen.has(cleanOpt1)) {
          common.push(opt1);
          seen.add(cleanOpt1);
        }
      });
    });
  }
  
  // Third pass: Range vs Discrete matching
  if (common.length < 8) {
    // Check discrete options in Stage 2 that are in Stage 1 ranges
    stage2Options.forEach(opt2 => {
      if (common.length >= 8) return;
      
      const cleanOpt2 = opt2.toLowerCase();
      if (seen.has(cleanOpt2)) return;
      if (isRange(opt2)) return; // Skip ranges
      
      const extractNumber = (opt: string): number | null => {
        const match = opt.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : null;
      };
      
      const num2 = extractNumber(opt2);
      if (num2 === null) return;
      
      stage1Options.forEach(opt1 => {
        if (common.length >= 8) return;
        
        if (isRange(opt1)) {
          const rangeNumbers = parseRange(opt1);
          const isInRange = rangeNumbers.some(rangeNum => 
            Math.abs(rangeNum - num2) < 0.01
          );
          
          if (isInRange && !seen.has(cleanOpt2)) {
            common.push(opt2);
            seen.add(cleanOpt2);
          }
        }
      });
    });
    
    // Check discrete options in Stage 1 that are in Stage 2 ranges
    if (common.length < 8) {
      stage1Options.forEach(opt1 => {
        if (common.length >= 8) return;
        
        const cleanOpt1 = opt1.toLowerCase();
        if (seen.has(cleanOpt1)) return;
        if (isRange(opt1)) return;
        
        const num1 = extractNumber(opt1);
        if (num1 === null) return;
        
        stage2Options.forEach(opt2 => {
          if (common.length >= 8) return;
          
          if (isRange(opt2)) {
            const rangeNumbers = parseRange(opt2);
            const isInRange = rangeNumbers.some(rangeNum => 
              Math.abs(rangeNum - num1) < 0.01
            );
            
            if (isInRange && !seen.has(cleanOpt1)) {
              common.push(opt1);
              seen.add(cleanOpt1);
            }
          }
        });
      });
    }
  }
  
  return common.slice(0, 8);
}

// Helper: Check if options are similar (for Buyer ISQs)
function areOptionsSimilar(opt1: string, opt2: string): boolean {
  if (!opt1 || !opt2) return false;
  
  const clean1 = opt1.trim().toLowerCase();
  const clean2 = opt2.trim().toLowerCase();
  
  // Exact match
  if (clean1 === clean2) return true;
  
  // Remove spaces and compare
  if (clean1.replace(/\s+/g, '') === clean2.replace(/\s+/g, '')) return true;
  
  // Extract SS grade for comparison
  const extractGrade = (text: string): string | null => {
    const match = text.match(/(\d{3}[a-z]?)/);
    return match ? match[1] : null;
  };
  
  const grade1 = extractGrade(clean1);
  const grade2 = extractGrade(clean2);
  
  if (grade1 && grade2) {
    // SS grades must be exact same
    return grade1 === grade2;
  }
  
  // For numbers, check exact value
  const extractNumber = (text: string): number | null => {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };
  
  const num1 = extractNumber(clean1);
  const num2 = extractNumber(clean2);
  
  if (num1 !== null && num2 !== null) {
    // Check if numbers are same (with tolerance)
    return Math.abs(num1 - num2) < 0.01;
  }
  
  return false;
}

// Helper: Convert to millimeters (for measurement comparison)
function convertToMM(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m|inch|in|ft|feet|")?/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase() || '';
  
  switch (unit) {
    case 'mm': return value;
    case 'cm': return value * 10;
    case 'm': return value * 1000;
    case 'inch':
    case 'in':
    case '"': return value * 25.4;
    case 'ft':
    case 'feet': return value * 304.8;
    default: 
      if (value < 100) return value;
      return value;
  }
}

// Helper: Select top 2 specs for Buyer ISQs
function selectBuyerISQs(
  commonSpecs: CommonSpecItem[], 
  stage1AllSpecs: Array<{ spec_name: string; options: string[]; input_type: string; tier: 'Primary' | 'Secondary'; priority: number }>
): BuyerISQItem[] {
  if (commonSpecs.length === 0) return [];
  
  const topSpecs = commonSpecs.slice(0, 2);
  
  return topSpecs.map(spec => {
    const resultOptions: string[] = [...spec.options];
    const seenOptions = new Set<string>();
    
    // Mark all common options as seen
    spec.options.forEach(opt => {
      if (opt && opt.trim()) {
        seenOptions.add(opt.trim().toLowerCase());
      }
    });
    
    // Add Stage 1 options if needed
    if (resultOptions.length < 8) {
      const stage1Spec = stage1AllSpecs.find(s => 
        s.spec_name === spec.spec_name || 
        areSpecsSimilar(s.spec_name, spec.spec_name)
      );
      
      if (stage1Spec && stage1Spec.options) {
        stage1Spec.options.forEach(option => {
          if (option && option.trim() && resultOptions.length < 8) {
            const cleanOption = option.trim();
            const cleanOptionLower = cleanOption.toLowerCase();
            
            if (cleanOptionLower === "other") return;
            if (seenOptions.has(cleanOptionLower)) return;
            
            resultOptions.push(cleanOption);
            seenOptions.add(cleanOptionLower);
          }
        });
      }
    }
    
    const finalOptions = resultOptions.slice(0, 8);
    
    return {
      spec_name: spec.spec_name,
      options: finalOptions,
      category: spec.category
    };
  });
}