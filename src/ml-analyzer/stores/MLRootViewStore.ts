import { makeObservable, observable } from "mobx"

export default class MLRootViewStore {
  openTrackSettings = false
  settingTrackId = -1

  constructor() {
    makeObservable(this, {
      openTrackSettings: observable,
      settingTrackId: observable,
    })
  }
}
