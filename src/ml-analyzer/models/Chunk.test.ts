import { clone } from "lodash"
import { NoteEvent } from "../../common/track"
import Chunk from "./Chunk"

const QUARTER = 480
const HALF = 960
const WHOLE = 960 * 2
let id = 0

function note(tick: number, duration: number, num: number): NoteEvent {
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

/**
 * Use this to bypass error when trying to use the Audio DOM constructor within Chunk
 * @param notes
 * @returns
 */
function chunk(notes: NoteEvent[]): Chunk {
  // @ts-ignore
  return new Chunk(notes, {})
}

function simpleChunk(
  start: number,
  count: number,
  len: number,
  num: number
): Chunk {
  const notes = []

  for (let i = 0; i < count; i++) {
    notes.push(note(start, len, num))

    start += len
  }

  return chunk(notes)
}

describe("Chunk", () => {
  describe("splitMidi", () => {
    it("should split midi by gaps", () => {
      const notes: NoteEvent[] = [
        note(0, 10, 0),
        note(10, 10, 0),
        note(20, 10, 0),
        note(50, 10, 0),
        note(150, 10, 0),
      ]

      let chunks = Chunk.splitNotes(notes)
      expect(chunks).toHaveLength(3)
    })

    it("should merge overlapping notes", () => {
      const notes: NoteEvent[] = [
        note(0, 100, 0),
        note(10, 10, 0),
        note(20, 10, 0),
        note(50, 10, 0),
      ]

      let chunks = Chunk.splitNotes(notes)
      expect(chunks).toHaveLength(1)
    })

    it("should apply minimum rest length", () => {
      const notes: NoteEvent[] = [
        note(0, 10, 0),
        note(10, 10, 0),
        note(20, 10, 0),
        note(40, 10, 0),
        note(150, 10, 0),
      ]

      let chunks = Chunk.splitNotes(notes, 20)
      expect(chunks).toHaveLength(2)
    })
  })

  describe("replaceChunk", () => {
    beforeAll(() => {
      jest.mock("./Chunk")
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("should replace nothing on identical chunks groups", () => {
      const chunk1 = simpleChunk(0, 5, 10, 10)
      const chunk2 = simpleChunk(60, 5, 10, 60)

      const chunk3 = clone(chunk1)
      const chunk4 = clone(chunk2)

      const newChunks = Chunk.replaceChunks([chunk1, chunk2], [chunk3, chunk4])

      expect(newChunks).toStrictEqual([chunk1, chunk2])
    })

    it("should keep unchanged chunks", () => {
      const chunk1 = simpleChunk(0, 5, 10, 10)
      const chunk2 = simpleChunk(60, 5, 10, 60)

      const chunk3 = clone(chunk1)
      const chunk4 = simpleChunk(60, 5, 10, 50)

      const newChunks = Chunk.replaceChunks([chunk1, chunk2], [chunk3, chunk4])

      expect(chunk1).toStrictEqual(newChunks[0])
    })

    it("should copy chunks that are moved", () => {
      const chunk1 = simpleChunk(0, 5, 10, 10)
      const chunk2 = simpleChunk(70, 5, 10, 60)

      const chunk3 = simpleChunk(5, 5, 10, 10)
      const chunk4 = simpleChunk(70, 5, 10, 50)

      const newChunks = Chunk.replaceChunks([chunk1, chunk2], [chunk3, chunk4])

      expect(chunk1.notes).toStrictEqual(newChunks[0].notes)
    })

    it("should do nothing on new separate note added", () => {
      const note1 = note(0, QUARTER, 60)
      const note2 = note(HALF, QUARTER, 61)
      const note3 = note(WHOLE, QUARTER, 60)

      const note4 = note(WHOLE + HALF, QUARTER, 61)

      const chunks1 = [chunk([note1]), chunk([note2]), chunk([note3])]
      const chunks2 = [
        chunk([note1]),
        chunk([note2]),
        chunk([note3]),
        chunk([note4]),
      ]

      const newChunks = Chunk.replaceChunks(chunks1, chunks2)

      expect(chunks1[0].endTick).toStrictEqual(newChunks[0].endTick)
    })
  })
})
