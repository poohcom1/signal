// @ts-nocheck

import { reaction } from "mobx"
import React from "react"
import Song from "../../common/song/Song"
import { StoreContext } from "../../main/hooks/useStores"
import Chunk, { FetchState } from "../models/Chunk"
import MLTrackWrapper from "../models/MLTrackWrapper"
import MLRootStore from "../stores/MLRootStore"

export function withMLAnalyzer(Component: React.ComponentType) {
  return class extends React.Component {
    static contextType = StoreContext
    declare context: MLRootStore

    private _trackCount: number = 0
    private _convertTimer: NodeJS.Timeout | null = null

    constructor(props: {}) {
      super(props)

      this.analyze = this.analyze.bind(this)
      this.createTrackAnalyzer = this.createTrackAnalyzer.bind(this)
    }

    componentDidMount() {
      const song: Song = this.context.song

      this._trackCount = song.tracks.length

      this.addTrackAnalyzer(song.tracks[1].id)
    }

    addTrackAnalyzer(id: string) {
      const { mlTrackStore, song } = this.context

      mlTrackStore.set(id, this.createTrackAnalyzer(id))
    }

    /**
     * Generate track wrapper
     * @param id Track id
     * @param delayMS Delay in ms before analyzer
     * @returns
     */
    createTrackAnalyzer(id: string, delayMS = 3000): MLTrackWrapper {
      const disposer = reaction(
        // Track events
        () => {
          const { song } = this.context

          for (let i = 1; i < song.tracks.length; i++) {
            if (song.tracks[i].id === id) {
              return song.tracks[i].events
            }
          }

          console.warn(`Track id ${id} not found. Somehow data is out of sync`)
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

            for (const chunk of trackWrapper.chunks) {
              if (chunk.state == FetchState.UnFetched) {
                chunk.delayedConvert(
                  this.context.song.timebase,
                  (_state: FetchState) => {
                    this.context.mlTrackStore.triggerChange()
                  },
                  delayMS
                )
              }
            }
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
