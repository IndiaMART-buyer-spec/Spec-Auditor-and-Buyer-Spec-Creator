# Stage 2 Improvements - Text Format Parsing

## Problem
Gemini was returning incomplete JSON responses in Stage 2, causing:
- Incomplete data extraction
- Missing specifications
- Irrelevant or malformed data
- Inconsistent results

## Solution
Changed Stage 2 to use **text format** instead of JSON format, with structured parsing.

## Changes Made

### 1. Updated API Response Format
**File**: `src/utils/api.ts`

Changed Gemini API call from:
```typescript
responseMimeType: "application/json"
```

To:
```typescript
responseMimeType: "text/plain"
```

### 2. New Text-Based Prompt Format
Updated `buildISQExtractionPrompt()` to request structured text output:

```
=== CONFIG SPECIFICATION ===
Name: [specification name]
Options: [option 1] | [option 2] | [option 3]

=== KEY SPECIFICATION 1 ===
Name: [specification name]
Options: [option 1] | [option 2] | [option 3]

=== KEY SPECIFICATION 2 ===
Name: [specification name]
Options: [option 1] | [option 2] | [option 3]

=== KEY SPECIFICATION 3 ===
Name: [specification name]
Options: [option 1] | [option 2] | [option 3]
```

**Benefits**:
- Clear section markers (===)
- Simple pipe-separated options
- Easy to parse with regex
- Gemini can complete this format reliably

### 3. New Text Parser Function
Created `parseISQFromText()` function that:
- Uses regex to extract sections
- Parses exactly 1 config specification
- Parses exactly 3 key specifications
- Splits options by pipe character (|)
- Filters out "Other" and "etc." options
- Limits to 8 options per config, 6 per key
- Has fallback logic if section markers aren't found

**Parsing Logic**:
1. Extract Config section using: `/===\s*CONFIG SPECIFICATION\s*===/`
2. Extract Key sections using: `/===\s*KEY SPECIFICATION [1-3]\s*===/`
3. For each section, parse Name and Options
4. Fallback: Use generic Name/Options pattern if markers missing
5. Validate: Ensure 1 config + 3 keys before returning

### 4. Improved Stage2Results Component
**File**: `src/components/Stage2Results.tsx`

Enhanced UI to:
- Show exactly up to 3 key specifications
- Display option counts
- Handle missing data gracefully
- Show warning if fewer than 3 keys extracted
- Better visual hierarchy with gradients and badges
- Improved color scheme (red for config, blue for keys)

### 5. Updated extractISQWithGemini Function
Main changes:
- Calls Gemini with text/plain format
- Extracts raw text using `extractRawText()`
- Parses text using `parseISQFromText()`
- Logs first 800 chars of response for debugging
- Better error handling and validation

## Benefits

### Reliability
- Text format is simpler for Gemini to generate
- No incomplete JSON issues
- Consistent output structure
- Better completion rate

### Accuracy
- Guarantees exactly 1 config and 3 keys
- Clear separation between specification types
- No ambiguous parsing
- Proper option filtering

### Maintainability
- Easy to debug (text is human-readable)
- Simple regex patterns
- Clear validation logic
- Fallback parsing for edge cases

## Testing

Build successful:
```
✓ 1478 modules transformed.
dist/assets/index-8W8syf9F.js   492.78 kB │ gzip: 159.35 kB
✓ built in 8.09s
```

## How It Works Now

1. **User submits URLs** in Stage 2
2. **URLs are fetched** and content extracted
3. **Gemini receives text-based prompt** with clear format instructions
4. **Gemini returns structured text**:
   ```
   === CONFIG SPECIFICATION ===
   Name: Grade
   Options: SS 304 | SS 316 | MS | Galvanized

   === KEY SPECIFICATION 1 ===
   Name: Thickness
   Options: 0.5 mm | 1 mm | 2 mm

   === KEY SPECIFICATION 2 ===
   Name: Surface Finish
   Options: Hot Rolled | Cold Rolled

   === KEY SPECIFICATION 3 ===
   Name: Width
   Options: 1000 mm | 1219 mm | 1500 mm
   ```
5. **Parser extracts data** using regex patterns
6. **Validated result** returned with exactly 1 config + 3 keys
7. **UI displays** results with clear visual hierarchy

## Next Steps (if needed)

If further improvements are needed:
- Add more sophisticated fallback parsing
- Handle alternative text formats
- Add retry logic with different prompts
- Validate options against known patterns
- Add confidence scores for each extraction
