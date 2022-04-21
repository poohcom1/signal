import { IReactionDisposer, makeObservable, observable } from "mobx"
import Chunk from "./Chunk"

export default class MLTrack {
  public disposer: IReactionDisposer
  public chunks: Chunk[] = []

  // ML Data
  public model: string = ""
  public modelFormat: "midi" | "musicxml" = "midi"
  public modelOptions: Record<string, string | boolean | number> = {}

  public readonly trackId

  constructor(disposer: IReactionDisposer, trackId: number) {
    this.disposer = disposer
    this.trackId = trackId

    makeObservable(this, {
      chunks: observable.deep,
      trackId: observable
    })
  }

  /**
   * Destroy all containing chunks
   */
  destroy() {
    this.chunks.forEach((c) => c.destroy())
  }
}
