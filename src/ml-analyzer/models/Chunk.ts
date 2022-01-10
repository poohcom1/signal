import { clone } from "lodash"
import { computed, makeObservable, observable } from "mobx"
import { NoteEvent, TrackEvent } from "../../../src/common/track"
import { isNoteEvent } from "../../common/track/identify"
import { eventsToMidi } from "../common/midi/customMidiConversion"
import { convertMidi } from "../controllers/controller"

export enum FetchState {
  UnFetched,
  Fetching,
  Fetched,
  Error,
}

export default class Chunk {
  public notes: NoteEvent[] = []
  public startTick: number = -1
  public endTick: number = -1
  public audioSrc: string = ""

  private _audio: HTMLAudioElement = new Audio()
  private _velocityCache: number[] = []
  private _playTimeout: NodeJS.Timeout | null = null
  private _fetching: boolean = false
  private _fetchController = new AbortController()
  private _error: Error | null = null

  constructor(notes: NoteEvent[]) {
    if (notes) {
      notes.sort((a, b) => a.tick - b.tick)

      for (let i = 0; i < notes.length; i++) {
        this.notes.push(clone(notes[i]))
      }

      this.startTick = this.notes[0].tick
      this.endTick =
        this.notes[this.notes.length - 1].duration +
        this.notes[this.notes.length - 1].tick

      for (let i = 0; i < notes.length; i++) {
        this.notes[i].tick -= this.startTick
      }
    }

    makeObservable(this, {
      startTick: observable,
      endTick: observable,
      audioSrc: observable,
      state: computed,
    })
  }

  get loaded() {
    return this.audioSrc !== ""
  }

  get state(): FetchState {
    if (this.audioSrc !== "") {
      return FetchState.Fetched
    } else if (this._fetching) {
      return FetchState.Fetching
    } else if (this._error) {
      return FetchState.Error
    } else {
      return FetchState.UnFetched
    }
  }

  public get tick() {
    return this.startTick
  }

  // Methods
  public convertMidiToAudio(
    timebase: number,
    onUpdate: (state: FetchState) => void = () => {}
  ) {
    if (!this._fetching && this.audioSrc === "") {
      this._fetching = true
      this._error = null

      onUpdate(FetchState.Fetching)

      const bytes = eventsToMidi(this.notes, timebase)

      const { signal } = this._fetchController

      convertMidi(bytes, signal)
        .then((res) => res.blob())
        .then((blob) => {
          this.audioSrc = URL.createObjectURL(blob)
          this._audio.src = this.audioSrc
          onUpdate(FetchState.Fetched)
        })
        .catch((error: Error) => {
          if (error.name === "AbortError") return

          onUpdate(FetchState.Error)
          this._error = error
          console.log("Error ", error)
        })
        .finally(() => {
          this._fetching = false
        })
    }
  }

  public playFromStart(delaySeconds = 0) {
    if (this.audioSrc) {
      this._audio.src = this.audioSrc

      this._audio.play().then().catch(console.log)
    }
  }

  public play(position: number, tickToMillisec: CallableFunction) {
    if (this.audioSrc) {
      if (position >= this.startTick && position <= this.endTick) {
        this.cacheVelocity()

        const seconds =
          tickToMillisec(position) / 1000 -
          tickToMillisec(this.startTick) / 1000

        this.playAudio(seconds)
      } else if (position < this.startTick) {
        const delayMs = tickToMillisec(this.startTick - position)

        this._playTimeout = setTimeout(() => this.playAudio(), delayMs)
      }
    }
  }

  private playAudio(time: number = 0) {
    this._audio.src = this.audioSrc
    this._audio.currentTime = time
    this._audio.play().then().catch(console.log)
  }

  public stop() {
    if (this._audio.src) {
      this._audio.pause()
      this.reapplyVelocity()
    }

    if (this._playTimeout) {
      clearTimeout(this._playTimeout)
    }
  }

  public setVolume(midiVolume: number) {
    this._audio.volume = midiVolume / 127
  }

  private cacheVelocity() {
    for (let i = 0; i < this.notes.length; i++) {
      this._velocityCache.push(this.notes[i].velocity)
      this.notes[i].velocity = 0
    }
  }

  private reapplyVelocity() {
    for (let i = 0; i < this.notes.length; i++) {
      this.notes[i].velocity = this._velocityCache[i]
    }
  }

  private hash() {
    return JSON.stringify(this.notes)
  }

  private destroy() {
    if (this.audioSrc !== "") URL.revokeObjectURL(this.audioSrc)

    this._fetchController.abort()
  }

  // Generators

  /**
   *
   * @param allEvents All track events
   * @param minRest Min amount of rest time between chunks in ticks
   * @param minNotes Minimum amount of notes in a chunk
   * @param maxNotes Max amount of notes in a chunk
   */
  static splitNotes(
    allEvents: TrackEvent[],
    minRest: number = 0,
    minNotes: number = 1,
    maxNotes: number = 30
  ): NoteEvent[][] {
    // Filter out non-note events

    const noteEvents: NoteEvent[] = allEvents.filter(isNoteEvent)
    const chunks: NoteEvent[][] = []

    // Index for noteEvents
    let ind = 0

    // Loop through all of noteEvents
    while (ind < noteEvents.length) {
      // Current chunk
      const notes = []

      for (let i = 0; i <= maxNotes; i++) {
        // Add note
        const note = noteEvents[ind++]
        notes.push(note)

        // Check overlaps (ignores max note to prevent note split)
        const noteEnd = note.tick + note.duration

        while (
          ind < noteEvents.length &&
          noteEvents[ind].tick + noteEvents[ind].duration < noteEnd
        ) {
          notes.push(noteEvents[ind++])
        }

        // Check if notes all out
        if (ind >= noteEvents.length) break

        // Check for rest until next note
        if (noteEvents[ind].tick - noteEnd > minRest && i + 1 >= minNotes) break
      }

      chunks.push(notes)
    }

    return chunks
  }

  /**
   * Compare the new chunk to the old chunk
   * @param oldChunks Old chunks
   * @param newChunks New chunks
   * @returns
   */
  static replaceChunks(oldChunks: Chunk[], newChunks: Chunk[]): Chunk[] {
    const chunkHash: Map<string, Chunk> = new Map()

    for (const chunk of oldChunks) {
      chunkHash.set(chunk.hash(), chunk)
    }

    for (let i = 0; i < newChunks.length; i++) {
      if (chunkHash.has(newChunks[i].hash())) {
        const commonChunk = chunkHash.get(newChunks[i].hash())

        if (commonChunk) {
          newChunks[i] = commonChunk

          chunkHash.delete(newChunks[i].hash())
        }
      }
    }

    chunkHash.forEach((chunk, _id) => chunk.destroy())

    return newChunks
  }
}
