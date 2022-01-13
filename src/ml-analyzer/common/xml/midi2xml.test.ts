import { midiNoteToXMLNote } from "./midi2xml"

describe("midi2xml", () => {
  describe("midiNoteToXMLNote", () => {
    it("should convert quarternote C4 correctly", () => {
      const midiC4 = {
        duration: 480,
        id: 19,
        noteNumber: 60,
        subtype: "note",
        tick: 1920,
        velocity: 127,
        type: "channel",
      }

      const xmlC4 = {
        duration: 2,
        noteName: "C",
        octave: 4,
        lyric: "",
        type: "quarter",
      }

      // @ts-ignore Some weird type error
      expect(midiNoteToXMLNote(midiC4, "")).toStrictEqual(xmlC4)
    })

    it("should convert halfnote G#2 correctly", () => {
      const midi = {
        duration: 960,
        id: 22,
        noteNumber: 44,
        subtype: "note",
        tick: 0,
        type: "channel",
        velocity: 127,
      }

      const xml = {
        duration: 4,
        noteName: "G#",
        octave: 2,
        lyric: "",
        type: "half",
      }

      // @ts-ignore
      expect(midiNoteToXMLNote(midi, "")).toStrictEqual(xml)
    })
  })

  describe("notesToXMLNotes", () => {})
})
