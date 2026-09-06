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
  { name: "alduin", bg: "#1f1b18", subAlt: "#161210", sub: "#8c7a6b", main: "#d6c3b0", caret: "#df9c34", error: "#a84b3e", errorExtra: "#5a2820", line: "#332b25" },
  { name: "arch", bg: "#1a1a1d", subAlt: "#2b2b2f", sub: "#8a94a6", main: "#d8dee9", caret: "#1793d1", error: "#c04b55", errorExtra: "#68262c", line: "#3b3b41" },
  { name: "aurora", bg: "#0b1929", subAlt: "#132640", sub: "#6575a3", main: "#e6e6e6", caret: "#59c2ff", error: "#ff5d73", errorExtra: "#993845", line: "#1f3b59" },
  { name: "bento", bg: "#2d394d", subAlt: "#232b3c", sub: "#8892a6", main: "#e7e7e7", caret: "#ff8ba7", error: "#e5534b", errorExtra: "#852f2b", line: "#47556c" },
  { name: "burgundy", bg: "#1a1a1a", subAlt: "#2a2a2a", sub: "#888888", main: "#e6e6e6", caret: "#800020", error: "#cc3333", errorExtra: "#661a1a", line: "#3a3a3a" },
  { name: "cafe", bg: "#423b35", subAlt: "#352f2a", sub: "#a69282", main: "#e8d5c4", caret: "#c89b7b", error: "#a84b3e", errorExtra: "#5a2820", line: "#5c524a" },
  { name: "carbon", bg: "#121212", subAlt: "#1e1e1e", sub: "#757575", main: "#e0e0e0", caret: "#bcaaa4", error: "#cf6679", errorExtra: "#733843", line: "#2c2c2c" },
  { name: "catppuccin", bg: "#302d41", subAlt: "#2a2838", sub: "#908caa", main: "#d9e0ee", caret: "#f5c2e7", error: "#f28fad", errorExtra: "#8f5766", line: "#4a475e" },
  { name: "coral", bg: "#2b303b", subAlt: "#232832", sub: "#8c9aa9", main: "#f5f5f5", caret: "#ff7f50", error: "#e5534b", errorExtra: "#852f2b", line: "#3b4252" },
  { name: "cyber", bg: "#0f0f0f", subAlt: "#1a1a1a", sub: "#00ff00", main: "#ffffff", caret: "#ff00ff", error: "#ff0000", errorExtra: "#800000", line: "#2a2a2a" },
  { name: "deku", bg: "#058b8c", subAlt: "#047475", sub: "#b2d8d8", main: "#f8f8f2", caret: "#f92672", error: "#e6db74", errorExtra: "#736e3a", line: "#129b9c" },
  { name: "future", bg: "#191b28", subAlt: "#12131e", sub: "#5c6b8f", main: "#a9b1d6", caret: "#7aa2f7", error: "#f7768e", errorExtra: "#a04c5c", line: "#282a3a" },
  { name: "laser", bg: "#221b44", subAlt: "#191433", sub: "#6c5c9c", main: "#e6e6e6", caret: "#e91e63", error: "#ff5252", errorExtra: "#8f2b2b", line: "#352a59" },
  { name: "lime", bg: "#1b2028", subAlt: "#14181e", sub: "#768692", main: "#cfd1d2", caret: "#a6e22e", error: "#f92672", errorExtra: "#961044", line: "#2c343c" },
  { name: "mizu", bg: "#1a2b3c", subAlt: "#121e2a", sub: "#6a8299", main: "#d9e2ec", caret: "#38bdf8", error: "#f87171", errorExtra: "#994646", line: "#2c4259" },
  { name: "night", bg: "#0b0e14", subAlt: "#06080d", sub: "#5c6773", main: "#b3b1ad", caret: "#ffcc00", error: "#ff3333", errorExtra: "#801a1a", line: "#1c2028" },
  { name: "paper", bg: "#eeeeee", subAlt: "#e0e0e0", sub: "#999999", main: "#222222", caret: "#333333", error: "#cc0000", errorExtra: "#660000", line: "#cccccc" },
  { name: "peach", bg: "#fcefd8", subAlt: "#f5e4c3", sub: "#a68a6d", main: "#4a3b32", caret: "#ff8c69", error: "#d32f2f", errorExtra: "#6a1818", line: "#e6d3b3" },
  { name: "red samurai", bg: "#1a0b0b", subAlt: "#2a1212", sub: "#8c5a5a", main: "#e6c2c2", caret: "#cc0000", error: "#ff4444", errorExtra: "#802222", line: "#3c1c1c" },
  { name: "stealth", bg: "#010203", subAlt: "#0a0b0c", sub: "#444444", main: "#777777", caret: "#555555", error: "#883333", errorExtra: "#441a1a", line: "#111213" },
  { name: "terminal", bg: "#000000", subAlt: "#0a0a0a", sub: "#00aa00", main: "#00ff00", caret: "#00ff00", error: "#ff0000", errorExtra: "#800000", line: "#003300" },
  { name: "voc", bg: "#190618", subAlt: "#240922", sub: "#8b5c81", main: "#e6d2e1", caret: "#d650d6", error: "#ff55ff", errorExtra: "#802a80", line: "#331230" },
  { name: "vscode", bg: "#1e1e1e", subAlt: "#252526", sub: "#858585", main: "#d4d4d4", caret: "#007acc", error: "#f48771", errorExtra: "#7a4338", line: "#333333" },
  { name: "watermelon", bg: "#1f4437", subAlt: "#163127", sub: "#76a589", main: "#f0f8ff", caret: "#ff4c4c", error: "#ff8080", errorExtra: "#804040", line: "#2d5949" },
  { name: "witch girl", bg: "#2a1b38", subAlt: "#1f1329", sub: "#7a628c", main: "#e6dcf2", caret: "#b771e3", error: "#ff5e8c", errorExtra: "#8f344f", line: "#3d2950" },
  { name: "rose pine dawn", bg: "#faf4ed", subAlt: "#f2e9e1", sub: "#907aa9", main: "#575279", caret: "#ea9d34", error: "#b4637a", errorExtra: "#5a323d", line: "#e5dcd4" },
];