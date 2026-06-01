"use client";

import { useRef } from "react";
import styles from "./skills-carousel.module.css";

const WARRIOR_ICON = (
  <svg width="33" height="33" viewBox="0 0 33 33" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.22461 4.88509V19.5518L8.55794 22.2184L16.5579 30.2184H17.8913L25.8913 22.2184L27.2246 19.5518V4.88509H19.8913L17.1111 3.55176L14.5579 4.88509H7.22461ZM13.8913 7.55183H9.89135L9.89128 13.5518H13.8913L9.89128 17.5518L9.89122 18.8852L10.5579 20.2185L17.2246 26.8852L23.8912 20.2185L24.5579 18.8852L17.8913 15.5518H24.5579L24.558 12.8852L20.5579 10.8852H24.5579L24.558 7.55183H20.558L17.2247 5.878L13.8913 7.55183Z"
      fill="white"
    />
  </svg>
);

const RANGER_ICON = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 0H14.667V1.33301L0 16L14.667 30.667V32H16L16.0003 30L22.667 26.6667V23.3333L24.0003 20.6667V16.6668H31.9997L25.333 13.3335L26.6663 15.3335H24.0003V11.3333L22.667 8.66667V5.33333L16.0003 2L16 0ZM22.667 15.3335V12L21.3337 9.33333V6L14.667 2.66667L1.99984 15.3335H3.99967V14.0002L6.66634 15.3335L5.99967 13.3335L7.99967 15.3335H9.33301L8.66634 13.3335L12.6663 15.3335H18.6667V13.3333L17.3333 10.6667V8L16 6L18.6667 7.33333V10L20 12.6667V15.3335H22.667ZM18.6667 16.6668V18.6667L17.3333 21.3333V24L16 26L18.6667 24.6667V22L20 19.3333V16.6668H22.667V20L21.3337 22.6667V26L14.667 29.3333L2.00016 16.6668H3.99967V18.0002L6.66634 16.6668L5.99967 18.6668L7.99967 16.6668H9.33301L8.66634 18.6668L12.6663 16.6668H18.6667Z"
      fill="#D9D9D9"
    />
    <path
      d="M21.333 2L25.333 4V8L26.6663 10.6667V12L27.9997 12.6667V10L26.6663 7.33333V3.33333L23.9997 2H21.333Z"
      fill="#D9D9D9"
    />
    <path
      d="M27.9997 18.6667H26.6663V21.3333L25.333 24V28L21.333 30H23.9997L26.6663 28.6667V24.6667L27.9997 22V18.6667Z"
      fill="#D9D9D9"
    />
  </svg>
);

const MAGE_ICON = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M11.088 18.8185L5.9451 22.3265L16.8555 0V13.1815L21.9984 9.67353L11.088 32V18.8185Z"
      fill="white"
    />
    <path d="M29.3337 17.3333L16.8555 28.6667L29.3337 5.33333V17.3333Z" fill="white" />
    <path d="M2.66699 10.6667L11.088 2.66667L2.66699 17.3333V10.6667Z" fill="white" />
  </svg>
);

const CRAFTER_ICON = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M24.667 14L20.667 18L27.3337 24.6667V31.3333L17.3337 21.3333L6.66699 32V25.3333L14.0003 18L9.33366 13.3333L2.66699 20V9.33333L12.0003 0L17.3337 5.33333L12.667 10L17.3337 14.6667L21.3337 10.6667V6.66667L24.667 3.33333H28.667L24.667 7.33333V10.6364H28.0003L32.0002 6.66667V10.6364L29.3337 14H24.667Z"
      fill="white"
    />
  </svg>
);

const SKILLS = [
  {
    title: "Defence",
    text: "The art of taking a beating wearing heavy metal. Master this skill and become the party tank.",
    img: "/img/defence.png",
    icon: WARRIOR_ICON,
    category: "Warrior",
  },
  {
    title: "Melee",
    text: "Study and unlock hundreds of weapon combinations, abilities, and battle tactics. Short-ranged damage galore.",
    img: "/img/melee.png",
    icon: WARRIOR_ICON,
    category: "Warrior",
  },
  {
    title: "Healing",
    text: "Bandages come in many forms. Keep your party and yourself patched up and ready for battle.",
    img: "/img/Healing.png",
    icon: WARRIOR_ICON,
    category: "Warrior",
  },
  {
    title: "Taming",
    text: "Tame, control, and train wild beasts into loyal companions. Hundreds of available pets and mounts.",
    img: "/img/Taming.png",
    icon: RANGER_ICON,
    category: "Ranger",
  },
  {
    title: "Archery",
    text: "Bow and arrow gives you a ranged advantage, and a wide range of air-whistling pain induction.",
    img: "/img/Archery.png",
    icon: RANGER_ICON,
    category: "Ranger",
  },
  {
    title: "Huntercraft",
    text: "Be aware of your surroundings. Handy whether you want to avoid danger, or hunt for prey.",
    img: "/img/tracking.png",
    icon: RANGER_ICON,
    category: "Ranger",
  },
  {
    title: "Magery",
    text: "Train your mind to control the elements. Channel your magic through Spellstaves to amplify your power.",
    img: "/img/Magery.png",
    icon: MAGE_ICON,
    category: "Mage",
  },
  {
    title: "Meditation",
    text: "Focus your mind to regain mana, and master the art of Manaflow to maintain an unstoppable wave of magic.",
    img: "/img/Meditation.png",
    icon: MAGE_ICON,
    category: "Mage",
  },
  {
    title: "Alchemy",
    text: "Brew powerful potions, and uncover the sacred art of Alchemical Infusion and craft magical staves.",
    img: "/img/Alchemy.png",
    icon: MAGE_ICON,
    category: "Mage",
  },
  {
    title: "Woodcrafting",
    text: "Master the art of shaping, carving, and crafting with wood. Learn how to tame the wildest and rarest of timbers.",
    img: "/img/Woodcrafting.png",
    icon: CRAFTER_ICON,
    category: "Crafter",
  },
  {
    title: "Blacksmithing",
    text: "Craft metal tools, armor, and weapons. Discover magical properties of forgotten materials.",
    img: "/img/Blacksmithing.png",
    icon: CRAFTER_ICON,
    category: "Crafter",
  },
  {
    title: "Tailoring",
    text: "Sew fancy clothes, and sturdy leather armor. Find and handle delicate hides from mighty creatures.",
    img: "/img/Tailoring.png",
    icon: CRAFTER_ICON,
    category: "Crafter",
  },
];

export default function SkillsCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    isDragging.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    startScrollLeft.current = ref.current.scrollLeft;
    ref.current.style.cursor = "grabbing";
  };
  const onMouseLeave = () => {
    isDragging.current = false;
    if (ref.current) ref.current.style.cursor = "grab";
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (ref.current) ref.current.style.cursor = "grab";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    ref.current.scrollLeft = startScrollLeft.current - (x - startX.current);
  };

  return (
    <div
      ref={ref}
      className={styles.carouselWrapper}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
      <div className={styles.carousel}>
        {SKILLS.map((skill) => (
          <div
            key={skill.title}
            className={styles.item}
            style={{ backgroundImage: `url(${skill.img})` }}
          >
            <div className={styles.mask} />
            <div className={styles.skillTitle}>
              <h3 className={styles.title}>{skill.title}</h3>
              <div>
                <span className={styles.bubble}>{skill.category}</span>
                {skill.icon}
              </div>
            </div>
            <p className="py-4">{skill.text}</p>
            <svg
              className="absolute bottom-6 left-6 z-2 opacity-10 md:left-10"
              width="25"
              height="34"
              viewBox="0 0 25 34"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 0H25V14H12V8H19V6H6V8H10V24H15V22H12V16H25V18H14V20H17V26H8V10H4V4H21V10H14V12H23V2H2V12H6V28H19V20H25V34H0V18V16H2V32H23V22H21V30H4V14H0V0Z"
                fill="white"
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
