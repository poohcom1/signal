import { makeObservable, observable } from "mobx"
import RootStore from "../../main/stores/RootStore"
import MLPlayer from "../models/MLPlayer"
import MLTracksStore from "./MLTracksStore"

export default class MLRootStore extends RootStore {
  mlTrackStore: MLTracksStore = new MLTracksStore()

  constructor() {
    super()

    makeObservable(this, {
      mlTrackStore: observable,
    })

    ;(this.services.player as MLPlayer).mlTrackStore = this.mlTrackStore
  }
}
