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
// MAIN FUNCTION - PURANA LOGIC WAPAS
// ============================================

function extractCommonAndBuyerSpecs(
  stage1: Stage1Output,
  isqs: { config: ISQ; keys: ISQ[]; buyers: ISQ[] }
): { commonSpecs: CommonSpecItem[]; buyerISQs: BuyerISQItem[] } {
  console.log('🚀 Stage3: Starting extraction with old logic...');
  
  // STEP 1: Get ALL Stage 1 specs (from seller_specs ONLY)
  const stage1AllSpecs = extractAllStage1Specs(stage1);
  console.log('📊 Stage 1 specs:', stage1AllSpecs.length, stage1AllSpecs);
  
  // STEP 2: Get ALL Stage 2 ISQs
  const stage2AllISQs = extractAllStage2ISQs(isqs);
  console.log('📊 Stage 2 ISQs:', stage2AllISQs.length, stage2AllISQs);
  
  // STEP 3: Find common specs using SEMANTIC MATCHING
  const commonSpecs = findCommonSpecs(stage1AllSpecs, stage2AllISQs);
  console.log('🎯 Found common specs:', commonSpecs.length);
  
  // STEP 4: Select Buyer ISQs (top 2 by priority) - PASS stage1AllSpecs
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
      // Primary specs
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
      
      // Secondary specs
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
      
      // Tertiary specs (if exists, treat as Secondary)
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
  
  // Config ISQ - highest priority
  if (isqs.config && isqs.config.name && isqs.config.options?.length > 0) {
    isqList.push({
      name: isqs.config.name,
      options: isqs.config.options,
      priority: 3
    });
  }
  
  // Key ISQs - medium priority
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
  
  // Buyer ISQs - lowest priority
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
  
  // For each Stage 1 spec
  stage1Specs.forEach(stage1Spec => {
    let bestMatchIndex = -1;
    let bestMatchPriority = 0;
    let bestMatchOptions: string[] = [];
    
    // Find best matching Stage 2 ISQ
    stage2ISQs.forEach((stage2ISQ, index) => {
      if (matchedStage2Indices.has(index)) return;
      
      // Check if specs are similar
      if (areSpecsSimilar(stage1Spec.spec_name, stage2ISQ.name)) {
        const combinedPriority = stage1Spec.priority + stage2ISQ.priority;
        
        if (combinedPriority > bestMatchPriority) {
          bestMatchIndex = index;
          bestMatchPriority = combinedPriority;
          bestMatchOptions = stage2ISQ.options;
        }
      }
    });
    
    // If found a match
    if (bestMatchIndex !== -1) {
      matchedStage2Indices.add(bestMatchIndex);
      
      // Find common options
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
  
  // Remove duplicates (same spec name)
  const uniqueSpecs = commonSpecs.filter((spec, index, self) => 
    index === self.findIndex(s => s.spec_name === spec.spec_name)
  );
  
  // Sort by priority (highest first)
  uniqueSpecs.sort((a, b) => b.priority - a.priority);
  
  return uniqueSpecs;
}

// Helper: Check if two specs are similar
function areSpecsSimilar(spec1: string, spec2: string): boolean {
  if (!spec1 || !spec2) return false;
  
  const norm1 = normalizeSpecName(spec1);
  const norm2 = normalizeSpecName(spec2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Synonym groups (same as your api.ts)
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

// Helper: Normalize spec name (same as your api.ts)
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

// Helper: Find common options between Stage 1 and Stage 2
// Helper: Find common options between Stage 1 and Stage 2 with improved matching
function findCommonOptions(stage1Options: string[], stage2Options: string[]): string[] {
  const common: string[] = [];
  const seenStage2Indices = new Set<number>();
  const seenOptions = new Set<string>();
  
  // First pass: Exact matches (case-insensitive)
  stage1Options.forEach(opt1 => {
    const cleanOpt1 = opt1.trim().toLowerCase();
    
    // Find exact match in Stage 2
    stage2Options.forEach((opt2, j) => {
      if (seenStage2Indices.has(j)) return;
      
      const cleanOpt2 = opt2.trim().toLowerCase();
      
      // Exact string match
      if (cleanOpt1 === cleanOpt2 && !seenOptions.has(cleanOpt1)) {
        common.push(opt1); // Keep original formatting from Stage 1
        seenStage2Indices.add(j);
        seenOptions.add(cleanOpt1);
      }
    });
  });
  
  // Second pass: Smart similarity matches (with decimal handling)
  if (common.length < 8) {
    stage1Options.forEach(opt1 => {
      if (common.length >= 8) return;
      
      const cleanOpt1 = opt1.trim().toLowerCase();
      if (seenOptions.has(cleanOpt1)) return;
      
      stage2Options.forEach((opt2, j) => {
        if (common.length >= 8) return;
        if (seenStage2Indices.has(j)) return;
        
        const cleanOpt2 = opt2.trim().toLowerCase();
        
        // Use SMART matching with decimal handling
        if (areOptionsSmartSimilar(opt1, opt2) && !seenOptions.has(cleanOpt1)) {
          common.push(opt1);
          seenStage2Indices.add(j);
          seenOptions.add(cleanOpt1);
        }
      });
    });
  }
  
  return common
}

// Helper: Check if options are similar
// Helper: SMART similarity check for options (handles decimals, SS grades, etc.)
function areOptionsSmartSimilar(opt1: string, opt2: string): boolean {
  if (!opt1 || !opt2) return false;
  
  const clean1 = opt1.trim().toLowerCase();
  const clean2 = opt2.trim().toLowerCase();
  
  // 1. Exact match (already handled)
  if (clean1 === clean2) return true;
  
  // 2. Remove spaces and compare
  const noSpace1 = clean1.replace(/\s+/g, '');
  const noSpace2 = clean2.replace(/\s+/g, '');
  if (noSpace1 === noSpace2) return true;
  
  // 3. Handle SS grades and numbers like 430
  // Extract numeric parts with suffixes
  const extractNumberWithSuffix = (text: string) => {
    const match = text.match(/(\d+(?:\.\d+)?)([a-z]*)/i);
    if (match) {
      return {
        number: parseFloat(match[1]),
        suffix: match[2] || '',
        original: match[1] + match[2]
      };
    }
    return null;
  };
  
  const num1 = extractNumberWithSuffix(clean1);
  const num2 = extractNumberWithSuffix(clean2);
  
  if (num1 && num2) {
    // Check if numbers are equal (considering decimal precision)
    const num1Str = num1.number.toString();
    const num2Str = num2.number.toString();
    
    // Normalize decimals: 1.0 becomes 1, 1.00 becomes 1
    const normalizeDecimal = (num: number) => {
      if (num % 1 === 0) return Math.floor(num);
      return num;
    };
    
    const normNum1 = normalizeDecimal(num1.number);
    const normNum2 = normalizeDecimal(num2.number);
    
    // Check if numbers are same (1.0 == 1)
    if (normNum1 === normNum2) {
      // Check suffixes
      if (num1.suffix === num2.suffix) {
        return true; // Same number and suffix
      }
      
      // For SS grades: 316 and 316L are different
      // But "SS 430" and "430" should match
      const isSSGrade1 = clean1.includes('ss') || clean1.includes('stainless') || num1.suffix;
      const isSSGrade2 = clean2.includes('ss') || clean2.includes('stainless') || num2.suffix;
      
      // If both have no suffix or only one has "ss" prefix
      if ((!num1.suffix && !num2.suffix) || 
          (clean1.includes('430') && clean2.includes('430')) ||
          (clean1.includes('304') && clean2.includes('304')) ||
          (clean1.includes('316') && clean2.includes('316'))) {
        // Allow match for same base number
        return true;
      }
    }
  }
  
  // 4. Handle measurements with decimals (1.0mm vs 1mm vs 10mm)
  const extractMeasurement = (text: string) => {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m|inch|in|ft|")?/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2]?.toLowerCase() || '';
      
      // Convert to mm for comparison
      let mmValue = value;
      switch (unit) {
        case 'cm': mmValue = value * 10; break;
        case 'm': mmValue = value * 1000; break;
        case 'inch':
        case 'in':
        case '"': mmValue = value * 25.4; break;
        case 'ft': mmValue = value * 304.8; break;
      }
      
      return {
        value: value,
        mmValue: mmValue,
        unit: unit,
        original: match[1] + (unit || '')
      };
    }
    return null;
  };
  
  const meas1 = extractMeasurement(clean1);
  const meas2 = extractMeasurement(clean2);
  
  if (meas1 && meas2) {
    // Check if same measurement in mm
    const diff = Math.abs(meas1.mmValue - meas2.mmValue);
    if (diff < 0.01) { // 0.01mm tolerance
      return true;
    }
    
    // Check if values are same (1.0 vs 1)
    const normValue1 = meas1.value % 1 === 0 ? Math.floor(meas1.value) : meas1.value;
    const normValue2 = meas2.value % 1 === 0 ? Math.floor(meas2.value) : meas2.value;
    
    // But 1.0mm and 10mm should NOT match
    if (Math.abs(normValue1 - normValue2) > 0.1) {
      return false;
    }
    
    // If units are different, convert and compare
    if (meas1.unit && meas2.unit && meas1.unit !== meas2.unit) {
      // Already compared in mmValue above
      return diff < 0.01;
    }
  }
  
  // 5. String contains check with context awareness
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    // But check for problematic cases:
    // - "SS 316" contains "316" - should match
    // - "1.0mm" contains "1mm" - should match (1.0 == 1)
    // - "10mm" contains "1mm" - should NOT match (10 != 1)
    
    const containsNumber1 = clean1.match(/\d+(?:\.\d+)?/);
    const containsNumber2 = clean2.match(/\d+(?:\.\d+)?/);
    
    if (containsNumber1 && containsNumber2) {
      const num1 = parseFloat(containsNumber1[0]);
      const num2 = parseFloat(containsNumber2[0]);
      
      // Normalize decimals
      const normNum1 = num1 % 1 === 0 ? Math.floor(num1) : num1;
      const normNum2 = num2 % 1 === 0 ? Math.floor(num2) : num2;
      
      // If numbers are different (10 vs 1), don't match
      if (Math.abs(normNum1 - normNum2) > 0.1) {
        return false;
      }
    }
    
    return true;
  }
  
  return false;
}

// Helper: Check if options are similar (updated for decimals)
function areOptionsSimilar(opt1: string, opt2: string): boolean {
  if (!opt1 || !opt2) return false;
  
  const clean1 = opt1.trim().toLowerCase();
  const clean2 = opt2.trim().toLowerCase();
  
  // Exact match
  if (clean1 === clean2) return true;
  
  // Remove spaces
  if (clean1.replace(/\s+/g, '') === clean2.replace(/\s+/g, '')) return true;
  
  // Use the new smart similarity function
  return areOptionsSmartSimilar(opt1, opt2);
}
// Helper: Convert to millimeters
function convertToMM(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m|inch|in|ft|")?/);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || '';
  
  switch (unit) {
    case 'mm': return value;
    case 'cm': return value * 10;
    case 'm': return value * 1000;
    case 'inch':
    case 'in':
    case '"': return value * 25.4;
    case 'ft': return value * 304.8;
    default: return value < 100 ? value : value * 25.4; // Guess
  }
}

// Helper: Select top 2 specs for Buyer ISQs with improved option selection
function selectBuyerISQs(
  commonSpecs: CommonSpecItem[], 
  stage1AllSpecs: Array<{ spec_name: string; options: string[]; input_type: string; tier: 'Primary' | 'Secondary'; priority: number }>
): BuyerISQItem[] {
  if (commonSpecs.length === 0) return [];
  
  // Take top 2 specs by priority
  const topSpecs = commonSpecs.slice(0, 2);
  
  return topSpecs.map(spec => {
    const allOptions = new Set<string>();
    
    // Step 1: Add common options first (priority 1 - exact matches)
    spec.options.forEach(option => {
  if (option && option.trim() && option.toLowerCase() !== "other") { 
    const cleanOption = option.trim();
    // Check if already exists
    const exists = Array.from(allOptions).some(existing => 
      areOptionsSimilar(existing, cleanOption)
    );
    if (!exists) {
      allOptions.add(cleanOption);
    }
  }
});
    
    // Step 2: If we don't have 8 options yet, add Stage 1 options
    if (allOptions.size < 8) {
      // Find the original Stage 1 spec for this spec_name
      const stage1Spec = stage1AllSpecs.find(s => 
        s.spec_name === spec.spec_name || 
        areSpecsSimilar(s.spec_name, spec.spec_name)
      );
      
      if (stage1Spec && stage1Spec.options) {
        // Add Stage 1 options that are not already in the set
        stage1Spec.options.forEach(option => {
          if (option && option.trim() && allOptions.size < 8) {
            const cleanOption = option.trim();

             if (cleanOption.toLowerCase() === "other") {
               return;
             }
            
            // Check for duplicates (case-insensitive and semantic similarity)
            const isDuplicate = Array.from(allOptions).some(existingOption => 
              areOptionsSimilar(cleanOption, existingOption)
            );
            
            if (!isDuplicate) {
              allOptions.add(cleanOption);
            }
          }
        });
      }
    }
    
    // Step 3: Convert Set to array and ensure max 8 options
    const finalOptions = Array.from(allOptions).slice(0, 8);
    
    return {
      spec_name: spec.spec_name,
      options: finalOptions,
      category: spec.category
    };
  });
}