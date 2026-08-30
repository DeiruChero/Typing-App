export type Theme = {
  name: string;
  bg: string;
  subAlt: string;
  sub: string;
  main: string;
  caret: string;
  error: string;
  errorExtra: string;
  line: string;
};

export const THEMES: Theme[] = [
  { name: "serika dark", bg: "#323437", subAlt: "#2c2e31", sub: "#646669", main: "#d1d0c2", caret: "#e2b714", error: "#ca4754", errorExtra: "#7e2a33", line: "#4a4b4e" },
  { name: "serika", bg: "#e1e1e3", subAlt: "#d3d5d7", sub: "#75777c", main: "#3d3f42", caret: "#e2b714", error: "#ca4754", errorExtra: "#7e2a33", line: "#b9bcc0" },
  { name: "botanical", bg: "#7b9687", subAlt: "#6c8979", sub: "#c6d2c6", main: "#f0efea", caret: "#9fd6ab", error: "#da342f", errorExtra: "#a92826", line: "#8fa898" },
  { name: "dark magic", bg: "#141516", subAlt: "#1a1b1d", sub: "#505256", main: "#c2c5ca", caret: "#9371e8", error: "#fb4674", errorExtra: "#96284a", line: "#2a2b2e" },
  { name: "gruvbox dark", bg: "#282828", subAlt: "#32302f", sub: "#a89984", main: "#ebdbb2", caret: "#d79921", error: "#cc241d", errorExtra: "#9d0006", line: "#504945" },
  { name: "nord", bg: "#2e3440", subAlt: "#3b4252", sub: "#7b88a1", main: "#d8dee9", caret: "#81a1c1", error: "#bf616a", errorExtra: "#7e3f47", line: "#4c566a" },
  { name: "solarized dark", bg: "#002b36", subAlt: "#073642", sub: "#586e75", main: "#93a1a1", caret: "#b58900", error: "#dc322f", errorExtra: "#8f211f", line: "#0f4a56" },
  { name: "tokyo night", bg: "#1a1b26", subAlt: "#202334", sub: "#565f89", main: "#a9b1d6", caret: "#7aa2f7", error: "#f7768e", errorExtra: "#a04c5c", line: "#2f3348" },
  { name: "rose pine", bg: "#191724", subAlt: "#1f1d2e", sub: "#6e6a86", main: "#e0def4", caret: "#f6c177", error: "#eb6f92", errorExtra: "#904459", line: "#2a273a" },
  { name: "monokai", bg: "#272822", subAlt: "#2e2f2a", sub: "#8f908a", main: "#f8f8f2", caret: "#a6e22e", error: "#f92672", errorExtra: "#961044", line: "#49483e" },
  { name: "dracula", bg: "#282a36", subAlt: "#303241", sub: "#6272a4", main: "#f8f8f2", caret: "#ff79c6", error: "#ff5555", errorExtra: "#993333", line: "#44475a" },
  { name: "olive", bg: "#e9e5cc", subAlt: "#dbd6b8", sub: "#98968c", main: "#54524a", caret: "#7c7c47", error: "#b32428", errorExtra: "#7d1a1e", line: "#c9c4a5" },
];