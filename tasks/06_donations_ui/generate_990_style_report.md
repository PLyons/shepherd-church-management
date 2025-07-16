# generate_990_style_report

## Purpose
Generate downloadable financial reports for IRS Form 990-style compliance and year-end summaries.

## Requirements
- Admin access only
- Group donations by member and category
- Allow export as CSV

## Procedure
1. Create a route: `/reports/990`
2. Build server-side logic to:
   - Aggregate donations by member and category
   - Sum totals and count transactions
   - Exclude anonymous gifts from member summaries
3. Render table for preview
4. Add CSV download button using data URI or backend function
