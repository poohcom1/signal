import { makeObservable, observable } from "mobx"

export default class MLRootViewStore {
  openTrackSettings = false
  currentSettingsTrack = -1

  constructor() {
    makeObservable(this, {
      openTrackSettings: observable,
      currentSettingsTrack: observable,
    })
  }
}
