import React from "react"
import styled from "styled-components"

interface IProps {
  x: number
  y: number
  tick: number
  text: string | null
  setLyric: (tick: number, lyric: string) => void
}

interface IState {
  editing: boolean
  text: string
}

interface SyllableDivProps {
  x: number
  y: number
  display: boolean
}

const SyllableDiv = styled.div<SyllableDivProps>`
  margin: 0;
  width: 20px;
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
  display: ${(props) => (props.display ? "block" : "none")};
`

const SyllableEdit = styled.input<SyllableDivProps>`
  margin: 0;
  width: 20px;
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
  display: ${(props) => (props.display ? "block" : "none")};
`

export default class LyricSyllable extends React.Component<IProps, IState> {
  private _inputRef: React.RefObject<HTMLInputElement>

  constructor(props: IProps) {
    super(props)

    this.state = {
      editing: false,
      text: this.props.text ?? "",
    }

    this._inputRef = React.createRef()

    this.handleClick = this.handleClick.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleClick() {
    this.setState({ editing: true })

    setTimeout(() => this._inputRef.current?.focus(), 10)
  }

  handleSubmit() {
    this.props.setLyric(this.props.tick, this.state.text)
    this.setState({ editing: false })
  }

  render() {
    return (
      <>
        <SyllableEdit
          ref={this._inputRef}
          x={this.props.x}
          y={0}
          display={this.state.editing}
          value={this.state.text}
          onKeyDown={(ke) => {
            if (ke.key === "Enter") {
              this.handleSubmit()
            }
          }}
          onFocus={(e) => e.target.select()}
          onBlur={() => this.handleSubmit()}
          onChange={(e) => this.setState({ text: e.target.value })}
        />

        <SyllableDiv
          display={!this.state.editing}
          x={this.props.x}
          y={0}
          onClick={this.handleClick}
        >
          {this.state.text}
        </SyllableDiv>
      </>
    )
  }
}
