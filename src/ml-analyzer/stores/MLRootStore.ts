import { makeObservable, observable } from "mobx"
import RootStore from "../../main/stores/RootStore"
import MLPlayer from "../models/MLPlayer"
import MLRootViewStore from "./MLRootViewStore"
import MLTracksStore from "./MLTracksStore"

type ConfigTypes = "boolean" | "string" | "number" | "enum"

interface ConfigItem<T extends ConfigTypes> {
  type: T,
  default: boolean | string | number | undefined
}

export interface BooleanConfig extends ConfigItem<"boolean"> { }
export interface StringConfig extends ConfigItem<"string"> { }
export interface NumberConfig extends ConfigItem<"number"> {
  min: number | undefined;
  max: number | undefined;
  float: boolean | undefined;
}
export interface EnumConfig extends ConfigItem<"enum"> {
  enum: string[]
}

export type Configs = Record<string, Record<string, ConfigItem<ConfigTypes>>>

export default class MLRootStore extends RootStore {
  mlTrackStore = new MLTracksStore()
  mlRootViewStore = new MLRootViewStore()
  configs: Configs = {}

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
