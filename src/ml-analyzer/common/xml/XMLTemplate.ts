/**
 * @see https://github.com/w3c/musicxml/blob/8bbe8e50606bf99317a86e9e1637618d6bdd1997/schema/note.mod#L223
 */
export enum NoteLength {
  NOTE_TYPE_1024TH = "1024th",
  NOTE_TYPE_512TH = "512th",
  NOTE_TYPE_256TH = "256th",
  NOTE_TYPE_128TH = "128th",
  NOTE_TYPE_64TH = "64th",
  NOTE_TYPE_32ND = "32nd",
  NOTE_TYPE_16TH = "16th",
  NOTE_TYPE_EIGHTH = "eighth",
  NOTE_TYPE_QUARTER = "quarter", // 1 beat
  NOTE_TYPE_HALF = "half",
  NOTE_TYPE_WHOLE = "whole",
  NOTE_TYPE_BREVE = "breve",
  NOTE_TYPE_LONG = "long",
  NOTE_TYPE_MAXIMA = "maxima",
}

interface Measure {
  notes: MusicXMLNote[]
  bpm: number
}

export interface MusicXMLNote {
  type: NoteLength
  duration: number
}

export interface Note extends MusicXMLNote {
  noteName: string
  octave: number
  lyric: string
}

export interface RestNote extends MusicXMLNote {}

function isNote(note: MusicXMLNote): note is Note {
  return "noteName" in note
}

/**
 *
 * @param measures
 * @param tempo
 * @returns MusicXML string
 */
export function createTemplate(measures: Measure[], tempo: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <identification>
    <encoding>
      <software>MuseScore 3.4.2</software>
      <encoding-date>2020-04-05</encoding-date>
      <supports element="accidental" type="yes"/>
      <supports element="beam" type="yes"/>
      <supports element="print" attribute="new-page" type="yes" value="yes"/>
      <supports element="print" attribute="new-system" type="yes" value="yes"/>
      <supports element="stem" type="yes"/>
    </encoding>
  </identification>

  <part-list>
    <score-part id="P1">
      <part-name>ピアノ, Harpsichord1</part-name>
      <part-abbreviation>Pno.</part-abbreviation>
      <score-instrument id="P1-I1">
        <instrument-name>ピアノ</instrument-name>
      </score-instrument>
      <midi-device id="P1-I1" port="1"></midi-device>
      <midi-instrument id="P1-I1">
        <midi-channel>1</midi-channel>
        <midi-program>1</midi-program>
        <volume>94.4882</volume>
        <pan>0</pan>
      </midi-instrument>
    </score-part>
  </part-list>

  <part id="P1">
  ${measures
    .map(
      (measure) => `
    <measure number="1">

      <attributes>
        <divisions>2</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>

      <direction placement="above">
        <direction-type>
          <metronome parentheses="no">
            <beat-unit>quarter</beat-unit>
            <per-minute>${tempo}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${tempo}" />
      </direction>
      ${measure.notes
        .map(
          (note) => `
          <note>
            ${
              isNote(note)
                ? `
                  <pitch>
                    <step>${note.noteName.replace("#", "")}</step>
                    <alter>${note.noteName.includes("#") ? 1 : 0}</alter>
                    <octave>${note.octave}</octave>
                  </pitch>
                  <duration>${note.duration}</duration>
                  <voice>1</voice>
                  <type>${note.type}</type>
                  <stem>down</stem>
                  <lyric number="1">
                    <syllabic>single</syllabic>
                    <text>${note.lyric}</text>
                  </lyric>
                  `
                : `
                  <rest/>
                  <duration>${note.duration}</duration>
                  <voice>1</voice>
                  <type>${note.type}</type>
                  `
            }
          </note>`
        )
        .join("")}
    </measure>`
    )
    .join("")}
  </part>
</score-partwise>`
}
