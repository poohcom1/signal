import { ThemeProvider } from "@emotion/react"
import { FC } from "react"
import { useTheme } from "../../hooks/useTheme"

export const EmotionThemeProvider: FC = ({ children }) => {
  const theme = useTheme()
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
