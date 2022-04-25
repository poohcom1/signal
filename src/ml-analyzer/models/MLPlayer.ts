import Player from "../../common/player/Player"
import { isNoteEvent, NoteEvent } from "../../common/track"
import TrackMute from "../../common/trackMute"
import { SynthOutput } from "../../main/services/SynthOutput"
import RootStore from "../../main/stores/RootStore"
import MLRootStore from "../stores/MLRootStore"
import MLTracksStore from "../stores/MLTracksStore"

export default class MLPlayer extends Player {
  public mlTrackStore: MLTracksStore | null = null

  private rootStore
  private velocityCache: Record<number, number> = {}

  constructor(
    output: SynthOutput,
    metronomeOutput: SynthOutput,
    trackMute: TrackMute,
    rootStore: RootStore
  ) {
    super(output, metronomeOutput, trackMute, rootStore)

    this.rootStore = rootStore as MLRootStore
    this._play.bind(this)
  }

  private _play(position: number) {
    if (!this.isPlaying || !this.mlTrackStore) return

    let allChunks = this.mlTrackStore.getChunks()

    const notes: NoteEvent[] = []

    for (const chunk of allChunks) {
      chunk.stop()

      const ids = chunk.play(
        position,
        (this.rootStore as RootStore).pianoRollStore.currentTempo ?? 120,
        this.tickToMillisec.bind(this)
      )

      notes.push(...ids)
    }

    this.rootStore.song.tracks.forEach((t) =>
      t.events.forEach((trackNote) => {
        if (isNoteEvent(trackNote)) {
          if (trackNote.id in this.velocityCache) {
            return
          }

          const chunkNote = notes.find((n) => n.id === trackNote.id)

          if (chunkNote && trackNote.velocity > 0) {
            this.velocityCache[chunkNote.id] = trackNote.velocity
            trackNote.velocity = 0
          }
        }
      })
    )
  }

  public onSetPosition() {
    this._play(this.position)
  }

  public play(): void {
    super.play()

    this._play(this.position)
  }

  public stop(): void {
    super.stop()

    if (!this.mlTrackStore) return

    const allChunks = this.mlTrackStore.getChunks()

    for (const chunk of allChunks) {
      chunk.stop()
    }

    for (const [id, velo] of Object.entries(this.velocityCache)) {
      for (const track of this.rootStore.song.tracks) {
        const trackNote = track.events.find(e => e.id === parseInt(id))

        if (trackNote && isNoteEvent(trackNote)) {
          trackNote.velocity = velo

          delete this.velocityCache[parseInt(id)]
        }
      }
    }

  }

  set currentTempo(newTempo: number) {
    this.mlTrackStore?.mlTracks.forEach((t) =>
      t?.reset(this.rootStore as MLRootStore)
    )

    super.currentTempo = newTempo
  }
}
