import _ from "lodash"
import { IReactionDisposer, makeObservable, observable, reaction } from "mobx"
import { isNoteEvent, NoteEvent } from "../../common/track"
import { isLyricsEvent } from "../actions/lyrics"
import MLRootStore from "../stores/MLRootStore"
import Chunk, { FetchState } from "./Chunk"

export default class MLTrack {
  public disposer: IReactionDisposer
  public chunks: Chunk[] = []

  public noteCache: NoteEvent[] = []

  // ML Data
  public model: string = ""
  public modelManifest: Record<string, any> = {}
  public modelOptions: Record<string, string | boolean | number> = {}

  public trackId

  constructor(rootStore: MLRootStore, trackId: number, delayMS = 2000) {
    this.trackId = trackId

    this.disposer = reaction(
      // Track events
      () => {
        if (this.trackId < rootStore.song.tracks.length)
          return rootStore.song.tracks[this.trackId]?.events
        else return null
      },
      // Sideeffect: Generate new chunks on new note
      // Could be better optimized if changed note is known
      (events) => {
        if (!events) {
          return
        }

        // Get track wrapper
        const mlTrack = rootStore.mlTrackStore.get(this.trackId)!

        const noteEvents = events.filter(isNoteEvent)

        const newEvents = noteEvents.filter(
          (e1) => !mlTrack.noteCache.find((e2) => _.isEqual(e1, e2))
        )

        const eventsToDelete: number[] = []

        for (const event of newEvents) {
          const noteStart = event.tick
          const noteEnd = event.tick + event.duration

          for (const other of noteEvents) {
            if (other.id === event.id) continue

            const otherStart = other.tick
            const otherEnd = other.tick + other.duration

            if (noteStart > otherStart && noteStart < otherEnd) {
              other.duration = noteStart - otherStart
            } else if (noteEnd > otherStart && noteEnd < otherEnd) {
              other.tick = noteEnd
              other.duration = otherEnd - noteEnd
            }

            if (other.duration <= 0) {
              eventsToDelete.push(other.id)
            }
          }
        }

        _.remove(events, (e) => eventsToDelete.includes(e.id))

        // Generate new chunks
        const noteEventsList = Chunk.splitNotes(events)
        const metaEvents = []
        const newChunks = []

        if (mlTrack.hasMidiParam("lyrics"))
          metaEvents.push(...events.filter(isLyricsEvent))

        for (const noteEvents of noteEventsList) {
          newChunks.push(new Chunk(noteEvents, metaEvents, mlTrack))
        }

        // Compare and replace old chunks
        if (mlTrack) {
          mlTrack.chunks = Chunk.replaceChunks(mlTrack.chunks, newChunks)

          for (const chunk of mlTrack.chunks) {
            if (
              chunk.state == FetchState.UnFetched ||
              chunk.state == FetchState.NeedData
            ) {
              chunk.delayedConvert(
                rootStore,
                (_state: FetchState) => {
                  rootStore.mlTrackStore.triggerChange()
                },
                delayMS
              )
            }
          }
        }

        mlTrack.noteCache = events.filter(isNoteEvent)
      }
    )

    this.disposer.bind(this)

    makeObservable(this, {
      chunks: observable.deep,
      trackId: observable,
    })
  }

  setModel(
    model: string,
    modelManifest: Record<string, any>,
    modelOptions: Record<string, string | boolean | number>
  ) {
    this.model = model
    this.modelManifest = modelManifest
    this.modelOptions = modelOptions
  }

  get modelFormat(): "midi" | "musicxml" {
    return this.modelManifest.modelFormat
  }

  hasMidiParam(param: string) {
    return this.modelManifest.midiParameters?.includes(param)
  }

  reset(rootStore: MLRootStore) {
    this.chunks = this.chunks.map((c) => {
      const chunk = new Chunk(c.notes, c.meta, this)
      chunk.startTick = c.startTick
      chunk.duration = c.duration
      return chunk
    })

    this.chunks.forEach((c) =>
      c.delayedConvert(
        rootStore,
        () => rootStore.mlTrackStore.triggerChange(),
        1000
      )
    )

    rootStore.mlTrackStore.triggerChange()
  }

  /**
   * Destroy all containing chunks
   */
  destroy() {
    this.chunks.forEach((c) => c.destroy())
  }
}
