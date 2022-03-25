import { pullAt } from "lodash"
import { makeObservable, observable, reaction } from "mobx"
import Chunk, { FetchState } from "../models/Chunk"
import MLTrack from "../models/MLTrack"
import MLRootStore from "./MLRootStore"

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
): MLTrack {
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
      const mlTrack = rootStore.mlTrackStore.get(id)!

      // Generate new chunks
      const noteEventsList = Chunk.splitNotes(events)
      const newChunks = []

      for (const noteEvents of noteEventsList) {
        newChunks.push(new Chunk(noteEvents, mlTrack))
      }

      // Compare and replace old chunks
      if (mlTrack) {
        mlTrack.chunks = Chunk.replaceChunks(
          mlTrack.chunks,
          newChunks
        )

        for (const chunk of mlTrack.chunks) {
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

  return new MLTrack(disposer)
}

export default class MLTracksStore {

  public mlTracks: Array<MLTrack | undefined> = [undefined] // undefined tracks represent regular tracks

  public changeFlag: boolean = false // Very hacky way to forward changes, but probably more optimized than just observing the entire mlTrackMap

  constructor() {
    makeObservable(this, {
      mlTracks: observable.deep,
      changeFlag: observable,
    })
  }

  onTrackAdded(rootStore: MLRootStore, trackId: number) {
    rootStore.mlRootViewStore.currentSettingsTrack = trackId
    rootStore.mlRootViewStore.openTrackSettings = true
  }

  addTrack(rootStore: MLRootStore, trackId: number) {
    const track = createTrackAnalyzer(rootStore, trackId)

    this.mlTracks.push(track)

    return track
  }

  addRegularTrack(rootStore: MLRootStore, trackId: number) {
    this.mlTracks.push(undefined)
  }

  insertTrack(rootStore: MLRootStore, trackId: number) {
    const newTrack = createTrackAnalyzer(rootStore, trackId)

    this.mlTracks.splice(trackId, 0, newTrack)

    return newTrack
  }

  removeTrack(trackId: number) {
    const wrapper = pullAt(this.mlTracks, trackId)[0]

    wrapper?.disposer()
  }

  get(id: number): MLTrack | undefined {
    return id < this.mlTracks.length ? this.mlTracks[id] : undefined
  }

  set(id: number, track: MLTrack) {
    this.mlTracks[id] = track
  }

  delete(id: number) {
    const wrapper = pullAt(this.mlTracks, id)[0]

    wrapper?.disposer()
  }

  has(id: number) {
    return id < this.mlTracks.length && this.mlTracks[id] !== undefined
  }

  keys() {
    return this.mlTracks
  }

  forEach(callback: (value: MLTrack | undefined) => void) {
    this.mlTracks.forEach(callback)
  }

  getChunks(): Chunk[] {
    const chunks: Chunk[] = []

    for (let i = 0; i < this.mlTracks.length; i++) {
      const track = this.mlTracks[i]

      if (track) {
        chunks.push(...track.chunks)
      }
    }

    return chunks
  }

  triggerChange() {
    this.changeFlag = !this.changeFlag
  }
}
