import styled from "@emotion/styled"

export const ToolbarButton = styled.button<{ selected?: boolean }>`
  -webkit-appearance: none;
  min-width: auto;
  padding: 0 0.7rem;
  color: inherit;
  border: 1px solid ${({ theme }) => theme.dividerColor};
  background: ${({ theme, selected }) =>
    selected ? theme.themeColor : "inherit"};
  text-transform: none;
  height: 2rem;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  outline: none;

  &:hover {
    background: ${({ theme }) => theme.secondaryBackgroundColor};
  }

  svg {
    width: 1.3rem;
    fill: currentColor;
  }
`