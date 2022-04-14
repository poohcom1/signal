import styled from "@emotion/styled"
import React from "react"

interface IProps {
  x: number
  y: number
  width: number
  noteId: number
  lyric: string
  setLyric: (tick: number, lyric: string) => void
}

interface IState {
  editing: boolean
  text: string
}

interface SyllableDivProps extends Partial<IProps> {
  display: boolean
}

const SyllableDiv = styled.button<SyllableDivProps>`
  margin: 0;
  width: ${(props) => props.width}px;
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
  display: ${(props) => (props.display ? "block" : "none")};

  font-size: 20px;
  padding-left: 5px;

  color: white;
  background-color: transparent;
  border: none;
  outline: none;

  &:hover {
    background-color: rgb(0, 0, 0, 0.5);
  }
`

const SyllableEdit = styled.input<SyllableDivProps>`
  margin: 0;
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
  display: ${(props) => (props.display ? "block" : "none")};
  background-color: transparent;

  color: white;
  outline: none;
  border: none;

  font-size: 20px;
`

export default class LyricSyllable extends React.Component<IProps, IState> {
  private _inputRef: React.RefObject<HTMLInputElement>

  constructor(props: IProps) {
    super(props)

    this.state = {
      editing: false,
      text: this.props.lyric ?? "",
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

  handleSubmit() {
    this.props.setLyric(this.props.noteId, this.state.text)
    this.setState({ editing: false })
  }

  render() {
    return (
      <>
        <SyllableEdit
          style={{ width: this.props.width }}
          ref={this._inputRef}
          x={this.props.x}
          y={this.props.y}
          width={this.props.width}
          display={true}
          value={this.state.text}
          onKeyDown={(ke) => {
            if (ke.key === "Enter") {
              this.handleSubmit()
            }
          }}
          onFocus={(e) => e.target.select()}
          onBlur={() => this.handleSubmit()}
          onChange={(e) => this.setState({ text: e.target.value })}
          placeholder="_"
        />
      </>
    )
  }
}
