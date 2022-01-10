import { makeObservable, observable } from "mobx"
import Chunk from "../models/Chunk"
import MLTrackWrapper from "../models/MLTrackWrapper"

export interface IMLTracksStore {
  get: (id: string) => MLTrackWrapper | undefined
  set: (id: string, track: MLTrackWrapper) => void
  delete: (id: string) => void
  keys: () => IterableIterator<string>
  has: (id: string) => boolean
  forEach: (callback: (value: MLTrackWrapper, id: string) => void) => void
}

export default class MLTracksStore implements IMLTracksStore {
  public mlTrackMap: Map<string, MLTrackWrapper> = new Map()

  constructor() {
    makeObservable(this, {
      mlTrackMap: observable,
    })
  }

  get(id: string): MLTrackWrapper | undefined {
    return this.mlTrackMap.get(id)
  }

  set(id: string, track: MLTrackWrapper) {
    this.mlTrackMap.set(id, track)
  }

  delete(id: string) {}

  has(id: string) {
    return this.mlTrackMap.has(id)
  }

  keys() {
    return this.mlTrackMap.keys()
  }

  forEach(callback: (value: MLTrackWrapper, id: string) => void) {
    this.mlTrackMap.forEach(callback)
  }

  getChunks(): Chunk[] {
    const chunks: Chunk[] = []

    const wrappers = Array.from(this.mlTrackMap.values())
    for (const wrapper of wrappers) {
      chunks.push(...wrapper.chunks)
    }

    return chunks
  }
}
