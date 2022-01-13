import { NoteEvent } from "../../../../common/track"

export default interface LyricNote extends NoteEvent {
  lyric: string
}

export function isLyricNote(note: NoteEvent): note is LyricNote {
  return "lyric" in note
}
