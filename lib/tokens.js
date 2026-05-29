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
  bg:          "#FDF6F0",
  surface:     "linear-gradient(145deg, rgba(80,40,10,0.05) 0%, rgba(80,40,10,0.02) 100%)",
  surfaceSolid:"#ECD8C8",
  border:      "rgba(80,40,10,0.08)",
  borderStrong:"rgba(80,40,10,0.15)",
  ink:         "#2E1A08",
  ink2:        "#9A7860",
  ink3:        "#DCC8B4",
  gold:        "#9A5400",
  goldDark:    "#6A3800",
  positive:    "#2A6E3A",
  negative:    "#B83030",
};

// Asset class colours — same on both themes
export const ASSETS = {
  cash:   { dark: "#60A5FA", light: "#1A5A9A", coral: "#60A5FA" },
  shares: { dark: "#4ADE80", light: "#1A6E30", coral: "#4ADE80" },
  crypto: { dark: "#C084FC", light: "#5830A8", coral: "#C084FC" },
  super:  { dark: "#FB923C", light: "#A85000", coral: "#FB923C" },
};

export const FONTS = {
  display: "'Audiowide', sans-serif",
  mono:    "'JetBrains Mono', monospace",
  serif:   "'Cormorant Garamond', serif",
};

// Card style helper
export const cardStyle = (theme, accent, glow) => ({
  background: glow
    ? "linear-gradient(135deg, rgba(255,210,80,0.07) 0%, rgba(255,255,255,0.02) 60%)"
    : "linear-gradient(145deg, rgba(255,255,255,0.058) 0%, rgba(255,255,255,0.018) 100%)",
  border: accent
    ? `1px solid ${accent}55`
    : `1px solid ${"rgba(255,255,255,0.075)"}`,
  borderLeft: accent ? `3px solid ${accent}` : undefined,
  borderRadius: "3px 14px 14px 3px",
  boxShadow: glow
    ? "0 0 40px rgba(255,210,80,0.06), 0 16px 40px rgba(0,0,0,0.35)"
    : "0 8px 28px rgba(0,0,0,0.22)",
  backdropFilter: "blur(12px)",
});
