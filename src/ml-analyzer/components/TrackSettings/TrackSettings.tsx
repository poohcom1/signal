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
  Switch,
  TextField,
} from "@mui/material"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { removeTrack } from "../../../main/actions"
import { useStores } from "../../../main/hooks/useStores"
import { getModels } from "../../adapters/adapter"
import MLRootStore, { Configs, EnumConfig } from "../../stores/MLRootStore"

interface TrackSettingsProps {
  createMode: boolean
}

export const TrackSettings: FC<TrackSettingsProps> = observer(
  ({ createMode = false }) => {
    const rootStore = useStores() as MLRootStore
    const { mlRootViewStore, mlTrackStore } = rootStore

    const close = () => (mlRootViewStore.openTrackSettings = false)

    const [models, setModels] = useState<string[]>()
    const [configs, setConfigs] = useState<Configs>({})

    useEffect(() => {
      getModels().then((results) => {
        if (!results.error) {
          const models = Array.from(Object.keys(results.data))

          setModels(models)
          setModel(models[0])

          console.log(results.data)

          setConfigs(results.data)
          rootStore.configs = results.data
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
      if (createMode) {
        removeTrack(rootStore)(mlRootViewStore.currentSettingsTrack)
      }
      close()
    }, [])

    const handleApply = useCallback(() => {
      if (createMode) {
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
      } else {
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

            <div>
              <h2>{model} Configs</h2>
              {configs[model] ? (
                Object.keys(configs[model]).map((key) => {
                  const param = configs[model][key]

                  switch (param.type) {
                    case "boolean":
                      return (
                        <FormControlLabel
                          control={<Switch defaultChecked />}
                          label={key}
                        />
                      )
                    case "enum":
                      const values = (param as EnumConfig).enum

                      if (values.length === 0) {
                        return <></>
                      }

                      return (
                        <FormControl
                          variant="outlined"
                          fullWidth
                          margin="normal"
                        >
                          <InputLabel id="model-select">{key}</InputLabel>
                          <Select label="Model" labelId="model-select">
                            {values.map((value) => (
                              <MenuItem value={value}>{value}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )
                    case "string":
                      return (
                        <TextField
                          id="standard-basic"
                          label={key}
                          variant="standard"
                        />
                      )
                    case "number":
                      return (
                        <TextField
                          id="standard-number"
                          label={key}
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          variant="standard"
                          defaultValue={param.default}
                        />
                      )
                  }
                })
              ) : (
                <></>
              )}
            </div>
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
            onClick={handleApply}
            disabled={model === "" && !isRegularTrack}
          >
            {createMode ? "Create" : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
)
