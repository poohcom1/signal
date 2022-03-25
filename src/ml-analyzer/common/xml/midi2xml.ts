import { isNoteEvent, NoteEvent } from "../../../../src/common/track"
import { downloadBlob } from "../../../common/helpers/Downloader"
import RootStore from "../../../main/stores/RootStore"
import { getOrAddLyric, isLyricsEvent } from "../../actions/lyrics"
import {
  createTemplate,
  MusicXMLNote,
  Note,
  NoteLength,
  RestNote
} from "./XMLTemplate"

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]

const NoteLengthMap: { [key: number]: NoteLength } = {
  0.00390625: NoteLength.NOTE_TYPE_1024TH,
  0.0078125: NoteLength.NOTE_TYPE_512TH,
  0.015625: NoteLength.NOTE_TYPE_256TH,
  0.03125: NoteLength.NOTE_TYPE_128TH,
  0.0625: NoteLength.NOTE_TYPE_64TH,
  0.125: NoteLength.NOTE_TYPE_32ND,
  0.25: NoteLength.NOTE_TYPE_16TH,
  0.5: NoteLength.NOTE_TYPE_EIGHTH,
  1: NoteLength.NOTE_TYPE_QUARTER,
  2: NoteLength.NOTE_TYPE_HALF,
  4: NoteLength.NOTE_TYPE_WHOLE,
  8: NoteLength.NOTE_TYPE_BREVE,
  16: NoteLength.NOTE_TYPE_LONG,
  32: NoteLength.NOTE_TYPE_MAXIMA,
}

export function midiNoteToXMLNote(
  noteEvent: NoteEvent,
  lyric: string,
  timebase = 480
): Note {
  noteEvent.type

  const octave = Math.floor(noteEvent.noteNumber / 12) - 1
  const noteName = `${NOTE_NAMES[noteEvent.noteNumber % 12]}`
  const duration = noteEvent.duration / timebase

  const type = NoteLengthMap[duration]

  if (!type) {
    console.error("Invalid note length")
  }

  return {
    noteName,
    octave,
    lyric,
    type,
    duration: duration * 2,
  }
}

function createXMLRest(noteDuration: number, timebase = 480): RestNote {
  const duration = noteDuration / timebase
  const type = NoteLengthMap[duration]

  if (!type) {
    console.error("Invalid note length")
  }

  return {
    type,
    duration: duration * 2,
  }
}

/**
 *
 * @param notes Zero'd positioned notes
 * @param lyrics Array of lyrics for each note
 */
export function notesToXMLNotes(
  notes: NoteEvent[],
  lyrics: string[]
): MusicXMLNote[] {
  const xmlNotes: MusicXMLNote[] = []

  let previousTickEnd = 0

  for (let i = 0; i < notes.length; i++) {
    if (notes[i].tick - previousTickEnd > 0) {
      const rest = createXMLRest(notes[i].tick - previousTickEnd)

      xmlNotes.push(rest)
    }

    const note = midiNoteToXMLNote(notes[i], lyrics[i])

    xmlNotes.push(note)

    previousTickEnd = notes[i].tick + notes[i].duration
  }

  return xmlNotes
}

export function notesToXML(
  noteEvents: NoteEvent[],
  lyrics: string[],
  tempo: number
) {
  const notes = notesToXMLNotes(noteEvents, lyrics)

  return createTemplate(
    [
      {
        notes,
        bpm: tempo,
      },
    ],
    tempo
  )
}

export const downloadSelectedTrackXML = (rootStore: RootStore) => () => {
  const selectedTrack = rootStore.song.selectedTrack

  if (!selectedTrack) {
    alert("No track selected!")
    return
  }

  const notes = selectedTrack.events.filter(isNoteEvent)

  console.log(selectedTrack.events.filter(isLyricsEvent))

  const lyrics = notes.map((note) => getOrAddLyric(rootStore)(note)!.text)

  const xml = notesToXML(notes, lyrics, rootStore.pianoRollStore.currentTempo!)

  downloadBlob(new Blob([xml], { type: "text/plain" }), "notes.musicxml")
}
