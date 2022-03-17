declare module "*.png"
declare module "*.svg"

interface Window {
  webkitAudioContext: typeof AudioContext
}

interface Result<T> {
  data: T,
  error: string | null
}