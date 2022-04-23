import { makeObservable, observable } from "mobx"

export default class MLRootViewStore {
  trackSettingsOpened = false
  trackSettingMode: "create" | "edit" = "create"
  trackSettingsId = -1

  constructor() {
    makeObservable(this, {
      trackSettingsOpened: observable,
      trackSettingsId: observable,
      trackSettingMode: observable,
    })
  }

  openTrackSettings(trackId: number, mode: "create" | "edit") {
    this.trackSettingsId = trackId
    this.trackSettingsOpened = true
    this.trackSettingMode = mode
  }

  closeTrackSettings() {
    this.trackSettingsOpened = false
  }
}
