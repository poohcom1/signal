import { makeObservable, observable } from "mobx"
import RootStore from "../../main/stores/RootStore"
import MLTracksStore from "./MLTracksStore"

export default class MLRootStore extends RootStore {
  mlTrackStore: MLTracksStore = new MLTracksStore()

  constructor() {
    super()

    makeObservable(this, {
      mlTrackStore: observable,
    })

    this.mlTrackStore.addTrack(this, 1)
  }
}
