import { autorun, reaction } from "mobx"
import React from "react"
import Player from "../../common/player"
import Song from "../../common/song/Song"
import { StoreContext } from "../hooks/useMLStores"
import Chunk from "../models/Chunk"
import MLTrackWrapper from "../models/MLTrackWrapper"
import MLTracksStore from "../stores/MLTracksStore"

export function withMLPlayer(player: Player, mlTrackStore: MLTracksStore) {
  return class extends Player {
    // Getter/setters

    // todo: This is bad, audiochunk should be managed and play on a lower level
    //        to reduce complexity on detecting playing and pausing
    public play(): void {
      super.play()

      super.play()

      let allChunks = mlTrackStore.getChunks()

      for (const chunk of allChunks) {
        chunk.play(this.position, this.tickToMillisec.bind(this))
      }
    }

    public stop(): void {
      super.stop()

      const allChunks = mlTrackStore.getChunks()

      for (const chunk of allChunks) {
        chunk.stop()
      }
    }
  }
}

export function withMLAnalyzer(Component: React.ComponentType) {
  return class extends React.Component {
    static contextType = StoreContext
    declare context: React.ContextType<typeof StoreContext>

    private trackCount: number = 0

    constructor(props: {}) {
      super(props)

      this.analyze = this.analyze.bind(this)
      this.addTrackAnalyzer = this.addTrackAnalyzer.bind(this)
    }

    componentDidMount() {
      const song: Song = this.context.song
      const mlTracksMap: MLTracksStore = this.context.mlTrackStore

      this.trackCount = song.tracks.length

      mlTracksMap.set(
        song.tracks[1].id,
        this.addTrackAnalyzer(song.tracks[1].id)
      )

      // Main song observer
      autorun(this.analyze)
    }

    /**
     * Generate track wrapper
     * @param id Track id
     * @returns
     */
    addTrackAnalyzer(id: string): any {
      const disposer = reaction(
        // Track events
        () => {
          const { song, mlTrackStore: mlTracksMap } = this.context

          for (let i = 1; i < song.tracks.length; i++) {
            if (song.tracks[i].id === id) {
              return song.tracks[i].events
            }
          }

          // Shouldn't ever be called, but a nullable doesn't get detected by reaction
          console.warn("Track id not found. Somehow data is out of sync")
          return song.tracks[1].events
        },
        // Sideeffect: Generate new chunks
        // Could be better optimized if changed note is known
        (events) => {
          // Get track wrapper
          const trackWrapper = this.context.mlTrackStore.get(id)
          // Generate new chunks
          const newChunks = Chunk.splitNotes(events)
          // Compare and replace old chunks
          if (trackWrapper) {
            trackWrapper.chunks = Chunk.replaceChunks(
              trackWrapper.chunks,
              newChunks
            )
          }
        }
      )

      return new MLTrackWrapper(id, disposer)
    }

    analyze() {
      const { song, mlTrackStore: mlTracksMap } = this.context

      if (song.tracks.length > this.trackCount) {
        // Track added
        for (let i = song.tracks.length - 1; i >= 1; i--) {
          // If new track
          if (!mlTracksMap.has(song.tracks[i].id)) {
            const disposer = this.addTrackAnalyzer(song.tracks[1].id)

            mlTracksMap.set(song.tracks[i].id, disposer)

            break
          }
        }
      } else {
        // Track removed
        const existingIds = song.tracks.map((track) => track.id)

        const keys = Array.from(mlTracksMap.keys())

        for (const id of keys) {
          // If removed track
          if (!existingIds.includes(id)) {
            const trackWrapper = mlTracksMap.get(id)
            if (trackWrapper) trackWrapper.disposer()

            mlTracksMap.delete(id)

            break
          }
        }
      }
    }

    render() {
      return <Component {...this.props} />
    }
  }
}
