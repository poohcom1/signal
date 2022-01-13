import { LyricsEvent } from "midifile-ts"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import styled from "styled-components"
import { toTrackEvents } from "../../../../common/helpers/toTrackEvents"
import Track, { isNoteEvent, TrackEvent } from "../../../../common/track"
import { GraphAxis } from "../../../../main/components/ControlPane/Graph/GraphAxis"
import { useStores } from "../../../../main/hooks/useStores"
import { useTheme } from "../../../../main/hooks/useTheme"
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

type TrackLyricsEvent = TrackEvent & LyricsEvent

interface MetaEvent {
  subtype: string
}

function isLyricsEvent(event: TrackEvent): event is TrackLyricsEvent {
  return (event as unknown as MetaEvent).subtype === "lyrics"
}

function addOrGetLyric(
  track: Track,
  tick: number,
  defaultLyrics = "_"
): TrackLyricsEvent {
  const lyricEvents = track.events.filter(isLyricsEvent)

  const lyric = lyricEvents.find((e) => e.tick === tick)

  if (lyric) {
    return lyric
  } else {
    const lyricEvent: LyricsEvent = {
      type: "meta",
      subtype: "lyrics",
      text: defaultLyrics,
      deltaTime: tick,
    }

    const trackLyricEvent = toTrackEvents([lyricEvent])

    track.addEvents(trackLyricEvent)

    return trackLyricEvent as unknown as TrackLyricsEvent
  }
}

const LyricsControl: FC<PianoVelocityControlProps> = observer(
  ({ width, height }: PianoVelocityControlProps) => {
    const theme = useTheme()
    const rootStore = useStores()
    const { cursorX, transform, scrollLeft, windowedEvents } =
      rootStore.pianoRollStore
    const { beats } = rootStore.pianoRollStore.rulerStore

    const { selectedTrack } = rootStore.song

    if (!selectedTrack) return <></>

    const items = windowedEvents.filter(isNoteEvent).map((note) => {
      const lyric = addOrGetLyric(selectedTrack, note.tick)

      return {
        id: lyric.id,
        x: transform.getX(lyric.tick),
        tick: lyric.tick,
        lyric: lyric.text,
      }
    })

    const setLyric = (tick: number, lyric: string) => {
      const lyricEvent = selectedTrack.events
        .filter(isLyricsEvent)
        .find((l) => l.tick === tick)

      if (lyricEvent) lyricEvent.text = lyric
      else console.warn("LyricsControl: Lyric event not found")
    }

    return (
      <Parent>
        <GraphAxis values={[]} onClick={() => {}} />
        <div style={{ display: "flex", position: "relative" }}>
          {items.map((item) => (
            <LyricSyllable
              x={item.x - scrollLeft}
              y={0}
              tick={item.tick}
              text={item.lyric}
              setLyric={setLyric}
            />
          ))}
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
