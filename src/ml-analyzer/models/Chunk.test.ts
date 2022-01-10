import { NoteEvent } from "../../common/track"
import Chunk from "./Chunk"

let id = 0

function createNote(tick: number, duration: number, num: number): NoteEvent {
  return {
    id: id++,
    tick: tick,
    type: "channel",
    subtype: "note",
    duration: duration,
    noteNumber: num,
    velocity: 127,
  }
}

describe("Chunk", () => {
  describe("splitMidi", () => {
    it("should split midi by gaps", () => {
      const notes: NoteEvent[] = [
        createNote(0, 10, 0),
        createNote(10, 10, 0),
        createNote(20, 10, 0),
        createNote(50, 10, 0),
        createNote(150, 10, 0),
      ]

      let chunks = Chunk.splitNotes(notes)
      expect(chunks).toHaveLength(3)
    })

    it("should merge overlapping notes", () => {
      const notes: NoteEvent[] = [
        createNote(0, 100, 0),
        createNote(10, 10, 0),
        createNote(20, 10, 0),
        createNote(50, 10, 0),
      ]

      let chunks = Chunk.splitNotes(notes)
      expect(chunks).toHaveLength(1)
    })

    it("should apply minimum rest length", () => {
      const notes: NoteEvent[] = [
        createNote(0, 10, 0),
        createNote(10, 10, 0),
        createNote(20, 10, 0),
        createNote(40, 10, 0),
        createNote(150, 10, 0),
      ]

      let chunks = Chunk.splitNotes(notes, 20)
      expect(chunks).toHaveLength(2)
    })
  })
})
