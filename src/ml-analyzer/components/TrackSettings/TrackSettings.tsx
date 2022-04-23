import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
} from "@mui/material"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { removeTrack } from "../../../main/actions"
import { useStores } from "../../../main/hooks/useStores"
import { getModels } from "../../adapters/adapter"
import MLRootStore, { Config, ModelsData } from "../../stores/MLRootStore"

function convertDisplayString(text: string) {
  // Thanks to https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-title-case-text
  const result = text.replace(/([A-Z])/g, " $1")
  return result.charAt(0).toUpperCase() + result.slice(1)
}

interface TrackSettingsProps {
  createMode: boolean
}

function defaultConfigs(
  modelData: ModelsData,
  models: string[]
): Record<string, Config> {
  const modelConfigs: Record<string, Config> = {}

  for (const model of models) {
    const config: Config = {}

    for (const key of Object.keys(modelData[model].parameters)) {
      config[key] = modelData[model].parameters[key].default
    }

    modelConfigs[model] = config
  }

  return modelConfigs
}

export const TrackSettings: FC<TrackSettingsProps> = observer(() => {
  const rootStore = useStores() as MLRootStore
  const { mlRootViewStore, mlTrackStore } = rootStore

  const close = () => (mlRootViewStore.trackSettingsOpened = false)

  const [models, setModels] = useState<string[]>([])
  const [modelData, setModelData] = useState<ModelsData>({})
  const [modelConfigs, setModelConfigs] = useState<Record<string, Config>>({})

  useEffect(() => {
    if (mlRootViewStore.trackSettingMode === "create") {
      getModels().then((results) => {
        if (!results.error) {
          const models = Array.from(Object.keys(results.data))

          setModels(models)
          setModel(models[0])

          setModelConfigs(defaultConfigs(results.data, models))
          setModelData(results.data)
        } else {
          alert(results.error)
        }
      })
    } else {
      const track = mlTrackStore.get(mlRootViewStore.trackSettingsId)

      if (track) {
        setModel(track.model)
        const defaultConfig = defaultConfigs(modelData, models)
        defaultConfig[track.model] = track.modelOptions
        setModelConfigs(defaultConfig)
      }
    }
  }, [mlRootViewStore.trackSettingMode])

  // Option data
  const [isRegularTrack, setIsRegularTrack] = useState(false)
  const [model, setModel] = useState<string>("")

  // Dialog actions callbacks
  const handleCancel = () => {
    if (mlRootViewStore.trackSettingMode === "create") {
      removeTrack(rootStore)(mlRootViewStore.trackSettingsId)
    }
    close()
  }

  const handleApply = () => {
    if (mlRootViewStore.trackSettingMode === "create") {
      if (!isRegularTrack) {
        const track = mlTrackStore.addTrack(
          rootStore,
          mlRootViewStore.trackSettingsId
        )
        track.setModel(model, modelData[model], modelConfigs[model])

        rootStore.song.selectTrack(track.trackId)

        if (track.hasMidiParam("lyrics")) {
          rootStore.pianoRollStore.controlMode = "lyrics"
        }
      } else {
        mlTrackStore.addRegularTrack(rootStore, mlRootViewStore.trackSettingsId)
      }
    } else {
      const track = mlTrackStore.get(mlRootViewStore.trackSettingsId)

      if (track) {
        track.setModel(model, modelData[model], modelConfigs[model])
        track.reset(rootStore)

        if (track.hasMidiParam("lyrics")) {
          rootStore.pianoRollStore.controlMode = "lyrics"
        }
      }
    }

    close()
  }

  const setConfig = useCallback(
    (key, value) => {
      modelConfigs[model][key] = value

      setModelConfigs({ ...modelConfigs })
    },
    [modelConfigs, model, setModelConfigs]
  )

  // Rendering configs
  const drawConfig = useMemo(() => {
    if (!modelData[model]) {
      return <></>
    }

    return Object.keys(modelData[model].parameters).map((key) => {
      const param = modelData[model].parameters[key]
      const label = param.label ?? convertDisplayString(key)

      const config = modelConfigs[model]

      switch (param.type) {
        case "boolean":
          return (
            <FormControlLabel
              key={`${model}_${key}`}
              control={<Switch defaultChecked />}
              label={label}
              value={config[key] as boolean}
              onChange={(_e, value) => setConfig(key, value as boolean)}
            />
          )
        case "enum":
          const values = param.enum

          if (values.length === 0) {
            return <></>
          }

          return (
            <TextField
              key={`${model}_${key}`}
              label={label}
              variant="standard"
              select
              value={config[key] ?? ""}
              onChange={(e) => setConfig(key, e.target.value)}
            >
              {values.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          )
        case "string":
          return (
            <TextField
              key={`${model}_${key}`}
              label={label}
              variant="standard"
              value={config[key] as string}
              onChange={(e) => setConfig(key, e.target.value)}
            />
          )
        case "int":
          return (
            <TextField
              key={`${model}_${key}`}
              label={label}
              type="number"
              variant="standard"
              value={config[key] as number}
              onChange={(e) =>
                setConfig(key, e.target.value as unknown as number)
              }
            />
          )
        case "float":
          if (param.min !== undefined && param.max !== undefined) {
            return (
              <>
                <InputLabel>
                  {label} - {config[key] as unknown as number}
                </InputLabel>
                <Slider
                  key={`${model}_${key}`}
                  defaultValue={param.default as number}
                  step={param.step ?? 0.05}
                  marks
                  min={param.min}
                  max={param.max}
                  valueLabelDisplay="auto"
                  value={config[key] as number}
                  onChange={(e, value) =>
                    setConfig(key, value as unknown as number)
                  }
                />
              </>
            )
          } else {
            return (
              <TextField
                key={`${model}_${key}`}
                label={label}
                type="number"
                value={config[key] as number}
                onChange={(e) =>
                  setConfig(key, e.target.value as unknown as number)
                }
              />
            )
          }
      }
    })
  }, [
    model,
    modelData,
    modelConfigs,
    setModelConfigs,
    setConfig,
    setModelConfigs,
  ])

  return (
    <Dialog
      open={mlRootViewStore.trackSettingsOpened}
      onClose={close}
      fullWidth={true}
      maxWidth={"md"}
    >
      <DialogTitle>{`Track #${mlRootViewStore.trackSettingsId} Settings`}</DialogTitle>

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
          <FormControl variant="outlined" fullWidth>
            <InputLabel id="model-select">Model</InputLabel>
            <Select
              label="Model"
              labelId="model-select"
              value={model}
              onChange={(e) => {
                setModel(e.target.value as string)
              }}
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
            <Divider style={{ marginTop: "16px" }}>{model} Configs</Divider>
            {/* Individual configs */}
            <Box
              component="form"
              sx={{
                "& .MuiTextField-root": { m: 1, width: "25ch" },
              }}
              noValidate
              autoComplete="off"
            >
              {drawConfig}
            </Box>
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          onClick={handleApply}
          disabled={model === "" && !isRegularTrack}
        >
          {mlRootViewStore.trackSettingMode === "create" ? "Create" : "Apply"}
        </Button>
      </DialogActions>
    </Dialog>
  )
})
