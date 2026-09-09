import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { applyTheme, getInitialTheme } from "./lib/theme";
import { ThemeProvider } from "./providers/ThemeProvider";
import { TimezoneProvider } from "./providers/TimezoneProvider";
import "./styles/globals.css";

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialTheme={initialTheme}>
        <TimezoneProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TimezoneProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
