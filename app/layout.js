"use client";

import { useState, createContext, useContext } from "react";
import "./globals.css";

export const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

// Themes cycle: dark → coral → dark
const THEMES = ["dark", "coral"];

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const toggleTheme = () => setTheme(t => {
    const idx = THEMES.indexOf(t);
    return THEMES[(idx + 1) % THEMES.length];
  });

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* PWA — Android */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0C0A08" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* PWA — iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vaulted" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />

        <title>Vaulted</title>
      </head>
      <body>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          {children}
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
