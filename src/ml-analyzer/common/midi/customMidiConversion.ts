// Extension of src/common/midi/midiConversion.ts

import { AnyEvent, write as writeMidiFile } from "midifile-ts"
import { toRawEvents } from "../../../common/helpers/toRawEvents"
import Track, { TrackEvent } from "../../../common/track"

const setChannel =
  (channel: number) =>
  (e: AnyEvent): AnyEvent => {
    if (e.type === "channel") {
      return { ...e, channel }
    }
    return e
  }

// Signal-ML
export function trackToMidi(track: Track, timebase: number) {
  const tracks = [track]

  const rawTracks = tracks.map((t) => {
    const rawEvents = toRawEvents(t.events)
    if (t.channel !== undefined) {
      return rawEvents.map(setChannel(t.channel))
    }
    return rawEvents
  })

  return writeMidiFile(rawTracks, timebase)
}

export function eventsToMidi(
  noteEvents: TrackEvent[],
  timebase: number,
  channel = 0
) {
  const rawEvents = toRawEvents(noteEvents).map(setChannel(channel))

  for (let i = 0; i < rawEvents.length; i++) {}

  return writeMidiFile([rawEvents], timebase)
}
