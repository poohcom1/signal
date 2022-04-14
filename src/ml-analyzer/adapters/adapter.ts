import { Config, ModelsData } from "../stores/MLRootStore"

const BACKEND_URL = "http://localhost:5000" // "http://192.168.1.40:5000"

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

  return fetch(`${BACKEND_URL}/convert/${model
    }`, {
    method: "POST",
    body: formData,
    signal,
    //mode: "no-cors",
  })
}


export async function getModels(): Promise<Result<ModelsData>> {
  try {
    const res = await fetch(`${BACKEND_URL}/models`, { method: "GET" })

    const list = await res.json() as ModelsData

    return { data: list, error: null }
  } catch (error) {
    console.log(error)

    return { data: {}, error: "Server error! Please try again later" }
  }
}
