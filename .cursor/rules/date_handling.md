# Date Handling Rules

## Automatic Date Lookup

When writing or updating dates in documentation files (PRDs, RFCs, TODOs, or any markdown files), **always** use the current date by running:

```bash
date +%Y-%m-%d
```

### When to Use Current Date

1. **"Last Updated" fields** in documentation:
   - Always use current date: `**Last Updated**: YYYY-MM-DD`
   - Never use placeholders like `2025-01-XX` or `{YYYY-MM-DD}` in actual documents
   - Only use placeholders in templates

2. **"last_updated" fields** in adjacent systems sections:
   - Use current date when documenting system state
   - Format: `last_updated: YYYY-MM-DD`

3. **Document metadata**:
   - When creating new documents, use current date
   - When updating existing documents, update the "Last Updated" field to current date

### How to Get Current Date

**Before writing any date in documentation:**
1. Run `date +%Y-%m-%d` in terminal to get current date
2. Use that exact date format (YYYY-MM-DD) in the document
3. Never hardcode dates or use placeholder dates

### Examples

✅ **Correct:**
- `**Last Updated**: 2025-11-28` (after running `date +%Y-%m-%d`)
- `last_updated: 2025-11-28`

❌ **Incorrect:**
- `**Last Updated**: 2025-01-XX`
- `**Last Updated**: {YYYY-MM-DD}` (unless in a template)
- `**Last Updated**: today` or `**Last Updated**: current date`

### Exception: Templates

Templates may use placeholders like `{YYYY-MM-DD}` or `{date}` to indicate where dates should be inserted, but actual documents must always use real dates.

### Enforcement

- Always check the current date before writing dates
- Update "Last Updated" fields when modifying documents
- Use CLI command `date +%Y-%m-%d` to ensure accuracy

