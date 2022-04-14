import { IReactionDisposer, makeObservable, observable } from "mobx"
import Chunk from "./Chunk"

export default class MLTrack {
  public disposer: IReactionDisposer
  public chunks: Chunk[] = []

  // ML Data
  public model: string = ""
  public modelFormat: "midi" | "musicxml" = "midi"
  public modelOptions: Record<string, string | boolean | number> = {}

  constructor(disposer: IReactionDisposer) {
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
