// Extension of src/common/midi/midiConversion.ts

import { AnyEvent, write as writeMidiFile } from "midifile-ts"
import { toJS } from "mobx"
import { toRawEvents } from "../../../common/helpers/toRawEvents"
import Track, { TrackEvent } from "../../../common/track"
import RootStore from "../../../main/stores/RootStore"

const setChannel =
  (channel: number) =>
    (e: AnyEvent): AnyEvent => {
      if (e.type === "channel") {
        return { ...e, channel }
      }
      return e
    }

// Signal-ML
export function tracksToMidi(tracks: Track[], timebase: number) {
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
  conductorTrack: Track,
  noteEvents: TrackEvent[],
  timebase: number,
  channel = 0
) {
  const rawEvents = toRawEvents(noteEvents).map(setChannel(channel))

  for (let i = 0; i < rawEvents.length; i++) {
    setChannel(0)(rawEvents[i])
  }

  return writeMidiFile([toRawEvents(conductorTrack.events), rawEvents], timebase)
}

export const chunkToMidi = (rootStore: RootStore) => (trackId: number, startTick: number, endTick: number): Uint8Array => {
  const track = toJS(rootStore.song.tracks[trackId])

  if (track === undefined) {
    alert("Convert error!")

    return new Uint8Array()
  }


  const rawTracks = [track].map((t) => {
    const events = t.events.map(e => ({ ...e })).filter((e: TrackEvent) => {
      if (e.type === "channel" && e.subtype === "note") {
        if (e.tick >= startTick && e.tick + e.duration <= endTick) {
          e.tick -= startTick
          return true
        } else {
          return false
        }
      } else if ((e.type === "channel") || (e.type === "meta" && e.subtype === "lyrics")) {
        if (e.tick >= startTick && e.tick <= endTick) {
          e.tick -= startTick

          return true
        } else {
          return false
        }
      }

      return true
    })

    const rawEvents = toRawEvents(events)

    if (t.channel !== undefined) {
      return rawEvents.map(setChannel(t.channel))
    }

    return rawEvents
  })

  return writeMidiFile(rawTracks, rootStore.song.timebase)

}