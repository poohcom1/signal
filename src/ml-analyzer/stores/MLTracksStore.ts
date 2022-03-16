import { pullAt } from "lodash"
import { makeObservable, observable, reaction } from "mobx"
import Chunk, { FetchState } from "../models/Chunk"
import MLTrackWrapper from "../models/MLTrackWrapper"
import MLRootStore from "./MLRootStore"

export interface IMLTracksStore {
  get: (id: string) => MLTrackWrapper | undefined
  set: (id: string, track: MLTrackWrapper) => void
  delete: (id: string) => void
  keys: () => IterableIterator<string>
  has: (id: string) => boolean
  forEach: (callback: (value: MLTrackWrapper, id: string) => void) => void
}

/**
 * Generate track wrapper
 * @param id Track id
 * @param delayMS Delay in ms before analyzer
 * @returns
 */
function createTrackAnalyzer(
  rootStore: MLRootStore,
  id: number,
  delayMS = 3000
): MLTrackWrapper {
  const disposer = reaction(
    // Track events
    () => {
      if (id < rootStore.song.tracks.length)
        return rootStore.song.tracks[id]?.events
      else return null
    },
    // Sideeffect: Generate new chunks on new note
    // Could be better optimized if changed note is known
    (events) => {
      if (!events) {
        return
      }

      // Get track wrapper
      const trackWrapper = rootStore.mlTrackStore.get(id)

      // Generate new chunks
      const noteEventsList = Chunk.splitNotes(events)
      const newChunks = []

      for (const noteEvents of noteEventsList) {
        newChunks.push(new Chunk(noteEvents))
      }

      // Compare and replace old chunks
      if (trackWrapper) {
        trackWrapper.chunks = Chunk.replaceChunks(
          trackWrapper.chunks,
          newChunks
        )

        for (const chunk of trackWrapper.chunks) {
          if (chunk.state == FetchState.UnFetched) {
            chunk.delayedConvert(
              rootStore.song.timebase,
              (_state: FetchState) => {
                rootStore.mlTrackStore.triggerChange()
              },
              delayMS
            )
          }
        }
      }
    }
  )

  return new MLTrackWrapper(disposer)
}

export default class MLTracksStore {
  public mlTracks: MLTrackWrapper[] = [{} as unknown as MLTrackWrapper]
  public changeFlag: boolean = false // Very hacky way to forward changes, but probably more optimized than just observing the entire mlTrackMap

  constructor() {
    makeObservable(this, {
      mlTracks: observable.deep,
      changeFlag: observable,
    })
  }

  addTrack(rootStore: MLRootStore, trackId: number) {
    this.mlTracks.push(createTrackAnalyzer(rootStore, trackId))

    rootStore.mlRootViewStore.currentSettingsTrack = trackId
    rootStore.mlRootViewStore.openTrackSettings = true
  }

  insertTrack(rootStore: MLRootStore, trackId: number) {
    const newTrack = createTrackAnalyzer(rootStore, trackId)

    this.mlTracks.splice(trackId, 0, newTrack)
  }

  removeTrack(trackId: number) {
    const wrapper = pullAt(this.mlTracks, trackId)[0]

    wrapper.disposer()
  }

  get(id: number): MLTrackWrapper | undefined {
    return this.mlTracks[id]
  }

  set(id: number, track: MLTrackWrapper) {
    this.mlTracks[id] = track
  }

  delete(id: number) {
    const wrapper = pullAt(this.mlTracks, id)[0]

    wrapper.disposer()
  }

  has(id: number) {
    return id < this.mlTracks.length
  }

  keys() {
    return this.mlTracks
  }

  forEach(callback: (value: MLTrackWrapper) => void) {
    this.mlTracks.forEach(callback)
  }

  getChunks(): Chunk[] {
    const chunks: Chunk[] = []

    const wrappers = this.mlTracks

    for (let i = 1; i < wrappers.length; i++) {
      chunks.push(...wrappers[i].chunks)
    }

    return chunks
  }

  triggerChange() {
    this.changeFlag = !this.changeFlag
  }
}
