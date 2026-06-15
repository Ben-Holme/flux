const EVENT_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  introStory: { label: "Origin",   icon: "/unyha-icons/history.svg",   color: "#b48fff" },
  trip:       { label: "Journey",  icon: "/unyha-icons/Nav.svg",        color: "#c9a86c" },
  owch:       { label: "Item",     icon: "/unyha-icons/Inventory.svg",  color: "#e1a965" },
  tome:       { label: "Tome",     icon: "/unyha-icons/quest.svg",      color: "#7fa8e1" },
  ench:       { label: "Enchant",  icon: "/unyha-icons/mage.svg",       color: "#7fe1a8" },
  minigame:   { label: "Activity", icon: "/unyha-icons/Skills.svg",     color: "#c8923a" },
  season:     { label: "Season",   icon: "/unyha-icons/Time.svg",       color: "#f4a86a" },
};

export default EVENT_TYPES;
