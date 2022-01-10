import Player from "../../common/player/Player"
import TrackMute from "../../common/trackMute"
import { SynthOutput } from "../../main/services/SynthOutput"
import RootStore from "../../main/stores/RootStore"
import MLRootStore from "../stores/MLRootStore"
import MLTracksStore from "../stores/MLTracksStore"

export default class MLPlayer extends Player {
  private mlTrackStore: MLTracksStore

  constructor(output: SynthOutput, trackMute: TrackMute, rootStore: RootStore) {
    super(output, trackMute, rootStore)

    this.mlTrackStore = (rootStore as MLRootStore).mlTrackStore
  }

  // Getter/setters

  // todo: This is bad, audiochunk should be managed and play on a lower level
  //        to reduce complexity on detecting playing and pausing
  public play(): void {
    super.play()

    super.play()

    let allChunks = this.mlTrackStore.getChunks()

    for (const chunk of allChunks) {
      chunk.play(this.position, this.tickToMillisec.bind(this))
    }
  }

  public stop(): void {
    super.stop()

    const allChunks = this.mlTrackStore.getChunks()

    for (const chunk of allChunks) {
      chunk.stop()
    }
  }
}
