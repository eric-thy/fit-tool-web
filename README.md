# Fit Tool v2.0 · Web Edition

**English** | [Chinese](README-zh.md)

Draw a route on the map, shape the first and last lap, drag vertices, tune the GPS drift, and generate a Garmin **FIT** activity file — entirely in your browser. No backend, no install.

**Live app:** <https://eric-thy.github.io/fit-tool-web/>

## What it does

Plan a running route (a campus track loop, for example), optionally reshape the first and last lap, then export a realistic FIT file with distance, pace, heart rate, cadence, stride length, ground contact time, vertical oscillation and more.

## Route editing

- **Click to add vertices** — the route is joined into a polyline automatically.
- **Undo / redo** — `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`), up to 80 steps. Works for every edit, including dragging, cutting, inserting, panning, clearing and importing.
- **Drag any vertex** — the line and total distance update live; coordinates are clamped to valid ranges.
- **Insert a vertex** — double-click on a line segment.
- **Delete a vertex** — click a vertex to select it, then press `Delete` or use the *Delete vertex* button.
- **Cut between two vertices** — removes the shorter stretch between them, which opens a closed loop into an open path.
- **Pan the whole segment** — press and drag the line.
- **First / last lap** — the drawn main route is a closed loop; the *First lap* and *Last lap* replace the first and last lap. Start from *Copy main route*, cut a gap, drag the ends out (for example to run in from outside the track), then pick which endpoint is the start (or finish) with *Swap start/finish end*.
- **Save / load routes** — export as GeoJSON (`FeatureCollection` with `main` / `start` / `end` segments), import GeoJSON, the legacy `{points:[...]}` shape, or a plain `[[lng,lat],...]` array. Invalid files never touch the current route.

## Laps and junctions

- **Lap count = total laps.** With 4 laps: first lap + main route × 2 + last lap; any segment you disable falls back to the main route.
- With a single lap the first lap is used (otherwise the last lap, otherwise the main route).
- The main loop is **rotated to start at the nearest vertex to the junction**, so the seam does not draw a long straight line across the map.

## Preview

- Entering preview hides the editing overlays: **only the travelled part is drawn**, nothing ahead of the marker.
- The trail is coloured by speed: **slow = red, medium = orange, fast = green**, scaled to this run's own speed range.
- **Preview duration** 3–60 s (default 15 s): the whole activity plays back in that time, with the current multiplier shown; dragging the slider mid-playback takes effect immediately.
- Progress is shown as `42% (9.10 / 21.55 km)`.
- **Exit preview** button or `Esc` returns to editing.

## Activity generation

- **Route offset** 0–12 m: how far the recorded track wanders from the drawn route; 0 = exact.
- Loop or linear mode, resting/max heart rate, body weight, up to 10 exports with different start times and paces.
- Complete running metrics: distance, pace, heart rate, cadence, step length, ground contact time, vertical oscillation, vertical ratio, cumulative cycles.
- Everything is computed in the browser; nothing is uploaded.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Undo | `Ctrl+Z` / `Cmd+Z` |
| Redo | `Ctrl+Y` / `Ctrl+Shift+Z` |
| Delete selected vertex | `Delete` |
| Exit preview | `Esc` |

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

`.nojekyll` is included.

## Desktop version

A Windows desktop build (`fit-tool.exe`) serves the same page locally and generates the FIT file through a local Node process. Both builds share the same `main.js`; only the generation backend differs, and the resulting FIT files are byte-for-byte identical.

## Notes

- Map sources: Tianditu, OpenStreetMap, Google, Tencent. Chinese sources may need your own API key; keys stay in your browser's localStorage.
- Coordinate conversion (GCJ-02 ↔ WGS-84) is applied to both the generated file and the preview drawing.
- FIT files are encoded with Garmin's official `@garmin/fitsdk`.
- Generated data is intended for personal testing and learning. Please respect your school's and platform's rules.
