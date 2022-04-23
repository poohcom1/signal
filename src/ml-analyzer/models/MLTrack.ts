import { IReactionDisposer, makeObservable, observable } from "mobx"
import MLRootStore from "../stores/MLRootStore"
import Chunk, { FetchState } from "./Chunk"

export default class MLTrack {
  public disposer: IReactionDisposer
  public chunks: Chunk[] = []

  // ML Data
  public model: string = ""
  public modelManifest: Record<string, any> = {}
  public modelFormat: "midi" | "musicxml" = "midi"
  public modelOptions: Record<string, string | boolean | number> = {}

  public readonly trackId

  constructor(disposer: IReactionDisposer, trackId: number) {
    this.disposer = disposer
    this.trackId = trackId

    makeObservable(this, {
      chunks: observable.deep,
      trackId: observable,
    })
  }

  reset(rootStore: MLRootStore) {
    this.chunks.forEach((c) => {
      c.delayedConvert(
        rootStore,
        (_state: FetchState) => {
          rootStore.mlTrackStore.triggerChange()
        },
        0
      )
    })
  }

  /**
   * Destroy all containing chunks
   */
  destroy() {
    this.chunks.forEach((c) => c.destroy())
  }
}
