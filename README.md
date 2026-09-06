# Birth of Civilization v0.6

## What changed

### Chat history
The conversation/event history is now positioned beside the game world instead of at the bottom.
It auto-scrolls and includes an All / Chat filter.

### Voice performance
Voice is OFF by default.
Speech generation is non-blocking and skipped if the local TTS engine is already busy.
The simulation never waits for spoken audio.
Mobile mode does not try to speak every turn.

### Graphics
The canvas renderer now includes:
- textured grass
- river banks and moving water lines
- improved trees and rocks
- richer food/fibre/clay graphics
- character body sprites and shadows
- campfire glow
- shelter and storage drawings
- worn walking paths
- rain and cloudy weather
- day/night lighting
- animated vegetation/water

### Performance modes
Mobile / Balanced / Desktop presets change simulation rate, resource density and weather detail.

## GitHub Pages
Replace your existing project files with this version and keep this structure:

.github/workflows/deploy.yml
src/main.js
index.html
package.json
vite.config.js
README.md

Then commit to `main`. GitHub Pages should rebuild automatically.
