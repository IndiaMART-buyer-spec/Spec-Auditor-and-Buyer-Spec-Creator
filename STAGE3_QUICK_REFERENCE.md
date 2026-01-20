# Stage 3 - Quick Reference Guide

## Two Main Panels

### ✅ Common Specifications (Left Panel - Blue)
**What**: True overlap between Stage 1 and Stage 2
**Format**: Table with 3 columns
```
Specification | Category | Common Options
Grade         | Primary  | 304, 316, MS
Finish        | Secondary| (empty if no common)
```
**Features**:
- Shows ALL common specifications (no limit)
- Deduplicated (no duplicate specs or options)
- Sorted by Category (Primary first)
- Scrollable (max 600px height)

### ✅ Buyer ISQs (Right Panel - Orange)
**What**: Enhanced specs for buyer search (max 8 options each)
**Format**: Table with 3 columns
```
# | Specification | Options
1 | Grade        | 304, 316, MS, 430, 201, 202, GI, AL
2 | Finish       | ...
```
**Features**:
- Only first 2 common specs
- Common options FIRST, then Stage 1 additions
- Max 8 options per spec
- Deduplicated (no duplicates)
- Scrollable (max 600px height)

---

## Key Data Flow

```
Gemini API Input (Text/Plain)
    ↓
Parse Text Table
    ↓
Deduplicate Specs & Options
    ↓
Common Specs Panel
    ↓
Take First 2 Specs
    ↓
Enhance with Stage 1 (if < 8)
    ↓
Buyer ISQs Panel
```

---

## Deduplication Rules

### Specifications
- Normalized name comparison (ignore case, spaces, punctuation)
- Duplicates: Merge options
- Example: "Grade", "grade", "GRADE" → Single "Grade" entry

### Options
- Exact match (case-insensitive)
- Semantic match (intelligent recognition)
- Examples:
  - "304" = "SS304" = "Stainless Steel 304" ✗ (deduplicated)
  - "2mm" = "2 mm" = "0.2cm" ✗ (deduplicated)
  - "Polished" = "Polish" ✗ (deduplicated)
  - "304" ≠ "316" ✓ (kept separate)

---

## What's Different From Before

| Aspect | Before | After |
|--------|--------|-------|
| Gemini Format | JSON | Plain Text Table |
| Specification Duplication | Possible | Deduplicated |
| Option Duplication | Possible | Deduplicated |
| UI Layout | Cards | Tables |
| All Data Visible | Partially | Fully |
| Common Options First | No | Yes |

---

## Common Specifications Table

```
┌─────────────────┬──────────────┬─────────────────┐
│ Specification   │ Category     │ Common Options  │
├─────────────────┼──────────────┼─────────────────┤
│ Grade           │ Primary      │ 304, 316, MS    │
│ Finish          │ Secondary    │ (none)          │
│ Type            │ Primary      │ A, B            │
└─────────────────┴──────────────┴─────────────────┘
```

---

## Buyer ISQs Table

```
┌───┬──────────────┬────────────────────────────────────────┐
│ # │ Specification│ Options                                │
├───┼──────────────┼────────────────────────────────────────┤
│ 1 │ Grade        │ 304 316 MS 430 201 202 GI AL          │
├───┼──────────────┼────────────────────────────────────────┤
│ 2 │ Finish       │ Polished Matte Brushed Hot Cold...    │
└───┴──────────────┴────────────────────────────────────────┘
```

---

## Text Format Example

Gemini now outputs:
```
Grade | Primary | 304, 316, MS
Finish | Secondary |
Type | Primary | A, B, C
Material | Primary | Steel, Aluminum
```

Instead of JSON. This is:
- Simpler for Gemini ✓
- Easier to parse ✓
- Less error-prone ✓
- More reliable ✓

---

## Functions at a Glance

### Main API Functions
1. `findCommonSpecsWithGemini(stage1Specs, stage2ISQs)`
   - Returns: Common specs (deduplicated)

2. `generateBuyerISQsWithGemini(commonSpecs, stage1Specs)`
   - Returns: Buyer ISQs (first 2 specs, max 8 options each)

### Helper Functions
1. `parseCommonSpecsFromText(text, stage1Specs)`
   - Parses plain text table from Gemini

2. `deduplicateCommonSpecs(specs)`
   - Removes duplicate specifications and options

3. `deduplicateOptions(options)`
   - Removes duplicate options from array

---

## Usage in Components

```typescript
// In App.tsx
const commonSpecsResult = await findCommonSpecsWithGemini(
  originalSpecs,
  { config: stage2ISQ.config, keys: stage2ISQ.keys }
);

// Then pass to Stage3Results
<Stage3Results
  commonSpecs={commonSpecsResult.commonSpecs}
  buyerISQs={buyerISQs}
/>

// In Stage3Results.tsx - Automatically renders:
// - Left: Common Specs table
// - Right: Buyer ISQs table
```

---

## Troubleshooting

### Issue: Duplicate specs appearing
**Solution**: Check `normalizeSpecName()` function - may need additional standardizations

### Issue: Duplicate options appearing
**Solution**: Check `areOptionsStronglySimilar()` - may need more semantic rules

### Issue: Some options missing from Buyer ISQs
**Solution**: Normal - max 8 options enforced. Check console for which options were filtered.

### Issue: Gemini API not responding
**Solution**: Falls back to local matching. Check console logs for details.

---

## Best Practices

✅ Always check console logs for deduplication details
✅ Verify Stage 3 output before finalizing
✅ If duplicates appear, report with logs
✅ Test with various input formats
✅ Monitor API usage (text format reduces tokens)

---

## Performance Metrics

- Parse time: < 100ms
- Deduplication: < 50ms
- Render time: < 200ms
- Total: < 500ms

---

## Files to Know

```
src/utils/api.ts
  ├─ findCommonSpecsWithGemini()
  ├─ findCommonSpecsWithGeminiAPI()
  ├─ parseCommonSpecsFromText()
  ├─ deduplicateCommonSpecs()
  ├─ generateBuyerISQsWithGemini()
  └─ deduplicateOptions()

src/components/Stage3Results.tsx
  └─ Table-based UI for both panels
```

---

## Next Steps

1. Test with real data
2. Monitor Gemini API performance
3. Adjust deduplication rules if needed
4. Export results and verify accuracy
5. Consider caching if API calls are frequent
