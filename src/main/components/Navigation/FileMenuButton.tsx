import styled from "@emotion/styled"
import { Divider, Menu, MenuItem } from "@mui/material"
import Color from "color"
import { observer } from "mobx-react-lite"
import React, { ChangeEvent, FC, useCallback, useRef, VFC } from "react"
import { localized } from "../../../common/localize/localizedString"
import { downloadSelectedTrackXML } from "../../../ml-analyzer/common/xml/midi2xml"
import { createSong, openSong, saveSong } from "../../actions"
import { hasFSAccess, openFile, saveFile, saveFileAs } from "../../actions/file"
import { useStores } from "../../hooks/useStores"
import { useTheme } from "../../hooks/useTheme"
import { Tab } from "./Navigation"

const fileInputID = "OpenButtonInputFile"

const FileInput: FC<{
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}> = ({ onChange, children }) => (
  <>
    <input
      accept="audio/midi"
      style={{ display: "none" }}
      id={fileInputID}
      type="file"
      onChange={onChange}
    />
    <label htmlFor={fileInputID}>{children}</label>
  </>
)

export const FileMenu: VFC<{ close: () => void }> = observer(({ close }) => {
  const rootStore = useStores()

  const onClickOpen = async () => {
    close()
    await openFile(rootStore)
  }

  const onClickSave = async () => {
    close()
    await saveFile(rootStore)
  }

  const onClickSaveAs = async () => {
    close()
    await saveFileAs(rootStore)
  }

  return (
    <>
      <MenuItem onClick={onClickOpen}>
        {localized("open-song", "Open")}
      </MenuItem>

      <MenuItem
        onClick={onClickSave}
        disabled={rootStore.song.fileHandle === null}
      >
        {localized("save-song", "Save")}
      </MenuItem>

      <MenuItem onClick={onClickSaveAs}>
        {localized("save-as", "Save As")}
      </MenuItem>
    </>
  )
})

export const LegacyFileMenu: VFC<{ close: () => void }> = observer(
  ({ close }) => {
    const rootStore = useStores()

    const onClickOpen = (e: ChangeEvent<HTMLInputElement>) => {
      close()
      openSong(rootStore)(e.currentTarget)
    }

    const onClickSave = () => {
      close()
      saveSong(rootStore)()
    }

    return (
      <>
        <FileInput onChange={onClickOpen}>
          <MenuItem>{localized("open-song", "Open")}</MenuItem>
        </FileInput>

        <MenuItem onClick={onClickSave}>
          {localized("save-song", "Save")}
        </MenuItem>
      </>
    )
  }
)

const StyledMenu = styled(Menu)`
  .MuiList-root {
    background: ${({ theme }) =>
      Color(theme.backgroundColor).lighten(0.2).hex()};
  }
`

export const FileMenuButton: FC = observer(() => {
  const rootStore = useStores()
  const { rootViewStore, exportStore } = rootStore
  const theme = useTheme()
  const isOpen = rootViewStore.openDrawer
  const handleClose = () => (rootViewStore.openDrawer = false)

  const onClickNew = () => {
    handleClose()
    if (
      confirm(localized("confirm-new", "Are you sure you want to continue?"))
    ) {
      createSong(rootStore)()
    }
  }

  const onClickExport = () => {
    handleClose()
    exportStore.openExportDialog = true
  }

  // @signal-ml
  const onClickExportXML = () => {
    handleClose()
    downloadSelectedTrackXML(rootStore)()
  }

  const ref = useRef<HTMLDivElement>(null)

  return (
    <>
      <Tab
        ref={ref}
        onClick={useCallback(() => (rootViewStore.openDrawer = true), [])}
        id="tab-file"
      >
        <span>{localized("file", "File")}</span>
      </Tab>

      <StyledMenu
        keepMounted
        open={isOpen}
        onClose={handleClose}
        anchorEl={ref.current}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transitionDuration={50}
        disableAutoFocusItem={true}
      >
        <MenuItem onClick={onClickNew}>{localized("new-song", "New")}</MenuItem>

        <Divider />

        {hasFSAccess && <FileMenu close={handleClose} />}

        {!hasFSAccess && <LegacyFileMenu close={handleClose} />}

        <Divider />

        <MenuItem onClick={onClickExport}>
          {localized("export-audio", "Export Audio")}
        </MenuItem>

        {/* @signal-ml */}
        <MenuItem onClick={onClickExportXML}>
          {localized("export-xml", "Export Track as XML")}
        </MenuItem>
      </StyledMenu>
    </>
  )
})
