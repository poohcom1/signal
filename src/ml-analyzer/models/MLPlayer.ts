import Player from "../../common/player/Player"
import TrackMute from "../../common/trackMute"
import { SynthOutput } from "../../main/services/SynthOutput"
import RootStore from "../../main/stores/RootStore"
import { SongStore } from "../../main/stores/SongStore"
import MLRootStore from "../stores/MLRootStore"
import MLTracksStore from "../stores/MLTracksStore"

export default class MLPlayer extends Player {
  public mlTrackStore: MLTracksStore | null = null
  private songStore

  constructor(
    output: SynthOutput,
    metronomeOutput: SynthOutput,
    trackMute: TrackMute,
    songStore: SongStore
  ) {
    super(output, metronomeOutput, trackMute, songStore)

    this.songStore = songStore
  }

  public play(): void {
    super.play()

    if (!this.mlTrackStore) return

    let allChunks = this.mlTrackStore.getChunks()

    for (const chunk of allChunks) {
      chunk.play(
        this.position,
        (this.songStore as RootStore).pianoRollStore.currentTempo ?? 120,
        this.tickToMillisec.bind(this)
      )
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

  set currentTempo(newTempo: number) {
    this.mlTrackStore?.mlTracks.forEach((t) =>
      t?.reset(this.songStore as MLRootStore)
    )
    
    super.currentTempo = newTempo
  }
}
