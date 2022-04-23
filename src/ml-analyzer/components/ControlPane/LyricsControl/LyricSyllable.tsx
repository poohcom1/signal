import styled from "@emotion/styled"
import { Autocomplete, TextField } from "@mui/material"
import React from "react"

interface IProps {
  x: number
  y: number
  width: number
  noteId: number
  lyric: string
  setLyric: (tick: number, lyric: string) => void

  lyricsMap?: Record<string, string[]>
}

interface IState {
  editing: boolean
  text: string
}

const SyllableEdit = styled(TextField)<Partial<IProps>>`
  margin: 0;
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;

  font-size: 20px;
`

export default class LyricSyllable extends React.Component<IProps, IState> {
  private _inputRef: React.RefObject<HTMLInputElement>

  constructor(props: IProps) {
    super(props)

    this.state = {
      editing: false,
      text: props.lyric ?? "",
    }

    this._inputRef = React.createRef()

    this.handleClick = this.handleClick.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.props.lyric !== prevProps.lyric) {
      this.setState({ text: this.props.lyric })
    }
  }

  handleClick() {
    this.setState({ editing: true })

    setTimeout(() => this._inputRef.current?.focus(), 10)
  }

  handleChange(text: string) {
    this.setState({ text })
    setTimeout(
      () => this.props.setLyric(this.props.noteId, this.state.text),
      100
    )
  }

  handleSubmit() {
    this.props.setLyric(this.props.noteId, this.state.text)
    this.setState({ editing: false })
  }

  render() {
    return (
      <>
        <Autocomplete
          freeSolo
          blurOnSelect
          options={
            this.props.lyricsMap
              ? Object.values(this.props.lyricsMap).reduce(
                  (pre, cur) => pre.concat(...cur),
                  []
                )
              : []
          }
          onChange={(e, value, reason) => {
            if (reason === "clear") {
              this.setState({ text: "" })
            }
            this.handleChange(value ?? "")
          }}
          onInputChange={(e, value) => this.handleChange(value)}
          inputValue={this.state.text}
          renderInput={(params) => (
            <SyllableEdit
              {...params}
              style={{
                width: this.props.width,
              }}
              variant="standard"
              ref={this._inputRef}
              x={this.props.x}
              y={this.props.y}
              width={this.props.width}
              onKeyDown={(ke) => {
                if (ke.key === "Enter") {
                  this.handleSubmit()
                  this._inputRef.current?.blur()
                }
              }}
              onFocus={(e) => e.target.select()}
              onBlur={() => this.handleSubmit()}
              placeholder="⚠️"
            />
          )}
        />
      </>
    )
  }
}
