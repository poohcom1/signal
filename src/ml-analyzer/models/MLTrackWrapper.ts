import { IReactionDisposer, makeObservable, observable } from "mobx"
import Chunk from "../models/Chunk"

export default class MLTrackWrapper {
  public id: string
  public disposer: IReactionDisposer
  public chunks: Chunk[] = []

  constructor(id: string, disposer: IReactionDisposer) {
    this.id = id
    this.disposer = disposer

    makeObservable(this, {
      chunks: observable.deep,
    })
  }

  /**
   * Destroy all containing chunks
   */
  destroy() {
    this.chunks.forEach((c) => c.destroy())
  }
}
