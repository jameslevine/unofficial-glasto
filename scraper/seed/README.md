# Seed Data

Committed JSON exports of `Performance[]` for archive years.

Files (to be populated in Phase 1):

- `2022.json`
- `2023.json`
- `2024.json`
- `2025.json`

Generation:

1. Run `npm run scrape:local -- 2024 > seed/2024.raw.json` (with selectors tuned in `parse.ts`).
2. Hand-validate against the official site.
3. Commit the file.

The CloudFormation deployment of the scraper Lambda also runs an initial seed using these files via a Custom Resource so a fresh stack starts with archive years populated.
