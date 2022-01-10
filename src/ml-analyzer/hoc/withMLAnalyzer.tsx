import { autorun, reaction } from "mobx"
import React from "react"
import Song from "../../common/song/Song"
import { StoreContext } from "../../main/hooks/useStores"
import Chunk from "../models/Chunk"
import MLTrackWrapper from "../models/MLTrackWrapper"
import MLRootStore from "../stores/MLRootStore"
import MLTracksStore from "../stores/MLTracksStore"

export function withMLAnalyzer(Component: React.ComponentType) {
  return class extends React.Component {
    static contextType = StoreContext
    declare context: MLRootStore

    private _trackCount: number = 0
    private _convertTimer: NodeJS.Timeout | null = null

    constructor(props: {}) {
      super(props)

      this.analyze = this.analyze.bind(this)
      this.addTrackAnalyzer = this.addTrackAnalyzer.bind(this)
    }

    componentDidMount() {
      const song: Song = this.context.song
      const mlTracksMap: MLTracksStore = this.context.mlTrackStore

      this._trackCount = song.tracks.length

      mlTracksMap.set(
        song.tracks[1].id,
        this.addTrackAnalyzer(song.tracks[1].id)
      )

      // Main song observer
      autorun(this.analyze)
    }

    /**
     * Autorun callback to setup individual tracks reaction and deal with disposal
     */
    analyze() {
      const { song, mlTrackStore: mlTracksMap } = this.context

      if (song.tracks.length > this._trackCount) {
        // Track added
        for (let i = song.tracks.length - 1; i >= 1; i--) {
          // If new track
          if (!mlTracksMap.has(song.tracks[i].id)) {
            const disposer = this.addTrackAnalyzer(song.tracks[i].id)

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

    /**
     * Generate track wrapper
     * @param id Track id
     * @returns
     */
    addTrackAnalyzer(id: string): any {
      const disposer = reaction(
        // Track events
        () => {
          const { song } = this.context

          for (let i = 1; i < song.tracks.length; i++) {
            if (song.tracks[i].id === id) {
              return song.tracks[i].events
            }
          }

          console.warn("Track id not found. Somehow data is out of sync")
          return song.tracks[1].events
        },
        // Sideeffect: Generate new chunks on new note
        // Could be better optimized if changed note is known
        (events) => {
          if (this._convertTimer) {
            clearTimeout(this._convertTimer)
          }

          // Get track wrapper
          const trackWrapper = this.context.mlTrackStore.get(id)
          // Generate new chunks
          const noteEventsList = Chunk.splitNotes(events)
          const newChunks = []

          for (const noteEvents of noteEventsList) {
            newChunks.push(new Chunk(noteEvents))
          }
          // Compare and replace old chunks

          if (trackWrapper) {
            trackWrapper.chunks = Chunk.replaceChunks(
              trackWrapper.chunks,
              newChunks
            )

            this._convertTimer = setTimeout(() => {
              for (const chunk of trackWrapper.chunks) {
                chunk.convertMidiToAudio(
                  this.context.song.timebase,
                  (error) => {
                    this.context.mlTrackStore.triggerFlag()
                  }
                )
              }
            }, 3000)
          }
        }
      )

      return new MLTrackWrapper(id, disposer)
    }

    render() {
      return <Component {...this.props} />
    }
  }
}
