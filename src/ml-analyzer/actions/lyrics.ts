import { LyricsEvent } from "midifile-ts"
import { toTrackEvents } from "../../common/helpers/toTrackEvents"
import track, { NoteEvent, TrackEvent } from "../../common/track"
import { pushHistory } from "../../main/actions/history"
import RootStore from "../../main/stores/RootStore"

interface MetaEvent {
  subtype: string
}

export type TrackLyricsEvent = TrackEvent & LyricsEvent & { noteId: number }

export function isLyricsEvent(event: TrackEvent): event is TrackLyricsEvent {
  return (event as unknown as MetaEvent).subtype === "lyrics"
}

/**
 * Gets or creates a lyrics for the given note in the selected track
 * @param rootStore RootStore
 * @returns
 */
export const getOrAddLyric =
  (rootStore: RootStore) =>
  (note: NoteEvent, defaultLyrics = ""): TrackLyricsEvent => {
    const selectedTrack = rootStore.song.selectedTrack!

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

export const findMatchingLyrics = (
  lyricEvents: TrackLyricsEvent[],
  note: NoteEvent
): TrackLyricsEvent => {
  const lyric = lyricEvents.find((e) => e.noteId === note.id)

  if (lyric) {
    lyric.tick = note.tick

    return lyric
  }

  return {} as unknown as TrackLyricsEvent
}

export const setLyric =
  (rootStore: RootStore) => (noteId: number, lyric: string) => {
    const selectedTrack = rootStore.song.selectedTrack!

    const lyricEvent = selectedTrack.events
      .filter(isLyricsEvent)
      .find((lyricE) => lyricE.noteId === noteId)

    if (lyricEvent) {
      pushHistory(rootStore)()
      selectedTrack.transaction(t => {
        t.removeEvent(lyricEvent.id)

        const newLyric = {...lyricEvent, text: lyric}
        t.addEvent(newLyric)
      })
    } else console.warn("actions/lyrics: Lyric event not found")
  }

export const clearDanglingLyrics = (rootStore: RootStore) => () => {
  const selectedTrack = rootStore.song.selectedTrack!

  const lyricEvents = selectedTrack.events.filter(isLyricsEvent)

  for (const event of lyricEvents) {
    if (!selectedTrack.events.find((e) => e.id === event.noteId)) {
      selectedTrack.removeEvent(event.id)
    }
  }
}
