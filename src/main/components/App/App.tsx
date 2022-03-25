import * as Sentry from "@sentry/react"
import { Integrations } from "@sentry/tracing"
import React from "react"
import { defaultTheme } from "../../../common/theme/Theme"
import MLRootStore from "../../../ml-analyzer/stores/MLRootStore" // @signal-ml
import { StoreContext } from "../../hooks/useStores"
import { ThemeContext } from "../../hooks/useTheme"
import { GlobalKeyboardShortcut } from "../KeyboardShortcut/GlobalKeyboardShortcut"
import { RootView } from "../RootView/RootView"
import { EmotionThemeProvider } from "../Theme/EmotionThemeProvider"
import { GlobalCSS } from "../Theme/GlobalCSS"
import { MuiThemeProvider } from "../Theme/MuiThemeProvider"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV,
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
})

export function App() {
  return (
    <React.StrictMode>
      {/* @signal-ml */}
      <StoreContext.Provider value={new MLRootStore()}>
        <ThemeContext.Provider value={defaultTheme}>
          <MuiThemeProvider>
            <EmotionThemeProvider>
              <GlobalKeyboardShortcut />
              <GlobalCSS />
              <RootView />
            </EmotionThemeProvider>
          </MuiThemeProvider>
        </ThemeContext.Provider>
      </StoreContext.Provider>
    </React.StrictMode>
  )
}
