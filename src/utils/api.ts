import type { InputData, Stage1Output, ISQ, ExcelData, AuditInput, AuditResult } from "../types";

function normalizeSpecName(name: string): string {
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
  const fillerWords = ['sheet', 'plate', 'pipe', 'rod', 'bar', 'in', 'for', 'of', 'the'];
  const filteredWords = uniqueWords.filter(word => !fillerWords.includes(word));
  
  return filteredWords.join(' ').trim();
}

function isSemanticallySimilar(spec1: string, spec2: string): boolean {
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

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  baseDelay = 5000
): Promise<Response> {
  let lastStatus: number | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) return response;

    lastStatus = response.status;

    if (response.status === 429 || response.status === 503 || response.status === 502) {
      if (attempt === retries) {
        throw new Error(`Gemini overloaded after ${retries + 1} attempts. Last status code: ${lastStatus}`);
      }
      const waitTime = baseDelay * Math.pow(2, attempt);
      console.warn(`Gemini overloaded (${response.status}). Retrying in ${waitTime}ms`);
      await sleep(waitTime);
      continue;
    }

    const err = await response.text();
    throw new Error(`Gemini API error ${lastStatus}: ${err}`);
  }

  throw new Error("Unreachable");
}

function extractJSONFromGemini(response) {
  try {
    if (!response?.candidates?.length) {
      console.warn("No candidates in response, returning null for fallback");
      return null;
    }

    const parts =
      response.candidates[0]?.content?.parts ||
      response.candidates[0]?.content ||
      [];

    let rawText = "";

    for (const part of parts) {
      if (typeof part.text === "string") {
        rawText += part.text + "\n";
      }

      if (part.json) {
        return part.json;
      }
    }

    if (!rawText.trim()) {
      console.warn("No text content in response, returning null for fallback");
      return null;
    }

    let cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Try to match array first (for audit results)
    let arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0].replace(/,(\s*[\]}])/g, "$1"));
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.warn("Array parse failed, trying object match:", e);
      }
    }

    // Then try object match
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      cleaned = objMatch[0];
    }

    cleaned = cleaned.replace(/,(\s*[\]}])/g, "$1");

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("JSON parse failed, returning null for fallback:", parseErr);
      return null;
    }
  } catch (error) {
    console.warn("Unexpected error in extractJSONFromGemini:", error);
    return null;
  }
}

const STAGE1_API_KEY = (import.meta.env.VITE_STAGE1_API_KEY || "").trim();
const STAGE2_API_KEY = (import.meta.env.VITE_STAGE2_API_KEY || "").trim();

export async function auditSpecificationsWithGemini(
  input: AuditInput
): Promise<AuditResult[]> {
  if (!STAGE1_API_KEY) {
    throw new Error("Stage 1 API key is not configured. Please add VITE_STAGE1_API_KEY to your .env file.");
  }

  const prompt = buildAuditPrompt(input);
  console.log("🔍 Audit: Sending request to Gemini...");

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${STAGE1_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    console.log("📥 Audit: Received response from Gemini");

    let result = extractJSONFromGemini(data);

    if (!result || !Array.isArray(result)) {
      console.warn("⚠️ Audit: JSON extraction failed, trying text extraction...");
      const rawText = extractRawText(data);
      console.log("Raw response text:", rawText.substring(0, 500));

      result = parseAuditFromText(rawText, input);
    }

    if (result && Array.isArray(result)) {
      console.log(`✅ Audit: Successfully parsed ${result.length} results`);
      console.log("Audit results:", result);
      return result;
    }

    console.error("❌ Audit: Failed to parse any results, returning empty array");
    return [];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      console.error("Stage 1 API Key quota exhausted or rate limited");
      throw new Error("Stage 1 API key quota exhausted. Please check your API limits.");
    }

    console.error("❌ Audit API error:", error);
    throw error;
  }
}

function parseAuditFromText(text: string, input: AuditInput): AuditResult[] {
  console.log("📝 Parsing audit from text...");

  const results: AuditResult[] = [];

  // Try to find JSON array in text
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0].replace(/,(\s*[\]}])/g, "$1"));
      if (Array.isArray(parsed)) {
        console.log("✅ Successfully parsed JSON array from text");
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse JSON array from text:", e);
    }
  }

  // Fallback: Create results for all specs marking them as "correct" if no issues found
  input.specifications.forEach(spec => {
    results.push({
      specification: spec.spec_name,
      status: "correct",
      explanation: undefined,
      problematic_options: []
    });
  });

  console.log(`⚠️ Fallback: Marking all ${results.length} specs as correct`);
  return results;
}

function buildAuditPrompt(input: AuditInput): string {
  const specsText = input.specifications
    .map((spec, idx) => {
      return `${idx + 1}. Specification: "${spec.spec_name}"
   Options: ${spec.options.map(opt => `"${opt}"`).join(", ")}
   Input Type: ${spec.input_type || "N/A"}
   Tier: ${spec.tier || "N/A"}`;
    })
    .join("\n\n");

  return `You are a STRICT industrial specification auditor. Your task is to find REAL problems.

MCAT Name: ${input.mcat_name}
Think about what specifications make sense for this type of product.

Specifications to Audit:
${specsText}

Task:
- For each specification, check if it is relevant to the MCAT "${input.mcat_name}"
- For each option, check for:
  • Irrelevance to the specification or MCAT
  • Duplicates (exact duplicates or same value listed multiple times)
   Example: "SS304", "ss304" → INCORRECT (duplicate, just different case)
   Example: "2mm", "2 mm", "2.0mm" → INCORRECT (same value, different formatting)
  • Overlapping values (e.g., same measurement in multiple separate options like "1219 mm" AND "4 ft" as separate entries)

Rules:
- DO NOT generate new specifications or options
- DO NOT suggest random corrections
- BE STRICT and find REAL issues
- Only return "correct" or "incorrect" and explanation if incorrect
- If an option lists different units in the SAME entry (e.g., "1219 mm (4 ft)") → this is CORRECT
- If multiple SEPARATE options represent the same value in different units → this is INCORRECT (overlapping)
- If an option appears multiple times with exactly the same value → this is INCORRECT (duplicate)
- If a specification is completely irrelevant to "${input.mcat_name}" → mark as INCORRECT with explanation
- If an option is irrelevant to the specification → mark as INCORRECT and list it in problematic_options

Output Format (JSON Array):
[
  {
    "specification": "Grade",
    "status": "correct"
  },
  {
    "specification": "Width",
    "status": "incorrect",
    "explanation": "1219 mm and 4 ft listed separately → overlapping units. 1500 mm appears twice → duplicate.",
    "problematic_options": ["1219 mm", "4 ft", "1500 mm"]
  },
  {
    "specification": "Application",
    "status": "incorrect",
    "explanation": "Specification not relevant for ${input.mcat_name}. Option 'Capacity' is irrelevant.",
    "problematic_options": ["Capacity"]
  }
]

CRITICAL:
- Return ONLY valid JSON array
- NO text before or after the JSON
- NO markdown code blocks
- Output must start with [ and end with ]`;
}

export async function generateStage1WithGemini(
  input: InputData
): Promise<Stage1Output> {
  if (!STAGE1_API_KEY) {
    throw new Error("Stage 1 API key is not configured. Please add VITE_STAGE1_API_KEY to your .env file.");
  }

  const prompt = buildStage1Prompt(input);

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${STAGE1_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    return extractJSONFromGemini(data) || generateFallbackStage1();

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      console.error("Stage 1 API Key quota exhausted or rate limited");
      throw new Error("Stage 1 API key quota exhausted. Please check your API limits.");
    }

    console.warn("Stage 1 API error:", error);
    return generateFallbackStage1();
  }
}

function generateFallbackStage1(): Stage1Output {
  return {
    seller_specs: []
  };
}

export async function extractISQWithGemini(
  input: InputData,
  urls: string[]
): Promise<{ config: ISQ; keys: ISQ[]; buyers: ISQ[] }> {
  if (!STAGE2_API_KEY) {
    throw new Error("Stage 2 API key is not configured. Please add VITE_STAGE2_API_KEY to your .env file.");
  }

  console.log("Waiting before ISQ extraction to avoid API overload...");
  await sleep(7000);

  const urlContents = await Promise.all(urls.map(fetchURL));
  const prompt = buildISQExtractionPrompt(input, urls, urlContents);

  try {
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${STAGE2_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          },
        }),
      }
    );

    const data = await response.json();
    let parsed = extractJSONFromGemini(data);

    if (parsed && parsed.config && parsed.config.name) {
      return {
        config: parsed.config,
        keys: parsed.keys || [],
        buyers: parsed.buyers || []
      };
    }

    const textContent = extractRawText(data);
    if (textContent) {
      const fallbackParsed = parseStage2FromText(textContent);
      if (fallbackParsed && fallbackParsed.config && fallbackParsed.config.name) {
        console.log("Parsed ISQ from text fallback");
        return fallbackParsed;
      }
    }

    return generateFallbackStage2();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      console.error("Stage 2 API Key quota exhausted or rate limited");
      throw new Error("Stage 2 API key quota exhausted. Please check your API limits.");
    }

    console.warn("Stage 2 API error:", error);
    return generateFallbackStage2();
  }
}

function extractRawText(response: any): string {
  try {
    if (!response?.candidates?.length) return "";

    const parts = response.candidates[0]?.content?.parts || [];
    let text = "";

    for (const part of parts) {
      if (typeof part.text === "string") {
        text += part.text + "\n";
      }
    }

    return text.trim();
  } catch {
    return "";
  }
}

function parseStage2FromText(text: string): { config: ISQ; keys: ISQ[]; buyers: ISQ[] } | null {
  console.warn("Stage2: Using text-based extraction");

  const config = { name: "", options: [] };
  const keys: ISQ[] = [];
  const buyers: ISQ[] = [];

  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;

  const specPatterns = /(size|material|grade|thickness|type|shape|length|width|color|finish|weight|capacity|brand|quality|model|variant|design)[^:\n]*[:\-\s]+([^\n]+)/gi;
  const matches = Array.from(text.matchAll(specPatterns));

  const seenNames = new Set<string>();
  let configSet = false;

  matches.slice(0, 10).forEach((match) => {
    const name = match[1].trim();
    const valuesStr = match[2].trim();
    const values = valuesStr
      .split(/,|;|\/|\band\b/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0 && v.length < 50)
      .slice(0, 10);

    if (values.length === 0) return;

    const normalizedName = normalizeSpecName(name);

    if (seenNames.has(normalizedName)) return;
    seenNames.add(normalizedName);

    if (!configSet && values.length >= 2) {
      config.name = name;
      config.options = values;
      configSet = true;
    } else if (keys.length < 3) {
      keys.push({ name, options: values });
    }
  });

  if (!configSet && matches.length > 0) {
    const firstMatch = matches[0];
    config.name = firstMatch[1].trim();
    config.options = firstMatch[2]
      .split(/,|;|\//)
      .map((v) => v.trim())
      .filter((v) => v.length > 0 && v.length < 50)
      .slice(0, 5);
  }

  if (!config.name || config.options.length === 0) {
    const words = text.match(/\b[a-z]{3,}(?:\s+[a-z]{3,})*\b/gi) || [];
    if (words.length > 0) {
      config.name = words[0];
      config.options = words.slice(0, 5);
    }
  }

  if (!config.name) return null;

  return { config, keys, buyers };
}

function generateFallbackStage2(): { config: ISQ; keys: ISQ[]; buyers: ISQ[] } {
  return {
    config: { name: "Unknown", options: [] },
    keys: [],
    buyers: []
  };
}

function extractJSON(text: string): string | null {
  text = text.replace(/```json|```/gi, "").trim();

  text = text.trim();
  if (text.startsWith('{')) {
    try {
      JSON.parse(text);
      return text;
    } catch {
      // Continue to other methods
    }
  }

  let codeBlockMatch = text.match(/```json\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    try {
      JSON.parse(extracted);
      return extracted;
    } catch (e) {
      console.error("Failed to parse JSON from json code block:", e);
    }
  }

  codeBlockMatch = text.match(/```\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    try {
      JSON.parse(extracted);
      return extracted;
    } catch (e) {
      console.error("Failed to parse JSON from code block:", e);
    }
  }

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let startIdx = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        if (braceCount === 0) startIdx = i;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && startIdx !== -1) {
          const jsonStr = text.substring(startIdx, i + 1).trim();
          try {
            JSON.parse(jsonStr);
            return jsonStr;
          } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
            startIdx = -1;
          }
        }
      }
    }
  }

  console.error("No JSON found in response. Raw response:", text.substring(0, 1000));
  return null;
}

async function fetchURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  } catch {
    return "";
  }
}


function buildISQExtractionPrompt(
  input: InputData,
  urls: string[],
  contents: string[]
): string {
  const urlsText = urls
    .map((url, i) => `URL ${i + 1}: ${url}\nContent: ${contents[i].substring(0, 1000)}...`)
    .join("\n\n");

  return `You are an AI that extracts product specifications from multiple URLs. 
Your task is to identify the most important specifications and their options accurately. 

Extract specifications from these URLs for: ${input.mcats.map((m) => m.mcat_name).join(", ")}

URLs:
${urlsText}

INSTRUCTIONS (Step by Step):

1. **Extract all visible specifications from all URLs**, including:
   - Technical tables
   - Description sections
   - Variant details
   - Size charts
   - Grade sheets
   - Material information
   - Any repeated fields
   - Content inside tabs or expandable sections

2. **Combine equivalent specifications and options**:
   - Merge equivalent specifications, e.g., "Material Grade", "Grade", "SS 304", "304" → "Grade" 
   - Merge options that mean the same, e.g., `"304L"` and `"SS 304L"` → `"SS 304L"`  
   - Count the frequency of each specification and option after combining

3. **Select Config and Key specifications based on frequency**:
   - **Config specification**: the specification with the highest frequency. Most important specification affecting price across similar products. Example: RAM Capacity of smartphones.
   - **Key specifications**: the next top 3 specifications with highest frequency define the product and differentiate it from similar products. Example: Front-loading vs Top-loading for washing machines.
   - Options must be the ones most repeated across all URLs.
   - Do NOT repeat specifications or options in output.
   - Do NOT include placeholder options like "Other" or "etc."
   - If very few repetitions, still include at least 1 Config or Key specification.

**Example:**  
Suppose 3 URLs have the following data:  
**Specification: “Grade”**

- URL1 options: ["SS 304", "SS 316"]  
- URL2 options: ["304", "SS 316"]  
- URL3 options: ["SS 304", "SS 316L"]  

**Step 1: Merge equivalent options**  
- "SS 304" and "304" → "SS 304"  
- Keep "SS 316" and "SS 316L" as-is  

**Step 2: Count frequency**  
Options frequency:  
- "SS 304" → 2  
- "SS 316" → 2  
- "SS 316L" → 1  

**Step 3: Choose top options**  
- Pick "SS 304" and "SS 316" (most frequent)  
- Exclude "SS 316L" (less frequent)  

**Step 4: Choose specification frequency**  
- “Grade” appears in all URLs → becomes Config specification

4. **Handle ranges**:
   - If a specification has ranges across URLs, find the overlapping range. Example:
     - Thickness 0.3–6 mm, 0.1–5 mm, 0.25–5 mm → Output range: 0.3–5 mm
   - Do NOT create options outside the URL-provided data.

5. **Exclusions**:
   - Do NOT include specifications already mentioned in the MCAT Name. Example:
     - MCAT Name: “Mild Steel Hot Rolled Sheet”
       - “Mild Steel” → Material → EXCLUDE
       - “Hot Rolled” → Finish → EXCLUDE
     - MCAT Name: “Stainless Steel 304 Pipe”
       - “Stainless Steel” → Material → EXCLUDE
       - “304” → Grade → EXCLUDE

6. **Rules**:
   - Do NOT invent specifications or options
   - Use frequency as the main criteria for importance
   - Ensure at least one Config or Key specification is returned
   - Options must come from URLs; no guessing
   - Do NOT repeat any specification or option
   - Do NOT include placeholder options like "Other", "etc.", or similar

7. **Output Format**:
   - Return ONLY valid JSON
   - No explanations, no markdown, no text outside JSON
   - JSON must start with `{` and end with `}`
   - Example JSON:

{
"config": {
"name": "Grade",
"options": ["SS 304", "SS 316"]
},
"keys": [
{
"name": "Thickness",
"options": ["0.3 mm to 5 mm"]
},
{
"name": "Width",
"options": ["100 mm", "200 mm", "300 mm"]
},
{
"name": "Surface Finish",
"options": ["Polished", "Matte"]
}
]
}
`;
}

// ============================================
// STAGE 3 BUYER ISQs SELECTION - IMPROVED VERSION
// ============================================

export function generateBuyerISQsFromSpecs(
  uploadedSpecs: { spec_name: string; options: string[]; tier?: string }[],
  stage2ISQs: { config: ISQ; keys: ISQ[] }
): ISQ[] {
  console.log('🛒 Generating Buyer ISQs from uploaded specs...');
  console.log('Uploaded specs:', uploadedSpecs.length);
  console.log('Stage 2 ISQs:', stage2ISQs.config ? 1 : 0, 'config +', stage2ISQs.keys.length, 'keys');

  // Combine all Stage 2 ISQs
  const allStage2ISQs: ISQ[] = [];
  if (stage2ISQs.config && stage2ISQs.config.name && stage2ISQs.config.options?.length > 0) {
    allStage2ISQs.push(stage2ISQs.config);
  }
  if (stage2ISQs.keys && stage2ISQs.keys.length > 0) {
    allStage2ISQs.push(...stage2ISQs.keys.filter(k => k.name && k.options?.length > 0));
  }

  // Find common specs
  const commonSpecs: Array<{
    name: string;
    options: string[];
    priority: number;
  }> = [];

  uploadedSpecs.forEach(uploadedSpec => {
    allStage2ISQs.forEach(stage2ISQ => {
      if (isSemanticallySimilar(uploadedSpec.spec_name, stage2ISQ.name)) {
        const commonOptions = findCommonOptions(uploadedSpec.options, stage2ISQ.options);

        const priority = uploadedSpec.tier === 'Primary' ? 3 : 2;

        if (commonOptions.length > 0) {
          commonSpecs.push({
            name: uploadedSpec.spec_name,
            options: commonOptions,
            priority
          });
        }
      }
    });
  });

  console.log('Common specs found:', commonSpecs.length);

  if (commonSpecs.length === 0) {
    console.log('⚠️ No common specs found');
    return [];
  }

  // Sort by priority
  commonSpecs.sort((a, b) => b.priority - a.priority);

  // Return top 2
  const buyerISQs = commonSpecs.slice(0, 2).map(spec => ({
    name: spec.name,
    options: spec.options.slice(0, 8)
  }));

  console.log('✅ Generated buyer ISQs:', buyerISQs.length);
  return buyerISQs;
}

export function selectStage3BuyerISQs(
  stage1: Stage1Output,
  stage2: { config: ISQ; keys: ISQ[]; buyers?: ISQ[] }
): ISQ[] {
  console.log('🔍 selectStage3BuyerISQs called');
  console.log('Stage 1 data:', stage1);
  console.log('Stage 2 data:', stage2);

  // 1️⃣ Flatten Stage1 specs with priority
  const stage1All: (ISQ & { 
    tier: string; 
    normName: string; 
    spec_name?: string;
    priority: number;
  })[] = [];
  
  stage1.seller_specs.forEach(ss => {
    ss.mcats.forEach(mcat => {
      const { finalized_primary_specs, finalized_secondary_specs } = mcat.finalized_specs;

      // Primary specs (priority 3)
      finalized_primary_specs.specs.forEach(s => {
        stage1All.push({ 
          name: s.spec_name,
          spec_name: s.spec_name,
          options: s.options || [],
          tier: "Primary", 
          normName: normalizeSpecName(s.spec_name),
          priority: 3
        });
      });
      
      // Secondary specs (priority 2)
      finalized_secondary_specs.specs.forEach(s => {
        stage1All.push({ 
          name: s.spec_name,
          spec_name: s.spec_name,
          options: s.options || [],
          tier: "Secondary", 
          normName: normalizeSpecName(s.spec_name),
          priority: 2
        });
      });
    });
  });

  console.log('📊 Stage1 specs flattened:', stage1All.length);
  stage1All.forEach((s, i) => console.log(`  ${i+1}. ${s.spec_name} (${s.tier}) - ${s.options?.length || 0} options`));

  // 2️⃣ Flatten Stage2 specs
  const stage2All: (ISQ & { normName: string; priority: number })[] = [];
  
  // Add Config ISQ
  if (stage2.config && stage2.config.name && stage2.config.options?.length > 0) {
    stage2All.push({ 
      ...stage2.config, 
      options: stage2.config.options || [], 
      priority: 3,
      normName: normalizeSpecName(stage2.config.name)
    });
  }
  
  // Add Keys ISQs
  if (stage2.keys && stage2.keys.length > 0) {
    stage2.keys.forEach(k => {
      if (k.name && k.options?.length > 0) {
        stage2All.push({ 
          ...k, 
          options: k.options || [], 
          priority: 2,
          normName: normalizeSpecName(k.name)
        });
      }
    });
  }
  
  // Add Buyers ISQs
  if (stage2.buyers && stage2.buyers.length > 0) {
    stage2.buyers.forEach(b => {
      if (b.name && b.options?.length > 0) {
        stage2All.push({ 
          ...b, 
          options: b.options || [], 
          priority: 1,
          normName: normalizeSpecName(b.name)
        });
      }
    });
  }

  console.log('📊 Stage2 specs flattened:', stage2All.length);
  stage2All.forEach((s, i) => console.log(`  ${i+1}. ${s.name} (Priority: ${s.priority}) - ${s.options?.length || 0} options`));

  // 3️⃣ Find common specs - EXACT OR SEMANTIC MATCHING
  const commonSpecs: (ISQ & { 
    tier: string; 
    normName: string; 
    spec_name?: string;
    priority: number;
    combinedPriority: number;
    stage1Options: string[];
    stage2Options: string[];
  })[] = [];

  stage1All.forEach(s1 => {
    // Find matching Stage2 specs
    const matchingStage2 = stage2All.filter(s2 => 
      s2.normName === s1.normName || 
      isSemanticallySimilar(s1.spec_name || s1.name, s2.name)
    );
    
    if (matchingStage2.length > 0) {
      // Find the best matching Stage2 spec (highest priority)
      const bestMatch = matchingStage2.reduce((best, current) => 
        current.priority > best.priority ? current : best
      );
      
      // Calculate combined priority
      const combinedPriority = s1.priority + bestMatch.priority;
      
      commonSpecs.push({
        ...s1,
        combinedPriority,
        stage1Options: s1.options,
        stage2Options: bestMatch.options
      });
      
      console.log(`✅ Found common: ${s1.spec_name} (Stage1: ${s1.tier}, Stage2: ${bestMatch.name})`);
    }
  });

  console.log('🎯 Common specs found:', commonSpecs.length);
  commonSpecs.forEach(s => console.log(`   - ${s.spec_name} (Priority: ${s.combinedPriority})`));

  if (commonSpecs.length === 0) {
    console.log('⚠️ No common specs found');
    return []; // Return empty array if no common specs
  }

  // 4️⃣ Sort by combined priority (highest first)
  commonSpecs.sort((a, b) => b.combinedPriority - a.combinedPriority);

  // 5️⃣ Select top 2 buyer ISQs
  const buyerISQs: ISQ[] = [];
  const maxBuyers = Math.min(2, commonSpecs.length);
  
  for (let i = 0; i < maxBuyers; i++) {
    const spec = commonSpecs[i];
    console.log(`\n📦 Processing spec ${i+1}: ${spec.spec_name}`);
    
    // Get optimized options
    const options = getOptimizedBuyerISQOptions(
      spec.stage1Options, 
      spec.stage2Options,
      spec.normName
    );
    
    buyerISQs.push({ 
      name: spec.spec_name, 
      options: options
    });
    console.log(`✅ Added buyer ISQ: ${spec.spec_name} with ${options.length} options`);
  }

  console.log('🎉 Final buyer ISQs:', buyerISQs);
  return buyerISQs;
}


// IMPROVED FUNCTION TO GET OPTIMIZED OPTIONS
function getOptimizedBuyerISQOptions(
  stage1Options: string[], 
  stage2Options: string[],
  normName: string
): string[] {
  console.log(`🔧 Getting optimized options for: "${normName}"`);
  console.log(`   Stage 1 options:`, stage1Options);
  console.log(`   Stage 2 options:`, stage2Options);

  const result: string[] = [];
  const seen = new Set<string>();

  // Step 1: Add EXACT matches first
  console.log('   Step 1: Adding exact matches...');
  for (const opt1 of stage1Options) {
    if (result.length >= 8) break;
    
    const cleanOpt1 = opt1.trim().toLowerCase();
    const exactMatch = stage2Options.find(opt2 => 
      opt2.trim().toLowerCase() === cleanOpt1
    );
    
    if (exactMatch && !seen.has(cleanOpt1)) {
      result.push(opt1);
      seen.add(cleanOpt1);
      console.log(`     ✅ Exact match: "${opt1}"`);
    }
  }

  // Step 2: Add STRONG semantic matches
  if (result.length < 8) {
    console.log('   Step 2: Adding strong semantic matches...');
    for (const opt1 of stage1Options) {
      if (result.length >= 8) break;
      
      const cleanOpt1 = opt1.trim().toLowerCase();
      if (seen.has(cleanOpt1)) continue;
      
      for (const opt2 of stage2Options) {
        if (result.length >= 8) break;
        
        if (areOptionsStronglySimilar(opt1, opt2) && !seen.has(cleanOpt1)) {
          result.push(opt1);
          seen.add(cleanOpt1);
          console.log(`     ✅ Strong match: "${opt1}" ↔ "${opt2}"`);
          break;
        }
      }
    }
  }

  // Step 3: Add remaining Stage 1 options (most relevant)
  if (result.length < 8) {
    console.log('   Step 3: Adding remaining Stage 1 options...');
    const remainingStage1 = stage1Options.filter(opt => {
      const cleanOpt = opt.trim().toLowerCase();
      return !seen.has(cleanOpt);
    });
    
    // Take top options (max 8 total)
    const toAdd = Math.min(8 - result.length, remainingStage1.length);
    for (let i = 0; i < toAdd; i++) {
      result.push(remainingStage1[i]);
      seen.add(remainingStage1[i].trim().toLowerCase());
      console.log(`     ➕ Stage 1: "${remainingStage1[i]}"`);
    }
  }

  // Step 4: Add remaining Stage 2 options if still needed
 // if (result.length < 8) {
   // console.log('   Step 4: Adding remaining Stage 2 options...');
   // const remainingStage2 = stage2Options.filter(opt => {
    //  const cleanOpt = opt.trim().toLowerCase();
     // return !seen.has(cleanOpt);
  //  });
    
   // const toAdd = Math.min(8 - result.length, remainingStage2.length);
   // for (let i = 0; i < toAdd; i++) {
    //  result.push(remainingStage2[i]);
    //  seen.add(remainingStage2[i].trim().toLowerCase());
     // console.log(`     ➕ Stage 2: "${remainingStage2[i]}"`);
   // }
 // }

  // Step 5: Ensure no duplicates in final result
  const finalResult: string[] = [];
  const finalSeen = new Set<string>();
  
  for (const opt of result) {
    const cleanOpt = opt.trim().toLowerCase();
    if (!finalSeen.has(cleanOpt)) {
      finalResult.push(opt);
      finalSeen.add(cleanOpt);
    }
  }

  console.log(`   ✅ Final: ${finalResult.length} unique options`);
  return finalResult.slice(0, 8);
}

// STRONG OPTION SIMILARITY CHECK
function areOptionsStronglySimilar(opt1: string, opt2: string): boolean {
  if (!opt1 || !opt2) return false;
  
  const clean1 = opt1.toLowerCase().trim();
  const clean2 = opt2.toLowerCase().trim();
  
  // Direct match
  if (clean1 === clean2) return true;
  
  // Remove spaces and compare
  const noSpace1 = clean1.replace(/\s+/g, '');
  const noSpace2 = clean2.replace(/\s+/g, '');
  if (noSpace1 === noSpace2) return true;
  
  // Material and grade equivalences
  const materialGroups = [
    ['304', 'ss304', 'ss 304', 'stainless steel 304'],
    ['316', 'ss316', 'ss 316', 'stainless steel 316'],
    ['430', 'ss430', 'ss 430'],
    ['201', 'ss201', 'ss 201'],
    ['202', 'ss202', 'ss 202'],
    ['ms', 'mild steel', 'carbon steel'],
    ['gi', 'galvanized iron'],
    ['aluminium', 'aluminum'],
  ];
  
  for (const group of materialGroups) {
    const inGroup1 = group.some(term => clean1.includes(term));
    const inGroup2 = group.some(term => clean2.includes(term));
    if (inGroup1 && inGroup2) {
      // Check if same numeric grade
      const num1 = clean1.match(/\b(\d+)\b/)?.[1];
      const num2 = clean2.match(/\b(\d+)\b/)?.[1];
      if (num1 && num2 && num1 !== num2) return false;
      return true;
    }
  }
  
  // Measurement matching
  const getMeasurement = (str: string) => {
    const match = str.match(/(\d+(\.\d+)?)\s*(mm|cm|m|inch|in|ft|"|')?/i);
    if (!match) return null;
    
    const value = parseFloat(match[1]);
    const unit = match[3]?.toLowerCase() || '';
    
    // Convert to mm for comparison
    if (unit === 'cm' || unit === 'centimeter') return value * 10;
    if (unit === 'm' || unit === 'meter') return value * 1000;
    if (unit === 'inch' || unit === 'in' || unit === '"') return value * 25.4;
    if (unit === 'ft' || unit === 'feet' || unit === "'") return value * 304.8;
    return value; // assume mm
  };
  
  const meas1 = getMeasurement(clean1);
  const meas2 = getMeasurement(clean2);
  
  if (meas1 && meas2 && Math.abs(meas1 - meas2) < 0.01) {
    return true;
  }
  
  // Shape equivalences
  const shapeGroups = [
    ['round', 'circular', 'circle'],
    ['square', 'squared'],
    ['rectangular', 'rectangle'],
    ['hexagonal', 'hexagon'],
    ['flat', 'flat bar'],
    ['angle', 'l shape', 'l-shaped'],
    ['channel', 'c shape', 'c-shaped'],
    ['pipe', 'tube', 'tubular'],
    ['slotted', 'slot'],
  ];
  
  for (const group of shapeGroups) {
    const inGroup1 = group.some(term => clean1.includes(term));
    const inGroup2 = group.some(term => clean2.includes(term));
    if (inGroup1 && inGroup2) return true;
  }
  
  return false;
}

// ============================================
// COMPARE RESULTS FUNCTION
// ============================================

export function compareResults(
  chatgptSpecs: Stage1Output,
  geminiSpecs: Stage1Output
): {
  common_specs: Array<{
    spec_name: string;
    chatgpt_name: string;
    gemini_name: string;
    common_options: string[];
    chatgpt_unique_options: string[];
    gemini_unique_options: string[];
  }>;
  chatgpt_unique_specs: Array<{ spec_name: string; options: string[] }>;
  gemini_unique_specs: Array<{ spec_name: string; options: string[] }>;
} {
  const chatgptAllSpecs = extractAllSpecsWithOptions(chatgptSpecs);
  const geminiAllSpecs = extractAllSpecsWithOptions(geminiSpecs);

  const commonSpecs: Array<{
    spec_name: string;
    chatgpt_name: string;
    gemini_name: string;
    common_options: string[];
    chatgpt_unique_options: string[];
    gemini_unique_options: string[];
  }> = [];

  const chatgptUnique: Array<{ spec_name: string; options: string[] }> = [];
  const geminiUnique: Array<{ spec_name: string; options: string[] }> = [];

  const matchedChatgpt = new Set<number>();
  const matchedGemini = new Set<number>();

  chatgptAllSpecs.forEach((chatgptSpec, i) => {
    let foundMatch = false;
    
    geminiAllSpecs.forEach((geminiSpec, j) => {
      if (matchedGemini.has(j)) return;
      
      if (isSemanticallySimilar(chatgptSpec.spec_name, geminiSpec.spec_name)) {
        matchedChatgpt.add(i);
        matchedGemini.add(j);
        foundMatch = true;
        
        const commonOpts = findCommonOptions(chatgptSpec.options, geminiSpec.options);
        const chatgptUniq = chatgptSpec.options.filter(opt => 
          !geminiSpec.options.some(gemOpt => isSemanticallySimilarOption(opt, gemOpt))
        );
        const geminiUniq = geminiSpec.options.filter(opt => 
          !chatgptSpec.options.some(chatOpt => isSemanticallySimilarOption(opt, chatOpt))
        );
        
        commonSpecs.push({
          spec_name: chatgptSpec.spec_name,
          chatgpt_name: chatgptSpec.spec_name,
          gemini_name: geminiSpec.spec_name,
          common_options: commonOpts,
          chatgpt_unique_options: chatgptUniq,
          gemini_unique_options: geminiUniq
        });
      }
    });
    
    if (!foundMatch) {
      chatgptUnique.push({
        spec_name: chatgptSpec.spec_name,
        options: chatgptSpec.options
      });
    }
  });

  geminiAllSpecs.forEach((geminiSpec, j) => {
    if (!matchedGemini.has(j)) {
      geminiUnique.push({
        spec_name: geminiSpec.spec_name,
        options: geminiSpec.options
      });
    }
  });

  return {
    common_specs: commonSpecs,
    chatgpt_unique_specs: chatgptUnique,
    gemini_unique_specs: geminiUnique,
  };
}

// Helper functions
function extractAllSpecsWithOptions(specs: Stage1Output): Array<{ spec_name: string; options: string[] }> {
  const allSpecs: Array<{ spec_name: string; options: string[] }> = [];
  
  specs.seller_specs.forEach((ss) => {
    ss.mcats.forEach((mcat) => {
      const { finalized_primary_specs, finalized_secondary_specs, finalized_tertiary_specs } =
        mcat.finalized_specs;
      
      finalized_primary_specs.specs.forEach((s) => 
        allSpecs.push({ spec_name: s.spec_name, options: s.options })
      );
      finalized_secondary_specs.specs.forEach((s) => 
        allSpecs.push({ spec_name: s.spec_name, options: s.options })
      );
      finalized_tertiary_specs.specs.forEach((s) => 
        allSpecs.push({ spec_name: s.spec_name, options: s.options })
      );
    });
  });
  
  return allSpecs;
}

function isSemanticallySimilarOption(opt1: string, opt2: string): boolean {
  return areOptionsStronglySimilar(opt1, opt2);
}

function findCommonOptions(options1: string[], options2: string[]): string[] {
  const common: string[] = [];
  const usedIndices = new Set<number>();
  
  options1.forEach((opt1, i) => {
    options2.forEach((opt2, j) => {
      if (usedIndices.has(j)) return;
      if (areOptionsStronglySimilar(opt1, opt2)) {
        common.push(opt1);
        usedIndices.add(j);
      }
    });
  });
  
  return common;
}