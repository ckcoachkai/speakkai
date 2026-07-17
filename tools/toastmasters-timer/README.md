# Toastmasters Speech Timer

A responsive React/Vite timer for Toastmasters meetings.

## Included formats

- Evaluation Speech: green 1:00, yellow 2:00, red 3:00, bell 3:30
- Prepared Speech: green 5:00, yellow 6:00, red 7:00, bell 7:30
- Table Topics: green 1:00, yellow 1:30, red 2:00, bell 2:30
- Custom timing with validation

## Features

- Drift-resistant timing based on `performance.now()`
- Configurable 0-60 second pre-start countdown, defaulting to 0
- Three synthesized alarm sounds
- Four bell effects, including black-and-white flashing
- Pause, resume, reset, fullscreen, and distraction-free stage mode
- Keyboard shortcuts: Space, R, F, S
- Responsive mobile controls with a slide-in settings panel
- Preferences saved in local storage

## Run locally

```bash
pnpm install --ignore-workspace
pnpm --ignore-workspace run dev
```

## Production build

```bash
pnpm --ignore-workspace run build
```
