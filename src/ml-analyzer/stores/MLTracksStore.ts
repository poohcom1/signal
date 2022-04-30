import { pullAt } from "lodash"
import { makeObservable, observable } from "mobx"
import Chunk from "../models/Chunk"
import MLTrack from "../models/MLTrack"
import MLRootStore from "./MLRootStore"

export default class MLTracksStore {
  public mlTracks: Array<MLTrack | undefined> = [undefined] // undefined tracks represent regular tracks
  public _changeFlag: boolean = false // Very hacky way to forward changes, but probably more optimized than just observing the entire mlTrackMap

  constructor() {
    makeObservable(this, {
      mlTracks: observable.deep,
      _changeFlag: observable,
    })
  }

  onTrackAdded(rootStore: MLRootStore, trackId: number) {
    rootStore.mlRootViewStore.openTrackSettings(trackId, "create")
  }

  addTrack(rootStore: MLRootStore, trackId: number) {
    const track = new MLTrack(rootStore, trackId)

    this.mlTracks.push(track)

    return track
  }

  addRegularTrack(rootStore: MLRootStore, trackId: number) {
    this.mlTracks.push(undefined)
  }

  insertTrack(rootStore: MLRootStore, trackId: number) {
    const newTrack = new MLTrack(rootStore, trackId)

    this.mlTracks.splice(trackId, 0, newTrack)

    return newTrack
  }

  removeTrack(trackId: number) {
    for (let i = trackId; i < this.mlTracks.length; i++) {
      this.mlTracks[i]!.trackId--
    }

    const wrapper = pullAt(this.mlTracks, [trackId])[0]

    wrapper?.disposer()
  }

  get(id: number): MLTrack | undefined {
    return id < this.mlTracks.length ? this.mlTracks[id] : undefined
  }

  set(id: number, track: MLTrack) {
    this.mlTracks[id] = track
  }

  delete(id: number) {
    for (let i = id; i < this.mlTracks.length; i++) {
      this.mlTracks[i]!.trackId--
    }

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
    this._changeFlag = !this._changeFlag
  }
}
