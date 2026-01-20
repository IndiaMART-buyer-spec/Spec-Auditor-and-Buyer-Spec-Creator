# Stage 3 Update - Text Format & Deduplication

## Overview
Stage 3 has been refactored to use plain text table format from Gemini API instead of JSON, with comprehensive deduplication of specifications and options.

---

## Key Changes

### 1. Gemini API Output Format (Changed from JSON to Text)

**Old Format**: JSON structured response
```json
{
  "common_specs": [
    { "spec_name": "Grade", "options": ["304", "316"], "category": "Primary" }
  ]
}
```

**New Format**: Plain text table format
```
Specification Name | Stage 1 Category | Common Options
Grade | Primary | 304, 316, 430
Finish | Secondary |
Type | Primary | A, B, C
```

**Benefits**:
- Simpler for Gemini to output
- Less prone to JSON parsing errors
- More human-readable
- Easier to handle edge cases

---

### 2. Deduplication Logic

#### Specification Deduplication
**Function**: `deduplicateCommonSpecs()` in `src/utils/api.ts`

- Detects duplicate specifications using normalized names
- Merges options from duplicate specs
- Removes case-sensitive and semantic duplicates
- Uses `normalizeSpecName()` for comparison

**Process**:
1. Normalize spec name (remove stop words, standardize)
2. Check if normalized name already exists
3. If exists, merge options (avoiding duplicates)
4. If new, add to results with deduplicated options

#### Option Deduplication
**Function**: `deduplicateOptions()` in `src/utils/api.ts`

- Detects exact duplicates (case-insensitive)
- Detects semantic duplicates using `isOptionDuplicate()`
- Maintains order (common options first, then added options)
- Applied to both Common Specs and Buyer ISQs

**Example**:
```
Input: ["304", "SS304", "Stainless Steel 304", "316"]
Output: ["304", "316"]  // Semantic duplicates removed
```

---

### 3. Display Updates

#### Common Specifications Section
**Old**: Card layout with individual specs
**New**: Table format with:
- Specification name column
- Category column (Primary/Secondary)
- Common Options column (with badges)
- Alternating row colors for readability
- Scrollable with max height of 600px

#### Buyer ISQs Section
**Old**: Card layout with numbered badges
**New**: Table format with:
- # column (row number)
- Specification column
- Options column (with option badges)
- Alternating row colors
- Show More/Show Less button for additional specs
- Scrollable with max height of 600px

---

## API Changes

### `findCommonSpecsWithGeminiAPI()`
**File**: `src/utils/api.ts` (lines 1413-1451)

**Changes**:
- Changed `responseMimeType` from `"application/json"` to `"text/plain"`
- Updated prompt to request plain text table format
- Added `parseCommonSpecsFromText()` to parse table format

### `parseCommonSpecsFromText()`
**File**: `src/utils/api.ts` (lines 1453-1498)

**New Function**:
- Parses plain text table format from Gemini
- Splits lines by pipe (|) separator
- Extracts specification name, category, and options
- Maps to Stage 1 specs for exact names and categories
- Filters out invalid options

### `deduplicateCommonSpecs()`
**File**: `src/utils/api.ts` (lines 1357-1411)

**New Function**:
- Removes duplicate specifications
- Merges options within duplicate specs
- Uses normalized spec names for comparison
- Removes duplicate options within each spec

### `deduplicateOptions()`
**File**: `src/utils/api.ts` (lines 1701-1714)

**New Function**:
- Removes exact duplicates (case-insensitive)
- Removes semantic duplicates
- Maintains order of options
- Used in both Common Specs and Buyer ISQs

---

## Component Changes

### `Stage3Results.tsx`
**Changes**:
- Replaced card-based layout with table layout
- Common Specs: 3-column table (Specification, Category, Common Options)
- Buyer ISQs: 3-column table (#, Specification, Options)
- Removed `SpecCard` and `BuyerISQCard` components
- Removed `CommonSpecItem` interface

---

## Data Flow

```
Stage 1 Specs + Stage 2 ISQs
         ↓
findCommonSpecsWithGemini()
         ↓
findCommonSpecsWithGeminiAPI()
         ↓
Gemini API (text/plain)
    ↓
parseCommonSpecsFromText()
    ↓
deduplicateCommonSpecs()
    ↓
Common Specs (deduplicated)
    ↓
generateBuyerISQsWithGemini()
    ↓
[For each of first 2 specs]
    ↓
[Start with common options]
    ↓
[If < 8, enhance with Gemini]
    ↓
deduplicateOptions()
    ↓
Buyer ISQs (max 8 options each)
    ↓
Stage3Results Component
    ↓
Table Display (Common Specs + Buyer ISQs)
```

---

## Deduplication Examples

### Specification Deduplication
```
Input Common Specs:
- Grade (Primary) | [304, 316]
- Grade (Primary) | [430]
- Material (Primary) | [Steel]

Output:
- Grade (Primary) | [304, 316, 430]
- Material (Primary) | [Steel]
```

### Option Deduplication
```
Input Options:
["304", "SS304", "ss304", "Stainless Steel 304", "316", "ms", "Mild Steel"]

Output (for material spec):
["304", "316", "ms"]
```

### Buyer ISQ Deduplication
```
Common Options: ["304", "316"]
Stage 1 Options: ["304", "SS304", "316", "430", "201", "202", "ms", "gi"]

After deduplication (max 8):
["304", "316", "430", "201", "202", "ms", "gi"]
```

---

## Benefits of This Approach

1. **Cleaner Output**: Text format is easier for Gemini to generate
2. **No Duplicates**: Comprehensive deduplication at spec and option levels
3. **Better UI**: Table format is cleaner and more organized
4. **Semantic Awareness**: Uses intelligent matching for semantic duplicates
5. **Preserves Order**: Common options always appear first
6. **Scalability**: Can handle varying numbers of specs and options

---

## Testing Checklist

- [x] Build completes without errors
- [x] Text parsing handles various input formats
- [x] Deduplication removes all exact duplicates
- [x] Semantic duplicate detection works
- [x] Common Specs displayed in table format
- [x] Buyer ISQs displayed in table format
- [x] No specs appear twice in results
- [x] No options appear twice within a spec
- [x] Common options appear first in Buyer ISQs
- [x] Max 8 options enforced

---

## Migration Notes

### Breaking Changes
- Buyer ISQ data structure remains the same (ISQ[])
- Common Specs structure remains the same
- API response format changed (JSON → text/plain)

### Backward Compatibility
- Local fallback still uses same deduplication
- All parsing errors fall back to local matching
- No changes to public API signatures

---

## Future Enhancements

1. Add confidence scores from Gemini parsing
2. Highlight which options are common vs. added
3. Allow custom max options count (instead of hardcoded 8)
4. Add export to CSV with deduplication metadata
5. Show count of removed duplicates in UI
