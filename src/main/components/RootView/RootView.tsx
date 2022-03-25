import { observer } from "mobx-react-lite"
import { FC } from "react"
import styled from "styled-components"
import { TrackSettings } from "../../../ml-analyzer/components/TrackSettings/TrackSettings"
import { useStores } from "../../hooks/useStores"
import { ArrangeEditor } from "../ArrangeView/ArrangeEditor"
import { BuildInfo } from "../BuildInfo"
import { EventEditor } from "../EventEditor/EventEditor"
import { ExportDialog } from "../ExportDialog/ExportDialog"
import { ExportProgressDialog } from "../ExportDialog/ExportProgressDialog"
import { HelpDialog } from "../Help/HelpDialog"
import { MIDIDeviceDialog } from "../MIDIDeviceView/MIDIDeviceDialog"
import { Navigation } from "../Navigation/Navigation"
import { PianoRollEditor } from "../PianoRoll/PianoRollEditor"
import { TempoEditor } from "../TempoGraph/TempoEditor"
import { TransportPanel } from "../TransportPanel/TransportPanel"

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
`

const Column = styled.div`
  height: 100%;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
`

const Routes: FC = observer(() => {
  const { router } = useStores()
  const path = router.path
  return (
    <>
      {path === "/track" && <PianoRollEditor />}
      {path === "/tempo" && <TempoEditor />}
      {path === "/arrange" && <ArrangeEditor />}
    </>
  )
})

export const RootView: FC = () => (
  <>
    <Column>
      <Navigation />
      <Container>
        <Routes />
        <TransportPanel />
        <BuildInfo />
        <EventEditor />
      </Container>
    </Column>
    <HelpDialog />
    <MIDIDeviceDialog />
    <ExportDialog />
    <ExportProgressDialog />
    {/* @signal-ml */}
    <TrackSettings createMode={true} />
  </>
)
