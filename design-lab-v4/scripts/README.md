# QA Script Usage

These scripts are framework-neutral examples. Codex should adapt route patterns and start commands to the repository.

## Dependencies

```bash
npm install --save-dev playwright
npx playwright install chromium
python -m pip install Pillow
```

Do not add these if equivalent tooling already exists.

## Validate concept registry

```bash
python design-lab-v4/scripts/validate-registry.py \
  design-lab-v4/config/experiments.json
```

## Capture 1920×1080 screenshots

Start the local site, then:

```bash
BASE_URL=http://localhost:3000 \
ROUTE_TEMPLATE='/test/{n}' \
node design-lab-v4/scripts/capture-tests.mjs
```

Change `ROUTE_TEMPLATE` to the project’s actual route convention.

## Run one-screen checks

```bash
BASE_URL=http://localhost:3000 \
ROUTE_TEMPLATE='/test/{n}' \
node design-lab-v4/scripts/check-one-screen.mjs
```

The script expects stable QA selectors described in `docs/ARCHITECTURE.md`.

## Make a contact sheet

```bash
python design-lab-v4/scripts/make-contact-sheet.py \
  .artifacts/design-lab/screenshots \
  --output .artifacts/design-lab/contact-sheet.png
```

## Important

Automated checks do not replace visual review. A page can pass `scrollHeight` and still be cramped, confusing, or hidden behind `overflow: hidden`.
