import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
} from "@material-ui/core"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { removeTrack } from "../../../main/actions"
import { useStores } from "../../../main/hooks/useStores"
import { getModels } from "../../controllers/controller"
import MLRootStore from "../../stores/MLRootStore"

export const TrackSettings: FC = observer(() => {
  const rootStore = useStores()
  const { mlRootViewStore, mlTrackStore, song } = useStores() as MLRootStore

  const close = () => (mlRootViewStore.openTrackSettings = false)

  const [models, setModels] = useState<string[]>()

  useEffect(() => {
    getModels()
      .then((res) => res.json())
      .then(setModels)
      .catch((e) => {
        alert(e + " Please try again in a couple minutes!")
      })
  }, [])

  // Dialog actions callbacks
  const handleCancel = useCallback(() => {
    removeTrack(rootStore)(mlRootViewStore.currentSettingsTrack)
    close()
  }, [])

  const handleCreate = useCallback(() => {
    close()
  }, [])

  return (
    <Dialog open={mlRootViewStore.openTrackSettings} onClose={close}>
      <DialogTitle>{`Track #${mlRootViewStore.currentSettingsTrack} Settings`}</DialogTitle>

      <DialogContent>
        <Select value={models ? models[0] : ""}>
          {models ? (
            models.map((model) => <MenuItem value={model}>{model}</MenuItem>)
          ) : (
            <MenuItem>Loading models...</MenuItem>
          )}
        </Select>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCancel}
          disabled={mlRootViewStore.currentSettingsTrack === 1}
        >
          Cancel
        </Button>
        <Button onClick={handleCreate}>Create</Button>
      </DialogActions>
    </Dialog>
  )
})
