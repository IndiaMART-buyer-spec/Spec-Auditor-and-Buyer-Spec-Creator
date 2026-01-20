# Stage 3 Refactoring - Complete Documentation

## Overview
Stage 3 has been completely refactored to meet the new requirements. The screen is now split into two distinct sections with clear responsibilities.

---

## Changes Made

### 1. **Common Specifications Section**
**Purpose**: Shows the TRUE OVERLAP between Stage 1 and Stage 2

**How it works**:
- Uses Gemini API to identify specifications that exist in BOTH Stage 1 and Stage 2
- For each common specification, shows ONLY the options that appear in both stages
- If a specification has no common options, displays "No common options available"
- No additional options from Stage 1 are added here
- This represents the pure intersection of the two data sources

**API Function**: `findCommonSpecsWithGemini()` (in `src/utils/api.ts`)
- First tries Gemini API to find common specs
- Falls back to local matching if Gemini fails
- Returns array of common specs with their common options only

---

### 2. **Buyer ISQs Section**
**Purpose**: Generate buyer-focused specifications with enhanced options

**How it works**:
1. Takes the **first 2 common specifications** from the Common Specifications panel
2. For each specification:
   - **Step 1**: Start with common options (from Common Specifications)
   - **Step 2**: If common options < 8, use Gemini API to intelligently add more options from Stage 1
   - **Step 3**: Gemini selects the most relevant and widely-used options
   - **Step 4**: Ensures NO duplicate or semantically redundant options
   - **Step 5**: Final result contains max 8 options
   - **Order**: Common options FIRST, then Stage 1 added options

**API Function**: `generateBuyerISQsWithGemini()` (in `src/utils/api.ts`)

**Gemini Enhancement**:
- `enhanceOptionsWithGemini()` - Calls Gemini API to select additional options
- Smart duplicate detection (semantic matching)
- Prefers industry-standard and commonly-used options
- Falls back to local selection if Gemini API fails

---

## Code Changes

### File: `src/utils/api.ts`

#### New Functions Added:

1. **`generateBuyerISQsWithGemini()`** (lines 1676-1751)
   - Main function for generating Buyer ISQs
   - Takes first 2 common specs
   - Enhances with Gemini if needed
   - Returns max 8 options per spec

2. **`enhanceOptionsWithGemini()`** (lines 1753-1837)
   - Calls Gemini API to select additional options
   - Provides clear context to Gemini
   - Validates responses
   - Falls back to local method if API fails

3. **`enhanceOptionsLocally()`** (lines 1839-1858)
   - Fallback function if Gemini API fails
   - Selects additional options locally
   - Ensures no duplicates

4. **`isOptionDuplicate()`** (lines 1860-1869)
   - Checks for exact and semantic duplicates
   - Uses `areOptionsStronglySimilar()` for semantic matching

#### Removed Functions:
- `selectStage3BuyerISQs()` - Replaced by new Gemini-powered version

---

### File: `src/App.tsx`

**Updated Import** (line 7):
```typescript
import { generateBuyerISQsWithGemini } from "./utils/api";
```

**Updated Function Calls**:

1. **`handleURLSubmit()`** (lines 82-85):
```typescript
const buyerISQs = await generateBuyerISQsWithGemini(
  commonSpecsResult.commonSpecs,
  originalSpecs
);
```

2. **`handleRerunStage2()`** (lines 139-142):
```typescript
const buyerISQs = await generateBuyerISQsWithGemini(
  commonSpecsResult.commonSpecs,
  originalSpecs
);
```

---

### File: `src/components/Stage3Results.tsx`

**Updated Descriptions**:

1. **Common Specifications** (line 50):
```typescript
"True overlap between Stage 1 and Stage 2 specifications"
```

2. **Buyer ISQs** (line 77):
```typescript
"Top 2 common specs enhanced with additional Stage 1 options (max 8 per spec)"
```

---

## Flow Diagram

```
Stage 1: Upload Specs
    ↓
Stage 2: Extract ISQs from URLs
    ↓
findCommonSpecsWithGemini()
    ├─→ Common Specs (true overlap, no additions)
    │
    └─→ generateBuyerISQsWithGemini()
        ├─→ Take first 2 common specs
        ├─→ Start with common options
        ├─→ If < 8 options:
        │   └─→ enhanceOptionsWithGemini()
        │       ├─→ Gemini selects best Stage 1 options
        │       ├─→ No duplicates allowed
        │       └─→ Returns additional options
        └─→ Final: max 8 options (common first, then Stage 1)
```

---

## Example Scenario

**Stage 1 Spec**: "Grade"
- Options: ["304", "316", "430", "201", "202", "MS", "GI", "AL"]

**Stage 2 ISQ**: "Grade"
- Options: ["304", "316", "MS"]

### Result:

**Common Specifications Panel**:
```json
{
  "spec_name": "Grade",
  "options": ["304", "316", "MS"],
  "category": "Primary"
}
```

**Buyer ISQs Panel** (if this is one of top 2):
```json
{
  "name": "Grade",
  "options": [
    "304",      // Common option
    "316",      // Common option
    "MS",       // Common option
    "430",      // Added by Gemini from Stage 1
    "201",      // Added by Gemini from Stage 1
    "202",      // Added by Gemini from Stage 1
    "GI",       // Added by Gemini from Stage 1
    "AL"        // Added by Gemini from Stage 1
  ]
}
```

Note: Order maintained - common options first, then Stage 1 additions.

---

## Key Features

1. **Gemini-Powered Intelligence**
   - Smart option selection based on relevance
   - Industry-standard preference
   - Semantic duplicate detection

2. **Robust Fallbacks**
   - Local enhancement if Gemini API fails
   - Graceful degradation
   - No breaking errors

3. **Clear Separation**
   - Common Specs: Pure overlap (no additions)
   - Buyer ISQs: Enhanced specifications (up to 8 options)

4. **Order Preservation**
   - Common options always come first
   - Stage 1 additions follow
   - Max 8 options enforced

5. **Duplicate Prevention**
   - Exact match detection
   - Semantic similarity checking
   - Case-insensitive comparison

---

## API Configuration

**Required Environment Variables**:
- `VITE_STAGE3_API_KEY` - Gemini API key for Stage 3 operations

If not configured, system falls back to local option selection.

---

## Testing

Build successful:
```
✓ 1478 modules transformed.
dist/assets/index-aXfanh1B.js   493.77 kB │ gzip: 160.03 kB
✓ built in 6.57s
```

All TypeScript types validated. No compilation errors.

---

## Future Enhancements

Possible improvements:
1. Add confidence scores for Gemini selections
2. Allow user to customize max options count
3. Show which options are common vs added
4. Add option ranking/sorting by popularity
5. Cache Gemini responses to reduce API calls
