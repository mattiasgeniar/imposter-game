type Props = {
  /** 0..100 — height of the fill as a percentage of the container. */
  percent: number
  /** Smoothing for the height update between progress ticks. Default 300ms. */
  transitionMs?: number
}

/**
 * A glass-of-water rising fill: a coloured layer rises from the bottom of its
 * containing element, with two sine-wave SVG paths drifting horizontally in
 * opposite directions for a surface that gently wobbles. The fill height is
 * React-driven (smoothed by a CSS transition); the wave drift is a CSS keyframe
 * loop so it runs at 60fps independent of the React tick.
 *
 * The component is `position: absolute; inset: 0` and ignores pointer events,
 * so any parent `relative` container can drop it in as a background layer.
 */
export function WaveFill({ percent, transitionMs = 300 }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute inset-x-0 bottom-0 ease-linear"
        style={{
          height: `${percent}%`,
          transitionProperty: 'height',
          transitionDuration: `${transitionMs}ms`,
        }}
      >
        {/* Back wave: slower, more transparent, sits a hair lower */}
        <svg
          className="play-wave play-wave--back"
          viewBox="0 0 200 20"
          preserveAspectRatio="none"
        >
          <path
            d="M0 12 Q 25 4, 50 12 T 100 12 T 150 12 T 200 12 V 20 H 0 Z"
            fill="#ff5577"
            fillOpacity="0.25"
          />
        </svg>
        {/* Front wave: faster, denser, slight phase offset */}
        <svg
          className="play-wave play-wave--front"
          viewBox="0 0 200 20"
          preserveAspectRatio="none"
        >
          <path
            d="M0 10 Q 25 18, 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z"
            fill="#ff5577"
            fillOpacity="0.45"
          />
        </svg>
        {/* Body of the fill below the waves */}
        <div className="absolute inset-x-0 top-5 bottom-0 bg-accent/30" />
      </div>
    </div>
  )
}
