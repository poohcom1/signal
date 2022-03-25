import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { isNoteEvent } from "../../../../common/track"
import { GraphAxis } from "../../../../main/components/ControlPane/Graph/GraphAxis"
import { useStores } from "../../../../main/hooks/useStores"
import { useTheme } from "../../../../main/hooks/useTheme"
import {
  clearDanglingLyrics,
  getOrAddLyric,
  setLyric,
  TrackLyricsEvent,
} from "../../../actions/lyrics"
import LyricSyllable from "./LyricSyllable"

export interface PianoVelocityControlProps {
  width: number
  height: number
}

const Parent = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
`

interface LyricNote {
  noteId: number
  x: number
  y: number
  noteNumber: number
  height: number
  width: number
  tick: number
  lyric: string
}

const LyricsControl: FC<PianoVelocityControlProps> = observer(
  ({ width, height }: PianoVelocityControlProps) => {
    const theme = useTheme()
    const rootStore = useStores()
    const { transform, scrollLeft, windowedEvents } = rootStore.pianoRollStore

    clearDanglingLyrics(rootStore)()

    const lyricNotes = windowedEvents.filter(isNoteEvent).map((note) => {
      const lyric = getOrAddLyric(rootStore)(note) as TrackLyricsEvent

      return {
        noteId: note.id,
        x: transform.getX(lyric.tick),
        y: 0,
        noteNumber: note.noteNumber,
        height: 20,
        width: transform.getX(note.duration),
        tick: lyric.tick,
        lyric: lyric.text,
      }
    })

    const lyricXMap: Map<number, [LyricNote]> = new Map()

    for (const lyricNote of lyricNotes) {
      if (lyricXMap.has(lyricNote.x)) {
        lyricXMap.get(lyricNote.x)!.push(lyricNote)
      } else {
        lyricXMap.set(lyricNote.x, [lyricNote])
      }
    }

    for (const overlaps of Array.from(lyricXMap.values())) {
      if (overlaps.length > 1) {
        overlaps.sort((a, b) => b.noteNumber - a.noteNumber)

        for (let i = 0, len = overlaps.length; i < len; i++) {
          overlaps[i].y = i * overlaps[i].height
        }
      }
    }

    return (
      <Parent>
        <GraphAxis values={[]} onClick={() => {}} />
        <div style={{ display: "flex", position: "relative", height: height }}>
          {lyricNotes.map((item) => {
            return (
              <LyricSyllable
                key={item.noteId}
                {...item}
                setLyric={setLyric(rootStore)}
              />
            )
          })}
        </div>
      </Parent>
    )
  }
)

function areEqual(
  props: PianoVelocityControlProps,
  nextProps: PianoVelocityControlProps
) {
  return props.width === nextProps.width && props.height === nextProps.height
}

export default React.memo(LyricsControl, areEqual)
