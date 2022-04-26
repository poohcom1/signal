import { Config, ModelsData } from "../stores/MLRootStore"

const BACKEND_URL = process.env.BACKEND ?? "http://localhost:5000"
const BACKEND_URL_BACKUP = process.env.BACKEND_BACKUP

let backend = BACKEND_URL

export function convertMidi(
  blob: Blob,
  bpm: number,
  signal: AbortSignal,
  model: string,
  options: Config
): Promise<Response> {
  let formData = new FormData()
  formData.append("midi", blob)
  formData.append("options", JSON.stringify(options))
  formData.append("bpm", `${bpm}`)

  return fetch(`${backend}/convert/${model}`, {
    method: "POST",
    body: formData,
    signal,
    //mode: "no-cors",
  })
}

export async function getModels(): Promise<Result<ModelsData>> {
  try {
    const res = await fetch(`${backend}/models`, {
      method: "GET",
    })

    const list = (await res.json()) as ModelsData

    return { data: list, error: null }
  } catch (error) {
    if (BACKEND_URL_BACKUP) {
      console.log("Server error, switching to backup backend")
      try {
        const res = await fetch(`${BACKEND_URL_BACKUP}/models`, {
          method: "GET",
        })

        const list = (await res.json()) as ModelsData

        backend = BACKEND_URL_BACKUP

        return { data: list, error: null }
      } catch (e) {}
    }

    console.log(error)

    return {
      data: {},
      error: "Server error. Please refresh or try again later",
    }
  }
}
