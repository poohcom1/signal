import { makeObservable, observable } from "mobx"
import RootStore from "../../main/stores/RootStore"
import MLPlayer from "../models/MLPlayer"
import MLRootViewStore from "./MLRootViewStore"
import MLTracksStore from "./MLTracksStore"

export type Configs = Record<string, Record<string, string | number | boolean>>

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
