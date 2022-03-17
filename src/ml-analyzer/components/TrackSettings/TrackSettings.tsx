import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
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
  const rootStore = useStores() as MLRootStore
  const { mlRootViewStore, mlTrackStore } = rootStore

  const close = () => (mlRootViewStore.openTrackSettings = false)

  const [models, setModels] = useState<string[]>()

  useEffect(() => {
    getModels().then((results) => {
      if (!results.error) {
        setModels(results.data)
        setModel(results.data[0])
      } else {
        alert(results.error)
      }
    })
  }, [])

  // Option data
  const [isRegularTrack, setIsRegularTrack] = useState(false)
  const [model, setModel] = useState<string>("")

  // Dialog actions callbacks
  const handleCancel = useCallback(() => {
    removeTrack(rootStore)(mlRootViewStore.currentSettingsTrack)
    close()
  }, [])

  const handleCreate = useCallback(() => {
    if (!isRegularTrack) {
      const track = mlTrackStore.addTrack(
        rootStore,
        mlRootViewStore.currentSettingsTrack
      )
      track.model = model
    } else {
      mlTrackStore.addRegularTrack(
        rootStore,
        mlRootViewStore.currentSettingsTrack
      )
    }
    close()
  }, [isRegularTrack, model, mlRootViewStore.currentSettingsTrack])

  return (
    <Dialog open={mlRootViewStore.openTrackSettings} onClose={close}>
      <DialogTitle>{`Track #${mlRootViewStore.currentSettingsTrack} Settings`}</DialogTitle>

      <DialogContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={isRegularTrack}
              onChange={(e) => {
                setIsRegularTrack(e.target.checked)
              }}
              inputProps={{ "aria-label": "controlled" }}
            />
          }
          label="Create regular track"
        />
        <div style={{ display: isRegularTrack ? "none" : "block" }}>
          <FormControl variant="outlined" fullWidth margin="normal">
            <InputLabel id="model-select">Model</InputLabel>
            <Select
              label="Model"
              labelId="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value as string)}
            >
              {models ? (
                models.map((model) => (
                  <MenuItem value={model}>{model}</MenuItem>
                ))
              ) : (
                <MenuItem value={""}>Loading models...</MenuItem>
              )}
            </Select>
          </FormControl>
        </div>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCancel}
          disabled={mlRootViewStore.currentSettingsTrack === 1}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={model === "" && !isRegularTrack}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
})
