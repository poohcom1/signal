import { findLast, isEqual } from "lodash"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useState } from "react"
import { BeatWithX } from "../../../common/helpers/mapBeats"
import { LoopSetting } from "../../../common/player"
import { Theme } from "../../../common/theme/Theme"
import Chunk from "../../../ml-analyzer/models/Chunk"
import MLRootStore from "../../../ml-analyzer/stores/MLRootStore"
import { setPlayerPosition, updateTimeSignature } from "../../actions"
import { Layout } from "../../Constants"
import { useContextMenu } from "../../hooks/useContextMenu"
import { useStores } from "../../hooks/useStores"
import { useTheme } from "../../hooks/useTheme"
import { RulerStore, TimeSignature } from "../../stores/RulerStore"
import DrawCanvas from "../DrawCanvas"
import { RulerContextMenu } from "./RulerContextMenu"
import { TimeSignatureDialog } from "./TimeSignatureDialog"

const textPadding = 2

function drawRuler(
  ctx: CanvasRenderingContext2D,
  height: number,
  beats: BeatWithX[],
  theme: Theme
) {
  ctx.strokeStyle = theme.secondaryTextColor
  ctx.lineWidth = 1
  ctx.beginPath()

  // 密過ぎる時は省略する
  // Omit when it is too high
  const shouldOmit = beats.length > 1 && beats[1].x - beats[0].x <= 5

  beats.forEach(({ beat, measure, x }) => {
    const isTop = beat === 0

    if (isTop) {
      ctx.moveTo(x, height / 2)
      ctx.lineTo(x, height)
    } else if (!shouldOmit) {
      ctx.moveTo(x, height * 0.8)
      ctx.lineTo(x, height)
    }

    // 小節番号
    // War Number
    // 省略時は2つに1つ描画
    // Default 1 drawing one for two
    if (isTop && (!shouldOmit || measure % 2 === 0)) {
      ctx.textBaseline = "top"
      ctx.font = `12px ${theme.canvasFont}`
      ctx.fillStyle = theme.secondaryTextColor
      ctx.fillText(`${measure}`, x + textPadding, textPadding)
    }
  })

  ctx.closePath()
  ctx.stroke()
}

function drawLoopPoints(
  ctx: CanvasRenderingContext2D,
  loop: LoopSetting,
  height: number,
  pixelsPerTick: number,
  theme: Theme
) {
  const lineWidth = 1
  const flagSize = 8
  ctx.fillStyle = loop.enabled ? theme.themeColor : theme.secondaryTextColor
  ctx.beginPath()

  const beginX = loop.begin * pixelsPerTick
  const endX = loop.end * pixelsPerTick

  if (loop.begin !== null) {
    const x = beginX
    ctx.moveTo(x, 0)
    ctx.lineTo(x + lineWidth + flagSize, 0)
    ctx.lineTo(x + lineWidth, flagSize)
    ctx.lineTo(x + lineWidth, height)
    ctx.lineTo(x, height)
    ctx.lineTo(x, 0)
  }

  if (loop.end !== null) {
    const x = endX
    ctx.moveTo(x, 0)
    ctx.lineTo(x - lineWidth - flagSize, 0)
    ctx.lineTo(x - lineWidth, flagSize)
    ctx.lineTo(x - lineWidth, height)
    ctx.lineTo(x, height)
    ctx.lineTo(x, 0)
  }

  ctx.closePath()
  ctx.fill()

  if (loop.begin !== null && loop.end !== null) {
    ctx.rect(beginX, 0, endX - beginX, height)
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)"
    ctx.fill()
  }
}

// @signal-ml
function drawChunk(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  height: number,
  pixelsPerTick: number,
  theme: Theme
) {
  const lineWidth = 1
  const flagSize = 16
  ctx.fillStyle = chunk.loaded
    ? "rgba(0, 255, 0, 0.575)"
    : "rgba(255, 0, 0, 0.5)"
  ctx.beginPath()

  const beginX = chunk.startTick * pixelsPerTick
  const endX = chunk.endTick * pixelsPerTick

  if (chunk.startTick !== null && chunk.endTick !== null) {
    ctx.rect(beginX, 0, endX - beginX, height)
    //ctx.fillStyle = "rgba(0, 0, 0, 0.02)"
    ctx.fill()
  }
}

function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  flagSize: number
) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width + flagSize, y)
  ctx.lineTo(x + width, y + height)
  ctx.lineTo(x, y + height)
  ctx.lineTo(x, y)
  ctx.closePath()
  ctx.fill()
}

function drawTimeSignatures(
  ctx: CanvasRenderingContext2D,
  height: number,
  events: TimeSignature[],
  pixelsPerTick: number,
  theme: Theme
) {
  ctx.textBaseline = "bottom"
  ctx.font = `11px ${theme.canvasFont}`
  events.forEach((e) => {
    const x = e.tick * pixelsPerTick
    const text = `${e.numerator}/${e.denominator}`
    const size = ctx.measureText(text)
    const textHeight =
      size.actualBoundingBoxAscent + size.actualBoundingBoxDescent
    ctx.fillStyle = e.isSelected
      ? theme.themeColor
      : theme.tertiaryBackgroundColor
    drawFlag(
      ctx,
      x,
      height - textHeight - textPadding * 4,
      size.width + textPadding * 2,
      textHeight + textPadding * 4,
      textHeight
    )
    ctx.fillStyle = theme.textColor
    ctx.fillText(text, x + textPadding, height - textPadding)
  })
}

export interface TickEvent<E> {
  tick: number
  nativeEvent: E
}

export interface PianoRulerProps {
  rulerStore: RulerStore
  style?: React.CSSProperties
}

// null = closed
interface TimeSignatureDialogState {
  numerator: number
  denominator: number
}

const TIME_SIGNATURE_HIT_WIDTH = 20

const PianoRuler: FC<PianoRulerProps> = observer(({ rulerStore, style }) => {
  const rootStore = useStores()
  const theme = useTheme()
  const { onContextMenu, menuProps } = useContextMenu()
  const [timeSignatureDialogState, setTimeSignatureDialogState] =
    useState<TimeSignatureDialogState | null>(null)
  const height = Layout.rulerHeight

  const {
    canvasWidth: width,
    transform: { pixelsPerTick },
    scrollLeft,
  } = rulerStore.parent
  const { beats, timeSignatures } = rulerStore
  const { loop } = rootStore.services.player

  const timeSignatureHitTest = (tick: number) => {
    const widthTick = TIME_SIGNATURE_HIT_WIDTH / pixelsPerTick
    return findLast(
      timeSignatures,
      (e) => e.tick < tick && e.tick + widthTick >= tick
    )
  }

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const local = {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      }
      const tick = (local.x + scrollLeft) / pixelsPerTick
      const timeSignature = timeSignatureHitTest(tick)

      if (e.nativeEvent.ctrlKey) {
        // setLoopBegin(tick)
      } else if (e.nativeEvent.altKey) {
        // setLoopEnd(tick)
      } else {
        if (timeSignature !== undefined) {
          if (e.detail == 2) {
            setTimeSignatureDialogState(timeSignature)
          } else {
            rulerStore.selectedTimeSignatureEventIds = [timeSignature.id]
          }
        } else {
          rulerStore.selectedTimeSignatureEventIds = []
          setPlayerPosition(rootStore)(tick)
        }
      }
    },
    [rootStore, scrollLeft, pixelsPerTick, timeSignatures]
  )

  // @signal-ml
  const selectedTrack = useEffect(() => {}, [
    rootStore.song.selectedTrack?.events.length,
    rootStore.song.tracks.length,
  ])
  // end

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(-scrollLeft + 0.5, 0)
      drawRuler(ctx, height, beats, theme)
      if (loop.enabled) {
        drawLoopPoints(ctx, loop, height, pixelsPerTick, theme)
      }
      drawTimeSignatures(ctx, height, timeSignatures, pixelsPerTick, theme)

      // @signal-ml
      const mlTracksMap = (rootStore as MLRootStore).mlTrackStore
      const selectedTrack = rootStore.song.selectedTrack

      if (selectedTrack) {
        const selectedTrackWrapper = mlTracksMap.get(selectedTrack.id)

        if (selectedTrackWrapper) {
          const chunks = selectedTrackWrapper.chunks

          if (chunks) {
            for (let i = 0; i < chunks.length; i++) {
              drawChunk(ctx, chunks[i], height, pixelsPerTick, theme)
            }
          }
        }
      }
      // end

      ctx.restore()
    },
    [width, pixelsPerTick, scrollLeft, beats, timeSignatures]
  )

  const closeOpenTimeSignatureDialog = useCallback(() => {
    setTimeSignatureDialogState(null)
  }, [])

  const okTimeSignatureDialog = useCallback(
    ({ numerator, denominator }: TimeSignatureDialogState) => {
      rulerStore.selectedTimeSignatureEventIds.forEach((id) => {
        updateTimeSignature(rootStore)(id, numerator, denominator)
      })
    },
    []
  )

  return (
    <>
      <DrawCanvas
        draw={draw}
        width={width}
        height={height}
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
        style={style}
      />

      <RulerContextMenu {...menuProps} rulerStore={rulerStore} />
      <TimeSignatureDialog
        open={timeSignatureDialogState != null}
        initialNumerator={timeSignatureDialogState?.numerator}
        initialDenominator={timeSignatureDialogState?.denominator}
        onClose={closeOpenTimeSignatureDialog}
        onClickOK={okTimeSignatureDialog}
      />
    </>
  )
})

function equals(props: PianoRulerProps, nextProps: PianoRulerProps) {
  return isEqual(props.style, nextProps.style)
}

export default React.memo(PianoRuler, equals)
