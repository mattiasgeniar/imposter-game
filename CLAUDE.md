# Project notes

## PWA icon centering

The theatre-masks artwork in `design/icon-source.png` has long ribbons trailing well below the masks themselves. Its alpha bounding box is therefore tall and bottom-heavy, while the masks (the visual focal point) sit above bbox center.

**Don't use `-gravity center` against the trimmed bbox** — that puts the masks too high and the ribbons clustered at the bottom (the "icon not centered" complaint).

Center by **alpha centroid** instead: ImageMagick's `-define identify:moments=true` reports the centroid; for the current source it's at `(456.6, 234.5)` in the 914×690 trimmed image (≈110px above bbox center). The recipe in `design/README.md` computes per-card composite offsets so the centroid lands at each card's geometric center.

If the source artwork is ever swapped, recompute centroids; don't carry the old offsets over.
