# Viewport Matrix

Required desktop sizes:

| Viewport | Purpose |
|---|---|
| 1920×1080 | Primary 16:9 art-direction target |
| 1600×900 | Common 16:9 desktop |
| 1440×900 | Less vertical space relative to width |
| 1366×768 | Minimum desktop stress test |

Recommended additional checks:

| Viewport | Purpose |
|---|---|
| 1280×720 | Aggressive small-laptop check |
| 1024×768 | Tablet/legacy landscape; may reflow |
| 768×1024 | Tablet portrait; scrolling allowed |
| 390×844 | Mobile; scrolling allowed |
| 360×800 | Small mobile; scrolling allowed |

Desktop failure conditions:

- document scroll height exceeds viewport by more than tolerance
- document scroll width exceeds viewport by more than tolerance
- primary CTA is clipped or hidden
- navigation is clipped
- text overlaps
- interactive panel opens outside viewport
- the portrait pushes the message off-screen
- content was merely hidden to pass the scroll check
