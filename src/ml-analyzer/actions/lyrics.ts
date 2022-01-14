import { LyricsEvent } from "midifile-ts"
import { toTrackEvents } from "../../common/helpers/toTrackEvents"
import { NoteEvent, TrackEvent } from "../../common/track"
import RootStore from "../../main/stores/RootStore"

interface MetaEvent {
  subtype: string
}

export type TrackLyricsEvent = TrackEvent & LyricsEvent & { noteId: number }

export function isLyricsEvent(event: TrackEvent): event is TrackLyricsEvent {
  return (event as unknown as MetaEvent).subtype === "lyrics"
}

export const getOrAddLyric =
  (rootStore: RootStore) =>
  (note: NoteEvent, defaultLyrics = "_"): TrackLyricsEvent | void => {
    const selectedTrack = rootStore.song.selectedTrack

    if (!selectedTrack) return

    const lyricEvents = selectedTrack.events.filter(isLyricsEvent)

    const lyric = lyricEvents.find((e) => e.noteId === note.id)

    if (lyric) {
      lyric.tick = note.tick

      return lyric
    } else {
      const lyricEvent: LyricsEvent = {
        type: "meta",
        subtype: "lyrics",
        text: defaultLyrics,
        deltaTime: note.tick,
      }

      const trackLyricEvent = toTrackEvents([lyricEvent])[0]

      ;(trackLyricEvent as unknown as TrackLyricsEvent).noteId = note.id

      selectedTrack.addEvents([trackLyricEvent])

      return trackLyricEvent as unknown as TrackLyricsEvent
    }
  }

export const setLyric =
  (rootStore: RootStore) => (noteId: number, lyric: string) => {
    const selectedTrack = rootStore.song.selectedTrack

    if (!selectedTrack) return

    const lyricEvent = selectedTrack.events
      .filter(isLyricsEvent)
      .find((lyricE) => lyricE.noteId === noteId)

    if (lyricEvent) lyricEvent.text = lyric
    else console.warn("actions/lyrics: Lyric event not found")
  }
