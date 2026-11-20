# Fit Tool v1.6 · Web Edition

**English** | [Chinese](README-zh.md)

Draw a route on the map, drag its vertices, tune the GPS drift, and generate a Garmin **FIT** activity file — entirely in your browser. No backend, no install.

**Live app:** <https://eric-thy.github.io/fit-tool-web/>

## What it does

Plan a running route (e.g. a campus loop), then export a realistic FIT file with distance, pace, heart rate, cadence, stride length, ground contact time, vertical oscillation and more — the kind of activity file a watch would record.

## Features

### Route editing

- **Click to add vertices** — the route is joined into a polyline automatically.
- **Undo / redo** — `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`). Works for adding points, dragging a vertex, panning the whole route, clearing it, switching map sources and importing a route. 80 steps of history.
- **Drag any vertex** — click and drag the orange handle; the line and the total distance update live. Coordinates are clamped to valid ranges, so you can never produce broken data.
- **Pan the whole route** — press and drag the line itself to move every vertex at once. Releasing does not accidentally add a new point.
- **Save / load routes** — export as GeoJSON (includes route mode, lap count and offset), import GeoJSON (`Feature`, `FeatureCollection`, `LineString`, `MultiLineString`, `Polygon`), the legacy `{points:[{lat,lng}]}` shape, or a plain `[[lng,lat],...]` array. Invalid files are rejected with a message and never touch your current route.

### Activity generation

- **Adjustable route offset** — 0 to 12 m. `0` means the recorded track exactly follows the drawn route; larger values make it wander like a real GPS fix. The offset varies smoothly along the route and stays closed per lap, so multiple laps form one natural band instead of several shifted copies.
- **Loop or linear mode** — loops close automatically and repeat for a configurable number of laps.
- **Physiological inputs** — resting HR, max HR, body weight, target pace, up to 10 exports with different start times and paces.
- **Preview** — plays the activity on the map and draws the whole generated track before you export.
- **Complete running metrics** — distance, pace, heart rate, cadence, step length, ground contact time, vertical oscillation, vertical ratio, cumulative cycles.
- **100% client-side** — everything is computed in the browser; nothing is uploaded.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Undo | `Ctrl+Z` / `Cmd+Z` |
| Redo | `Ctrl+Y` or `Ctrl+Shift+Z` |

Shortcuts are ignored while typing in an input field, so the browser's own text undo still works there.

## Run locally

Open `index.html` directly (Leaflet and the generator are bundled), or serve the folder:

```bash
python -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages

The repository root is the site root:

1. Push this folder to the `main` branch.
2. **Settings → Pages** → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so Pages serves the assets as-is.

## Project structure

```
index.html        page
main.js           map interaction, vertex dragging, undo stack, import/export, generation flow
style.css         styles
fit-core.js       FIT generator for the browser (@garmin/fitsdk + activity simulation)
leaflet/          Leaflet 1.9.4, vendored (no CDN)
```

## Desktop version

There is also a Windows desktop build (`fit-tool.exe`) that serves this exact page locally and generates the FIT file through a local Node process. Both builds share the same `main.js`; only the generation backend differs, and the resulting FIT files are byte-for-byte identical.

## Notes

- Map sources: Tianditu, OpenStreetMap, Google, Tencent. Chinese sources may need your own API key; keys are stored in your browser's localStorage only.
- FIT files are encoded with Garmin's official `@garmin/fitsdk`.
- Generated data is intended for personal testing and learning. Please respect your school's and platform's rules.
