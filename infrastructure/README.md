# Infrastructure

CloudFormation (SAM) nested-stack templates for Unofficial Glasto.

## Stacks

- `main.yaml` — root nested stack
- `dynamodb.yaml` — single-table schema with `gsi1`
- `api.yaml` — API Gateway + Express Lambda (`backend/`)
- `scraper.yaml` — scheduled scraper Lambda (`scraper/`)
- `cognito.yaml` _(Phase 6)_ — user pool for optional sign-in
- `s3-cloudfront.yaml` _(Phase 2)_ — web hosting + map tile cache bucket
- `monitoring.yaml` _(later)_ — CloudWatch alarms + dashboards

## Deploy (dev)

```bash
# from repo root, after building backend + scraper
npm run build --workspace=backend
npm run build --workspace=scraper

cd infrastructure
sam build
sam deploy --guided --stack-name glasto-dev --parameter-overrides Environment=dev
```

## Validation

```bash
cfn-lint *.yaml
cfn_nag_scan --input-path .
```
