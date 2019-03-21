import React, { StatelessComponent } from "react"
import { pure, Omit } from "recompose"
import LineGraphControl, {
  LineGraphControlProps,
  LineGraphControlEvent
} from "./LineGraphControl"
import { Dispatcher } from "main/createDispatcher"
import { CREATE_EXPRESSION } from "main/actions"
import { ControllerEvent } from "@signal-app/midifile-ts"
import { TrackEvent } from "common/track"

export type ExpressionGraphProps = Omit<
  LineGraphControlProps,
  "createEvent" | "onClickAxis" | "maxValue" | "className" | "axis" | "events"
> & {
  events: TrackEvent[]
  dispatch: Dispatcher
}

const ExpressionGraph: StatelessComponent<ExpressionGraphProps> = ({
  width,
  height,
  scrollLeft,
  events,
  transform,
  dispatch,
  color
}) => {
  const filteredEvents = events.filter(
    e => (e as any).controllerType === 0x0b
  ) as (LineGraphControlEvent & ControllerEvent)[]

  return (
    <LineGraphControl
      className="ExpressionGraph"
      width={width}
      height={height}
      scrollLeft={scrollLeft}
      transform={transform}
      maxValue={127}
      events={filteredEvents}
      axis={[0, 0x20, 0x40, 0x60, 0x80 - 1]}
      createEvent={obj => dispatch(CREATE_EXPRESSION, obj.value, obj.tick)}
      onClickAxis={value => dispatch(CREATE_EXPRESSION, value)}
      color={color}
    />
  )
}

export default pure(ExpressionGraph)
