// ─── Vaulted Design Tokens ────────────────────────────────────────────────────

export const DARK = {
  bg:          "#0C0A08",
  surface:     "linear-gradient(145deg, rgba(255,255,255,0.058) 0%, rgba(255,255,255,0.018) 100%)",
  surfaceSolid:"#141210",
  border:      "rgba(255,255,255,0.075)",
  borderStrong:"rgba(255,255,255,0.13)",
  ink:         "#F0ECE8",
  ink2:        "#7A7068",
  ink3:        "#2A2420",
  gold:        "#FFD24A",
  goldDark:    "#C8920A",
  positive:    "#7DD68A",
  negative:    "#E87070",
};

export const LIGHT = {
  bg:          "#F5F0E8",
  surface:     "linear-gradient(145deg, rgba(26,22,20,0.05) 0%, rgba(26,22,20,0.02) 100%)",
  surfaceSolid:"#EDE8DF",
  border:      "rgba(26,22,20,0.09)",
  borderStrong:"rgba(26,22,20,0.16)",
  ink:         "#1A1614",
  ink2:        "#8A7E74",
  ink3:        "#D8CFC4",
  gold:        "#B87800",
  goldDark:    "#7A4E00",
  positive:    "#1A7A38",
  negative:    "#C03030",
};

// Asset class colours — same on both themes
export const ASSETS = {
  cash:   { dark: "#60A5FA", light: "#1A5A9A" },
  shares: { dark: "#4ADE80", light: "#1A7A38" },
  crypto: { dark: "#C084FC", light: "#6040B0" },
  super:  { dark: "#FB923C", light: "#B85A00" },
};

export const FONTS = {
  display: "'Audiowide', sans-serif",
  mono:    "'JetBrains Mono', monospace",
  serif:   "'Cormorant Garamond', serif",
};

// Card style helper
export const cardStyle = (theme, accent, glow) => ({
  background: glow
    ? theme === "dark"
      ? "linear-gradient(135deg, rgba(255,210,80,0.07) 0%, rgba(255,255,255,0.02) 60%)"
      : "linear-gradient(135deg, rgba(180,120,0,0.06) 0%, rgba(26,22,20,0.02) 60%)"
    : theme === "dark"
      ? "linear-gradient(145deg, rgba(255,255,255,0.058) 0%, rgba(255,255,255,0.018) 100%)"
      : "linear-gradient(145deg, rgba(26,22,20,0.05) 0%, rgba(26,22,20,0.015) 100%)",
  border: accent
    ? `1px solid ${accent}55`
    : `1px solid ${theme === "dark" ? "rgba(255,255,255,0.075)" : "rgba(26,22,20,0.09)"}`,
  borderLeft: accent ? `3px solid ${accent}` : undefined,
  borderRadius: "3px 14px 14px 3px",
  boxShadow: glow
    ? "0 0 40px rgba(255,210,80,0.06), 0 16px 40px rgba(0,0,0,0.35)"
    : "0 8px 28px rgba(0,0,0,0.22)",
  backdropFilter: "blur(12px)",
});
