import { makeObservable, observable } from "mobx"
import RootStore from "../../main/stores/RootStore"
import MLPlayer from "../models/MLPlayer"
import MLRootViewStore from "./MLRootViewStore"
import MLTracksStore from "./MLTracksStore"

interface ConfigParam<T extends string> {
  type: T,
  default: boolean | string | number
  label: string
}

interface BooleanParam extends ConfigParam<"boolean"> { }
interface StringParam extends ConfigParam<"string"> { }
interface IntParam extends ConfigParam<"int"> {
  min: number | undefined;
  max: number | undefined;
}
interface FloatParam extends ConfigParam<"float"> {
  min: number | undefined;
  max: number | undefined;
  step: number | undefined
}
interface EnumParam extends ConfigParam<"enum"> {
  enum: string[]
}

export type ModelsData = Record<string, {
  name: string
  format: "midi" | "musicxml"
  description: string
  parameters: Record<string, BooleanParam | StringParam | IntParam | FloatParam | EnumParam>
}>

export type Config = Record<string, string | boolean | number>

export default class MLRootStore extends RootStore {
  mlTrackStore = new MLTracksStore()
  mlRootViewStore = new MLRootViewStore()

  constructor() {
    super()

    makeObservable(this, {
      mlTrackStore: observable,
      mlRootViewStore: observable,
    })

    this.mlTrackStore.onTrackAdded(this, 1);

    (this.services.player as MLPlayer).mlTrackStore = this.mlTrackStore
  }
}
