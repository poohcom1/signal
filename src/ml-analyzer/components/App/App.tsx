import { StylesProvider } from "@material-ui/core"
import { ThemeProvider as MuiThemeProvider } from "@material-ui/styles"
import * as Sentry from "@sentry/react"
import { Integrations } from "@sentry/tracing"
import React from "react"
import { ThemeProvider } from "styled-components"
import { GlobalCSS } from "../../../common/theme/GlobalCSS"
import { theme } from "../../../common/theme/muiTheme"
import { defaultTheme } from "../../../common/theme/Theme"
import { GlobalKeyboardShortcut } from "../../../main/components/KeyboardShortcut/GlobalKeyboardShortcut"
import { RootView } from "../../../main/components/RootView/RootView"
import { StoreContext } from "../../../main/hooks/useStores"
import { ThemeContext } from "../../../main/hooks/useTheme"
import { withMLAnalyzer } from "../../hoc/withMLAnalyzer"
import MLRootStore from "../../stores/MLRootStore"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV,
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
})

export function App() {
  const MLRootView = withMLAnalyzer(RootView)

  return (
    <React.StrictMode>
      <StoreContext.Provider value={new MLRootStore()}>
        <ThemeContext.Provider value={defaultTheme}>
          <ThemeProvider theme={defaultTheme}>
            <MuiThemeProvider theme={theme}>
              <StylesProvider injectFirst>
                <GlobalKeyboardShortcut />
                <GlobalCSS />
                <MLRootView />
              </StylesProvider>
            </MuiThemeProvider>
          </ThemeProvider>
        </ThemeContext.Provider>
      </StoreContext.Provider>
    </React.StrictMode>
  )
}
