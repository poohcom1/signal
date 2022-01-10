import Player from "../../common/player/Player"
import TrackMute from "../../common/trackMute"
import { SynthOutput } from "../../main/services/SynthOutput"
import RootStore from "../../main/stores/RootStore"
import MLTracksStore from "../stores/MLTracksStore"

export default class MLPlayer extends Player {
  public mlTrackStore: MLTracksStore | null = null

  constructor(output: SynthOutput, trackMute: TrackMute, rootStore: RootStore) {
    super(output, trackMute, rootStore)
  }

  public play(): void {
    super.play()

    if (!this.mlTrackStore) return

    let allChunks = this.mlTrackStore.getChunks()

    for (const chunk of allChunks) {
      chunk.play(this.position, this.tickToMillisec.bind(this))
    }
  }

  public stop(): void {
    super.stop()

    if (!this.mlTrackStore) return

    const allChunks = this.mlTrackStore.getChunks()

    for (const chunk of allChunks) {
      chunk.stop()
    }
  }
}
