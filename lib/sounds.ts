// Sound effects for the poker game

// Create an audio context when needed (to avoid autoplay restrictions)
let audioContext: AudioContext | null = null

// Cache for loaded sounds
const soundCache = new Map<string, AudioBuffer>()

// Sound file paths
const SOUND_FILES = {
  CARD_DEAL: "/sounds/card-deal.mp3",
  CARD_FLIP: "/sounds/card-flip.mp3",
  CHIP_BET: "/sounds/chip-bet.mp3",
  CHIP_STACK: "/sounds/chip-stack.mp3",
  FOLD: "/sounds/fold.mp3",
  CHECK: "/sounds/check.mp3",
  CALL: "/sounds/call.mp3",
  BET: "/sounds/bet.mp3",
  RAISE: "/sounds/raise.mp3",
  ALL_IN: "/sounds/all-in.mp3",
  WIN: "/sounds/win.mp3",
  LOSE: "/sounds/lose.mp3",
  NOTIFICATION: "/sounds/notification.mp3",
  TIMER: "/sounds/timer.mp3",
}

// Initialize audio context (must be called after user interaction)
export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Preload common sounds
    preloadSounds([SOUND_FILES.CARD_DEAL, SOUND_FILES.CHIP_BET, SOUND_FILES.CHECK, SOUND_FILES.CALL])
  }
  return audioContext
}

// Preload sounds to avoid delay when playing
export async function preloadSounds(soundUrls: string[]) {
  if (!audioContext) return

  for (const url of soundUrls) {
    if (!soundCache.has(url)) {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        soundCache.set(url, audioBuffer)
      } catch (error) {
        console.error(`Failed to load sound: ${url}`, error)
      }
    }
  }
}

// Play a sound with volume control
export function playSound(soundName: keyof typeof SOUND_FILES, volume = 1.0) {
  if (!audioContext) {
    initAudio()
  }

  if (!audioContext) return // Still null (autoplay restrictions)

  const soundUrl = SOUND_FILES[soundName]

  // If sound is already cached, play it
  if (soundCache.has(soundUrl)) {
    playBuffer(soundCache.get(soundUrl)!, volume)
    return
  }

  // Otherwise load and play
  fetch(soundUrl)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext!.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      soundCache.set(soundUrl, audioBuffer)
      playBuffer(audioBuffer, volume)
    })
    .catch((error) => {
      console.error(`Failed to load sound: ${soundUrl}`, error)
    })
}

// Helper to play an audio buffer
function playBuffer(buffer: AudioBuffer, volume: number) {
  if (!audioContext) return

  const source = audioContext.createBufferSource()
  source.buffer = buffer

  // Create a gain node for volume control
  const gainNode = audioContext.createGain()
  gainNode.gain.value = volume

  // Connect nodes
  source.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Play the sound
  source.start(0)
}

// Play sound for specific poker actions
export function playActionSound(action: string, amount?: number) {
  switch (action) {
    case "fold":
      playSound("FOLD", 0.7)
      break
    case "check":
      playSound("CHECK", 0.7)
      break
    case "call":
      playSound("CALL", 0.8)
      break
    case "bet":
      playSound("BET", 0.8)
      break
    case "raise":
      playSound("RAISE", 0.9)
      break
    case "all-in":
      playSound("ALL_IN", 1.0)
      break
    default:
      break
  }
}

// Play card sounds
export function playCardSound(type: "deal" | "flip") {
  if (type === "deal") {
    playSound("CARD_DEAL", 0.6)
  } else {
    playSound("CARD_FLIP", 0.7)
  }
}

// Play chip sounds
export function playChipSound(type: "bet" | "stack") {
  if (type === "bet") {
    playSound("CHIP_BET", 0.7)
  } else {
    playSound("CHIP_STACK", 0.8)
  }
}

// Play win/lose sounds
export function playResultSound(isWin: boolean) {
  if (isWin) {
    playSound("WIN", 1.0)
  } else {
    playSound("LOSE", 0.7)
  }
}

// Play timer warning sound
export function playTimerWarning() {
  playSound("TIMER", 0.5)
}

// Play notification sound
export function playNotification() {
  playSound("NOTIFICATION", 0.6)
}

// Mute/unmute all sounds
let isMuted = false

export function toggleMute() {
  isMuted = !isMuted
  return isMuted
}

export function isSoundMuted() {
  return isMuted
}

