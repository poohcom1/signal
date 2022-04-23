import { IReactionDisposer, makeObservable, observable } from "mobx"
import MLRootStore from "../stores/MLRootStore"
import Chunk from "./Chunk"

export default class MLTrack {
  public disposer: IReactionDisposer
  public chunks: Chunk[] = []

  // ML Data
  public model: string = ""
  public modelManifest: Record<string, any> = {}
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
