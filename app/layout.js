"use client";

import { useState, createContext, useContext } from "react";
import "./globals.css";

// ─── Theme context ────────────────────────────────────────────────────────────
export const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0C0A08" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
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
