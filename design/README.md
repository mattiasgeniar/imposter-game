# Design source files

`icon-source.png` is the master 1024×1024 RGBA artwork (a pair of theatre masks on a transparent background) used to derive every PWA / favicon / apple-touch icon shipped under `public/`.

## Regenerating the icons

Requires [ImageMagick](https://imagemagick.org/) (`brew install imagemagick`).

```sh
SRC=design/icon-source.png
TRIMMED=$(mktemp -t imposter-trim).png
magick "$SRC" -trim +repage "$TRIMMED"

# Rounded card variants — favicon-32 + apple-touch + icon-192 + icon-512
for spec in "32:7:29:public/favicon-32.png" \
            "180:39:165:public/apple-touch-icon.png" \
            "192:42:176:public/icon-192.png" \
            "512:112:470:public/icon-512.png"; do
  IFS=: read sz r w out <<<"$spec"
  bg=$(mktemp -t imposter-bg).png
  magick -size ${sz}x${sz} xc:none -fill "#ff5577" \
    -draw "roundrectangle 0,0 $((sz-1)),$((sz-1)) $r,$r" "$bg"
  magick "$bg" \( "$TRIMMED" -resize ${w}x \) -gravity center -composite "$out"
done

# Maskable variant — full-bleed pink, masks tucked inside Android's 80% safe-zone
magick -size 512x512 xc:"#ff5577" \
  \( "$TRIMMED" -resize 380x \) -gravity center -composite \
  public/icon-maskable.png

# Quantize to keep PWA precache slim — gradient PNGs are heavy by default
for f in public/favicon-32.png public/apple-touch-icon.png \
         public/icon-192.png public/icon-512.png public/icon-maskable.png; do
  pngquant --quality=85-95 --skip-if-larger --force --output "$f" "$f"
done
```

The brand pink is `#ff5577`. Corner radius is `14/64` of the canvas edge (matches the original Vite-PWA design).
