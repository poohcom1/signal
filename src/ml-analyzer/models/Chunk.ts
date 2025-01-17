import { clone } from "lodash"
import { makeObservable, observable } from "mobx"
import { NoteEvent, TrackEvent } from "../../../src/common/track"
import { isNoteEvent } from "../../common/track/identify"
import RootStore from "../../main/stores/RootStore"
import { isLyricsEvent } from "../actions/lyrics"
import { convertMidi } from "../adapters/adapter"
import { chunkToMidi } from "../common/midi/customMidiConversion"
import MLTrack from "./MLTrack"

export enum FetchState {
  UnFetched,
  Prefetch,
  Fetching,
  Fetched,
  Error,
  NeedData,
}

export default class Chunk {
  public trackId: number = 0

  public notes: NoteEvent[] = []
  public meta: TrackEvent[] = []
  public startTick: number = -1
  public duration: number = -1
  public audioSrc: string = ""
  public state: FetchState = FetchState.UnFetched

  private _mlTrack: MLTrack
  private _audio: HTMLAudioElement
  private _velocityCache: number[] = []
  private _convertTimeout: NodeJS.Timeout | null = null
  private _playTimeout: NodeJS.Timeout | null = null
  private _fetchController = new AbortController()
  private _error: Error | null = null

  private _retries = 0
  private readonly MAX_RETRIES = 1

  get endTick(): number {
    return this.startTick + this.duration
  }

  constructor(
    notes: NoteEvent[],
    meta: TrackEvent[],
    track: MLTrack,
    audio: HTMLAudioElement | undefined = undefined
  ) {
    this._mlTrack = track

    // Conditionally set to allow testing without DOM
    if (audio) {
      this._audio = audio
    } else {
      this._audio = new Audio()
    }

    let endTick = 0

    notes.sort((a, b) => a.tick - b.tick)

    for (let i = 0; i < notes.length; i++) {
      this.notes.push(clone(notes[i]))
    }

    this.startTick = this.notes[0].tick
    endTick =
      this.notes[this.notes.length - 1].duration +
      this.notes[this.notes.length - 1].tick

    for (let i = 0; i < notes.length; i++) {
      this.notes[i].tick -= this.startTick
    }

    this.duration = endTick - this.startTick

    this.meta = meta.filter(
      (e) => e.tick >= this.startTick && e.tick <= this.endTick
    )

    makeObservable(this, {
      startTick: observable,
      duration: observable,
      audioSrc: observable,
      state: observable,
    })
  }

  private convertPrecheck(rootStore: RootStore) {
    const track = rootStore.song.getTrack(this._mlTrack.trackId)

    if (track && this._mlTrack.hasMidiParam("lyrics")) {
      const lyrics = track.events
        .filter(isLyricsEvent)
        .filter((e) => e.tick >= this.startTick && e.tick <= this.endTick)

      if (lyrics.length === 0) {
        return true
      }

      if (lyrics.map((l) => l.text).includes("")) {
        return true
      }
    }

    return false
  }

  // Methods
  public delayedConvert(
    rootStore: RootStore,
    onUpdate: (state: FetchState) => void = () => {},
    timeout: number = 3000
  ) {
    this._fetchController = new AbortController()

    if (this._convertTimeout) {
      clearTimeout(this._convertTimeout)
    }

    if (this.audioSrc !== "") {
      URL.revokeObjectURL(this.audioSrc)
      this.audioSrc = ""
    }

    // Pre checks
    if (this.convertPrecheck(rootStore)) {
      this.state = FetchState.NeedData
      return
    }

    // Start timeout
    this.state = FetchState.Prefetch

    this._convertTimeout = setTimeout(() => {
      this.convertMidiToAudio(rootStore, onUpdate)
    }, timeout)
  }

  private convertMidiToAudio(
    rootStore: RootStore,
    onUpdate: (state: FetchState) => void = () => {}
  ) {
    if (this.convertPrecheck(rootStore)) {
      this.state = FetchState.NeedData
      onUpdate(this.state)
      return
    }

    if (this.state !== FetchState.Fetching && this.audioSrc === "") {
      this._error = null

      this.state = FetchState.Fetching
      onUpdate(this.state)

      const bytes = chunkToMidi(rootStore)(
        this._mlTrack.trackId,
        this.startTick,
        this.endTick,
        this._mlTrack.modelManifest
      )
      const blob = new Blob([bytes], { type: "application/octet-stream" })

      const { signal } = this._fetchController

      convertMidi(
        blob,
        rootStore.pianoRollStore.currentTempo ?? 120,
        signal,
        this._mlTrack.model,
        this._mlTrack.modelOptions
      )
        .then((res) => {
          if (res.ok) {
            return res.blob()
          } else {
            throw new Error("Server error")
          }
        })
        .then((blob) => {
          this.audioSrc = URL.createObjectURL(blob)
          this._audio.src = this.audioSrc
          this.state = FetchState.Fetched
          onUpdate(this.state)
        })
        .catch((error: Error) => {
          if (error.name === "AbortError") return

          this.state = FetchState.Error
          onUpdate(this.state)
          this._error = error
          console.error("Error ", this._error)

          if (this._retries++ < this.MAX_RETRIES)
            setTimeout(
              () => this.delayedConvert(rootStore, onUpdate, 100),
              1000
            )
        })
    }
  }

  public play(
    position: number,
    bpm: number,
    tickToMillisec: CallableFunction
  ): NoteEvent[] {
    if (this.audioSrc) {
      if (this._playTimeout) clearTimeout(this._playTimeout)
      if (
        position >= this.startTick &&
        position <= this.startTick + this.duration
      ) {
        this.cacheVelocity()

        const seconds =
          tickToMillisec(position) / 1000 -
          tickToMillisec(this.startTick) / 1000

        this._playAudio(bpm, seconds)
      } else if (position < this.startTick) {
        const delayMs = tickToMillisec(this.startTick - position)

        this._playTimeout = setTimeout(() => this._playAudio(bpm), delayMs)
      }

      return this.notes
    }

    return []
  }

  private _playAudio(bpm: number, time: number = 0) {
    let offset = 0

    if ("trimStart" in this._mlTrack.modelManifest) {
      offset = (60 / bpm) * this._mlTrack.modelManifest.trimStart
    }

    this._audio.src = this.audioSrc
    this._audio.currentTime = time + offset
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

  public hash() {
    return (
      JSON.stringify(
        this.notes.map((note) => [note.tick, note.noteNumber, note.duration])
      ) + JSON.stringify(this.meta)
    )
  }

  /**
   * Aborts pending fetch and free whatever is required
   */
  public destroy() {
    this.reapplyVelocity()
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
    maxNotes: number = 6
  ): NoteEvent[][] {
    // Filter out non-note events
    const noteEvents: NoteEvent[] = allEvents.filter(isNoteEvent)
    const noteChunks: NoteEvent[][] = []

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

      noteChunks.push(notes)
    }

    return noteChunks
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
      const hash = newChunks[i].hash()

      if (chunkHash.has(hash)) {
        const commonChunk = chunkHash.get(hash)

        if (commonChunk) {
          // Copy everything except start time (to allow moving)
          const start = newChunks[i].startTick

          newChunks[i] = commonChunk // Copy chunk
          newChunks[i].startTick = start // Override start

          chunkHash.delete(hash)
        }
      }
    }

    // Delete remaining chunks
    chunkHash.forEach((chunk, _id) => chunk.destroy())

    return newChunks
  }
}
