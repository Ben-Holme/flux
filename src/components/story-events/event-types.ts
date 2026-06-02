const EVENT_TYPES: Record<string, { label: string; symbol: string; color: string }> = {
  introStory: { label: "Origin",   symbol: "◈", color: "#b48fff" },
  trip:       { label: "Journey",  symbol: "▶", color: "#c9a86c" },
  owch:       { label: "Item",     symbol: "✦", color: "#e1a965" },
  tome:       { label: "Tome",     symbol: "▣", color: "#7fa8e1" },
  ench:       { label: "Enchant",  symbol: "✧", color: "#7fe1a8" },
  minigame:   { label: "Activity", symbol: "◉", color: "#ffd98f" },
  season:     { label: "Season",   symbol: "◇", color: "#f4a86a" },
};

export default EVENT_TYPES;
