import Track from "../../common/track/Track"
import { trackToMidi } from "../common/midi/customMidiConversion"

const BACKEND_URL = "http://localhost:5000" // "http://192.168.1.40:5000"

export function convertTrack(
  track: Track,
  timebase: number
): Promise<Response> {
  const bytes = trackToMidi(track, timebase)
  const blob = new Blob([bytes], { type: "application/octet-stream" })

  let formData = new FormData()
  formData.append("midi", blob)

  return fetch(`${process.env.REACT_APP_ML_BACKEND_URL}/convert`, {
    method: "POST",
    body: formData,
    //mode: "no-cors",
  })
}

export function convertMidi(
  bytes: Uint8Array,
  signal: AbortSignal
): Promise<Response> {
  const blob = new Blob([bytes], { type: "application/octet-stream" })

  let formData = new FormData()
  formData.append("midi", blob)

  return fetch(`${BACKEND_URL}/convert`, {
    method: "POST",
    body: formData,
    signal: signal,
    //mode: "no-cors",
  })
}

export function getModels(): Promise<Response> {
  return fetch(`${BACKEND_URL}/models`, { method: "GET" })
}
