// Round-end cue: a short boxing-bell ding-ding that fires once when the
// timer hits zero. The audio element is created lazily and cached so the
// MP3 is fetched (and decoded) at most once per session. Vibration is a
// best-effort companion — Android Chrome supports navigator.vibrate, iOS
// Safari does not, so we feature-detect and silently skip when missing.

let cachedAudio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (!cachedAudio) {
    cachedAudio = new Audio('/sounds/round-end.mp3')
    cachedAudio.preload = 'auto'
  }
  return cachedAudio
}

export function preloadRoundEndCue() {
  if (typeof window === 'undefined') return
  getAudio()
}

export function playRoundEndCue() {
  if (typeof window === 'undefined') return

  const audio = getAudio()
  audio.currentTime = 0
  // Play returns a promise that rejects when autoplay is blocked or the
  // user has the device on silent. Either way there's nothing useful to
  // do — the OS mute switch is the desired behavior.
  void audio.play().catch(() => {})

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([200, 100, 200])
  }
}
