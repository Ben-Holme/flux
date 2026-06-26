"use client";
import { useEffect, useRef, useState } from "react";
import {
  PALETTE, TORSO_FRONT, WALK_LEGS, IDLE_LEGS, IDLE_EYES,
} from "./data";
import type { CharClass } from "./types";

// ── Sprite helpers ─────────────────────────────────────────────────────────────

function buildRows(torso: string[], legs: string[], eyeRow?: string): string[] {
  const rows = [...torso];
  if (eyeRow) rows[4] = eyeRow;
  return [...rows, ...legs];
}

function applyRecolor(rows: string[], map: Record<string, string>): string[] {
  return rows.map(r => r.split("").map(c => map[c] ?? c).join(""));
}

function drawPixelRows(rows: string[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  const ctx = canvas.getContext("2d")!;
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const color = PALETTE[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(c, r, 1, 1);
    }
  });
  return canvas;
}

async function toTex(
  PIXI: typeof import("pixi.js"),
  rows: string[],
): Promise<import("pixi.js").Texture> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const tex = PIXI.Texture.from(img);
      try { (tex.source as any).scaleMode = "nearest"; } catch {}
      resolve(tex);
    };
    img.src = drawPixelRows(rows).toDataURL();
  });
}

async function makeTex(
  PIXI: typeof import("pixi.js"),
  rowSets: string[][],
): Promise<import("pixi.js").Texture[]> {
  return Promise.all(rowSets.map(r => toTex(PIXI, r)));
}

// ── Tutorial data ──────────────────────────────────────────────────────────────

const GUIDE_LINES = [
  "Welcome to the Hollow. This is a place between worlds.",
  "Every deed you do in Unyha is recorded — but only if you bind your spirit to an Unyha Tree.",
  "If you die unbound, your story vanishes. Find the trees. Bind yourself to them.",
  "Now go. Strike the dummy. Harvest the herb. Bind the sapling. The way out will open.",
];

const OBJECTIVES = [
  { id: "talk",    label: "Speak with The Shade",        hint: "Press F near the spirit to the south." },
  { id: "fight",   label: "Strike the training dummy",   hint: "Left click or J to attack. Hit it 5 times." },
  { id: "dash",    label: "Dash across the courtyard",   hint: "Hold Shift while moving to dash." },
  { id: "heal",    label: "Use a Healing Potion",        hint: "Press E — you have potions in your pack." },
  { id: "harvest", label: "Harvest the Bloodroot",       hint: "Press F near the glowing herb to the east." },
  { id: "bind",    label: "Bind to the Unyha Sapling",   hint: "Press F at the golden tree to the north." },
  { id: "exit",    label: "Leave through the portal",    hint: "Walk north to the portal and press F." },
];

const SHADE_RECOLOR: Record<string, string> = {
  "3": "A", "4": "B", "5": "C", "6": "D", "7": "B", "8": "1", "9": "E",
};

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  charClass: CharClass;
  charName: string;
  onComplete: () => void;
}

export default function TutorialWorld({ charName, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [objIdx, setObjIdx] = useState(0);
  const [dummyHits, setDummyHits] = useState(0);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueLine, setDialogueLine] = useState(0);

  // Stable refs so PixiJS closure doesn't capture stale state
  const objIdxRef = useRef(0);
  const dummyHitsRef = useRef(0);
  const showDialogueRef = useRef(false);

  const setObjIdxBoth = (n: number) => {
    objIdxRef.current = n;
    setObjIdx(n);
  };
  const setHitsBoth = (n: number) => {
    dummyHitsRef.current = n;
    setDummyHits(n);
  };
  const setDialogueBoth = (v: boolean) => {
    showDialogueRef.current = v;
    setShowDialogue(v);
  };

  // Refs for callbacks called from PixiJS closure
  const openDialogueRef = useRef<() => void>(() => {});
  const advanceObjRef = useRef<() => void>(() => {});
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  openDialogueRef.current = () => {
    setDialogueLine(0);
    setDialogueBoth(true);
  };
  advanceObjRef.current = () => {
    const next = objIdxRef.current + 1;
    setObjIdxBoth(next);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let appInst: import("pixi.js").Application | undefined;

    // Store cleanup refs for event listeners
    let _onKeyDown: ((e: KeyboardEvent) => void) | undefined;
    let _onKeyUp: ((e: KeyboardEvent) => void) | undefined;
    let _onMouseDown: ((e: MouseEvent) => void) | undefined;

    (async () => {
      const PIXI = await import("pixi.js");
      if (destroyed) return;

      try {
        (PIXI.TextureStyle as any).defaultOptions = {
          ...(PIXI.TextureStyle as any).defaultOptions,
          scaleMode: "nearest",
        };
      } catch {}

      appInst = new PIXI.Application();
      await appInst.init({
        resizeTo: window,
        background: 0x08060a,
        resolution: window.devicePixelRatio ?? 1,
        autoDensity: true,
      });
      if (destroyed) { appInst.destroy(true); return; }

      container.appendChild(appInst.canvas as HTMLCanvasElement);
      const app = appInst;

      // ── World container ──────────────────────────────────────────────────────
      const world = new PIXI.Container();
      app.stage.addChild(world);

      // ── Floor ────────────────────────────────────────────────────────────────
      const floor = new PIXI.Graphics();
      for (let x = -600; x < 600; x += 32) {
        for (let y = -480; y < 480; y += 32) {
          const dark = ((x + y) / 32) % 2 === 0;
          floor.rect(x, y, 32, 32).fill({ color: dark ? 0x0d0b12 : 0x0f0d14 });
        }
      }
      world.addChild(floor);

      // Outer stone border
      const border = new PIXI.Graphics();
      border.rect(-605, -485, 1210, 12).fill({ color: 0x2c2640 });
      border.rect(-605, 473, 1210, 12).fill({ color: 0x2c2640 });
      border.rect(-605, -485, 12, 970).fill({ color: 0x2c2640 });
      border.rect(593, -485, 12, 970).fill({ color: 0x2c2640 });
      world.addChild(border);

      // ── Decorative runes on floor ─────────────────────────────────────────────
      const runePositions: [number, number][] = [[-300, -200], [300, -200], [-300, 200], [300, 200], [0, 0]];
      for (const [rx, ry] of runePositions) {
        const rune = new PIXI.Text({
          text: "◇",
          style: { fill: 0x2c2640, fontSize: 20, fontFamily: "monospace" },
        });
        rune.anchor.set(0.5, 0.5);
        rune.x = rx; rune.y = ry;
        world.addChild(rune);
      }

      // ── Player sprite ─────────────────────────────────────────────────────────
      const walkFront = await makeTex(PIXI, WALK_LEGS.map(l => buildRows(TORSO_FRONT, l)));
      const idleFront = await makeTex(PIXI, IDLE_EYES.map(e => buildRows(TORSO_FRONT, IDLE_LEGS, e)));
      if (destroyed) { app.destroy(true); return; }

      const knight = new PIXI.AnimatedSprite(idleFront);
      knight.scale.set(3);
      knight.anchor.set(0.5, 1);
      knight.animationSpeed = 0.08;
      knight.play();
      world.addChild(knight);

      let px = 0, py = 100;
      knight.x = px; knight.y = py;

      // ── Guide NPC (The Shade) ─────────────────────────────────────────────────
      const shadeTex = await makeTex(PIXI, IDLE_EYES.map(e => applyRecolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), SHADE_RECOLOR)));
      if (destroyed) { app.destroy(true); return; }

      const shade = new PIXI.AnimatedSprite(shadeTex);
      shade.scale.set(3);
      shade.anchor.set(0.5, 1);
      shade.animationSpeed = 0.05;
      shade.alpha = 0.8;
      shade.play();
      shade.x = 0; shade.y = 280;
      world.addChild(shade);

      const shadeLabel = new PIXI.Text({
        text: "The Shade",
        style: { fill: 0xB870F0, fontSize: 9, fontFamily: "monospace" },
      });
      shadeLabel.anchor.set(0.5, 1);
      shadeLabel.x = shade.x;
      shadeLabel.y = shade.y - shade.height - 6;
      world.addChild(shadeLabel);

      // Shade glow ring
      const shadeGlow = new PIXI.Graphics();
      for (let i = 0; i < 8; i++) {
        shadeGlow.circle(0, 0, 28 - i * 2).fill({ color: 0xB870F0, alpha: 0.025 });
      }
      shadeGlow.x = shade.x; shadeGlow.y = shade.y - 20;
      world.addChild(shadeGlow);

      // ── Training Dummy ────────────────────────────────────────────────────────
      const dummyCont = new PIXI.Container();
      dummyCont.x = -250; dummyCont.y = 30;

      const dummyGfx = new PIXI.Graphics();
      dummyGfx.rect(-6, -48, 12, 48).fill({ color: 0x4d3326 });
      dummyGfx.rect(-16, -48, 32, 5).fill({ color: 0x3a2100 }); // crossbar
      dummyGfx.circle(0, -54, 9).fill({ color: 0x6b4c36 }); // head
      dummyCont.addChild(dummyGfx);

      const dummyLbl = new PIXI.Text({
        text: "Dummy (0/5)",
        style: { fill: 0xa69581, fontSize: 8, fontFamily: "monospace" },
      });
      dummyLbl.anchor.set(0.5, 1);
      dummyLbl.y = -70;
      dummyCont.addChild(dummyLbl);
      world.addChild(dummyCont);

      // ── Herb ─────────────────────────────────────────────────────────────────
      const herbCont = new PIXI.Container();
      herbCont.x = 280; herbCont.y = 220;

      const herbGfx = new PIXI.Graphics();
      herbGfx.circle(0, -5, 8).fill({ color: 0x244a30 });
      herbGfx.circle(-6, 0, 5).fill({ color: 0x4a7a40 });
      herbGfx.circle(6, 0, 5).fill({ color: 0x4a7a40 });
      herbGfx.rect(-1, 0, 2, 8).fill({ color: 0x183020 });
      herbCont.addChild(herbGfx);

      for (let i = 0; i < 6; i++) {
        const gring = new PIXI.Graphics();
        gring.circle(0, -5, 10 + i * 2).fill({ color: 0x4a7a40, alpha: 0.04 });
        herbCont.addChild(gring);
      }

      const herbLbl = new PIXI.Text({
        text: "Bloodroot",
        style: { fill: 0x4a7a40, fontSize: 8, fontFamily: "monospace" },
      });
      herbLbl.anchor.set(0.5, 1);
      herbLbl.y = -18;
      herbCont.addChild(herbLbl);
      world.addChild(herbCont);

      // ── Unyha Sapling ─────────────────────────────────────────────────────────
      const sapCont = new PIXI.Container();
      sapCont.x = 0; sapCont.y = -180;

      const sapGlow = new PIXI.Graphics();
      for (let i = 0; i < 10; i++) {
        sapGlow.circle(0, -40, 32 - i * 2).fill({ color: 0xffd98f, alpha: 0.025 });
      }
      sapCont.addChild(sapGlow);

      const sapGfx = new PIXI.Graphics();
      sapGfx.rect(-4, -60, 8, 60).fill({ color: 0x3a2100 }); // trunk
      sapGfx.circle(0, -62, 22).fill({ color: 0x183020 }); // outer foliage
      sapGfx.circle(0, -62, 14).fill({ color: 0x244a30 });
      sapGfx.circle(0, -62, 7).fill({ color: 0xffd98f, alpha: 0.25 }); // golden core
      sapCont.addChild(sapGfx);

      const sapLbl = new PIXI.Text({
        text: "Unyha Sapling",
        style: { fill: 0xffd98f, fontSize: 9, fontFamily: "monospace" },
      });
      sapLbl.anchor.set(0.5, 1);
      sapLbl.y = -90;
      sapCont.addChild(sapLbl);
      world.addChild(sapCont);

      // ── Portal (appears after binding) ────────────────────────────────────────
      const portalCont = new PIXI.Container();
      portalCont.x = 0; portalCont.y = -370;
      portalCont.visible = false;
      world.addChild(portalCont);

      for (let i = 0; i < 10; i++) {
        const pg = new PIXI.Graphics();
        pg.circle(0, 0, 36 - i * 2).fill({ color: 0x7B2FBE, alpha: 0.05 });
        portalCont.addChild(pg);
      }

      const portalLbl = new PIXI.Text({
        text: "✦ The Way Out",
        style: { fill: 0xE0AAFF, fontSize: 10, fontFamily: "monospace" },
      });
      portalLbl.anchor.set(0.5, 0.5);
      portalCont.addChild(portalLbl);

      // ── Prompt text (world-space) ─────────────────────────────────────────────
      const promptGfx = new PIXI.Text({
        text: "",
        style: { fill: 0xffd98f, fontSize: 10, fontFamily: "monospace" },
      });
      promptGfx.anchor.set(0.5, 1);
      app.stage.addChild(promptGfx);

      // ── Name banner ───────────────────────────────────────────────────────────
      const nameBanner = new PIXI.Text({
        text: charName,
        style: { fill: 0xe8e3d4, fontSize: 9, fontFamily: "monospace" },
      });
      nameBanner.anchor.set(0.5, 1);
      app.stage.addChild(nameBanner);

      // ── Input ─────────────────────────────────────────────────────────────────
      const keys: Record<string, boolean> = {};
      let attackConsumed = false;
      let fConsumed = false;
      let eConsumed = false;
      let potions = 3;
      let playerHp = 100;
      const playerMaxHp = 100;
      let flashTimer = 0;
      let tickCount = 0;

      _onKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
      _onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
      _onMouseDown = (e: MouseEvent) => { if (e.button === 0) keys["_mouse"] = true; };

      window.addEventListener("keydown", _onKeyDown);
      window.addEventListener("keyup", _onKeyUp);
      (app.canvas as HTMLCanvasElement).addEventListener("mousedown", _onMouseDown);
      (app.canvas as HTMLCanvasElement).addEventListener("mouseup", () => { keys["_mouse"] = false; });

      // ── Ticker ────────────────────────────────────────────────────────────────
      app.ticker.maxFPS = 60;
      app.ticker.add(({ deltaTime: dt }) => {
        tickCount++;
        const obj = objIdxRef.current;
        const sw = app.screen.width, sh = app.screen.height;

        // Camera
        world.x = sw / 2 - px;
        world.y = sh / 2 - py;

        // Prompt position
        promptGfx.x = sw / 2;
        promptGfx.y = sh - 56;
        nameBanner.x = sw / 2;
        nameBanner.y = sh - 72;

        // Portal visibility
        portalCont.visible = obj >= 6;

        // Pulsing effects
        const pulse = Math.sin(tickCount * 0.07);
        shadeGlow.alpha = 0.3 + 0.15 * pulse;
        sapGlow.alpha = 0.4 + 0.2 * Math.sin(tickCount * 0.06);
        if (portalCont.visible) {
          portalCont.children.forEach((c, i) => {
            if (i < 10) (c as import("pixi.js").Graphics).alpha = 0.5 + 0.3 * Math.sin(tickCount * 0.09 + i * 0.3);
          });
        }

        // Flash dummy
        if (flashTimer > 0) {
          flashTimer--;
          (dummyGfx as any).tint = flashTimer > 5 ? 0xff6666 : 0xffffff;
        }

        // ── Movement ───────────────────────────────────────────────────────────
        if (!showDialogueRef.current) {
          const dashing = keys["Shift"];
          const speed = (dashing ? 7 : 3.5) * dt;
          let dx = 0, dy = 0;
          if (keys["a"] || keys["ArrowLeft"]) dx -= 1;
          if (keys["d"] || keys["ArrowRight"]) dx += 1;
          if (keys["w"] || keys["ArrowUp"]) dy -= 1;
          if (keys["s"] || keys["ArrowDown"]) dy += 1;

          if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            px = Math.max(-575, Math.min(575, px + (dx / len) * speed));
            py = Math.max(-455, Math.min(455, py + (dy / len) * speed));
            knight.x = px; knight.y = py;
            if (knight.textures !== walkFront) { knight.textures = walkFront; knight.play(); }
            // Complete dash objective when player dashes
            if (dashing && obj === 2) advanceObjRef.current();
          } else {
            if (knight.textures !== idleFront) { knight.textures = idleFront; knight.play(); }
          }
        }

        // ── Attack (J or left click) ────────────────────────────────────────────
        const attackPressed = keys["j"] || keys["J"] || keys["_mouse"];
        if (!attackConsumed && attackPressed) {
          attackConsumed = true;
          // Only count hits when on the fight objective
          if (obj === 1) {
            const dist = Math.hypot(px - dummyCont.x, py - dummyCont.y);
            if (dist < 100) {
              const newHits = dummyHitsRef.current + 1;
              setHitsBoth(newHits);
              dummyLbl.text = `Dummy (${newHits}/5)`;
              flashTimer = 12;
              if (newHits >= 5) {
                dummyCont.visible = false;
                advanceObjRef.current();
              }
            }
          }
        }
        if (!attackPressed) attackConsumed = false;
        if (!keys["_mouse"]) keys["_mouse"] = false;

        // ── E: use potion ───────────────────────────────────────────────────────
        if (!eConsumed && (keys["e"] || keys["E"])) {
          eConsumed = true;
          if (potions > 0) {
            potions--;
            playerHp = Math.min(playerMaxHp, playerHp + 40);
            // If this is the heal objective, advance
            if (obj === 3) advanceObjRef.current();
          }
        }
        if (!keys["e"] && !keys["E"]) eConsumed = false;

        // ── F: interact ─────────────────────────────────────────────────────────
        if (!fConsumed && (keys["f"] || keys["F"])) {
          fConsumed = true;
          // Talk to shade (obj 0)
          if (obj === 0) {
            const dist = Math.hypot(px - shade.x, py - shade.y);
            if (dist < 90) openDialogueRef.current();
          }
          // Harvest herb (obj 4)
          else if (obj === 4 && herbCont.visible) {
            const dist = Math.hypot(px - herbCont.x, py - herbCont.y);
            if (dist < 70) {
              herbCont.visible = false;
              advanceObjRef.current();
            }
          }
          // Bind sapling (obj 5)
          else if (obj === 5) {
            const dist = Math.hypot(px - sapCont.x, py - sapCont.y);
            if (dist < 90) {
              sapGfx.tint = 0xffd98f;
              advanceObjRef.current();
            }
          }
          // Exit portal (obj 6)
          else if (obj >= 6 && portalCont.visible) {
            const dist = Math.hypot(px - portalCont.x, py - portalCont.y);
            if (dist < 80) onCompleteRef.current();
          }
        }
        if (!keys["f"] && !keys["F"]) fConsumed = false;

        // ── Prompt text ─────────────────────────────────────────────────────────
        const objId = OBJECTIVES[obj]?.id;
        let prompt = "";
        if (objId === "talk" && Math.hypot(px - shade.x, py - shade.y) < 90) prompt = "[F] Speak with The Shade";
        else if (objId === "fight" && Math.hypot(px - dummyCont.x, py - dummyCont.y) < 100) prompt = "[J / Click] Attack";
        else if (objId === "dash") prompt = "[Shift + WASD] Dash";
        else if (objId === "heal") prompt = "[E] Drink a Healing Potion";
        else if (objId === "harvest" && herbCont.visible && Math.hypot(px - herbCont.x, py - herbCont.y) < 70) prompt = "[F] Harvest Bloodroot";
        else if (objId === "bind" && Math.hypot(px - sapCont.x, py - sapCont.y) < 90) prompt = "[F] Bind to Unyha Sapling";
        else if (objId === "exit" && portalCont.visible && Math.hypot(px - portalCont.x, py - portalCont.y) < 80) prompt = "[F] Leave the Hollow";
        promptGfx.text = prompt;
      });
    })();

    return () => {
      destroyed = true;
      appInst?.destroy(true);
      if (_onKeyDown) window.removeEventListener("keydown", _onKeyDown);
      if (_onKeyUp) window.removeEventListener("keyup", _onKeyUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentObj = OBJECTIVES[objIdx];
  const isLastDialogue = dialogueLine >= GUIDE_LINES.length - 1;

  const advanceDialogue = () => {
    if (dialogueLine < GUIDE_LINES.length - 1) {
      setDialogueLine(d => d + 1);
    } else {
      setDialogueBoth(false);
      setDialogueLine(0);
      // Advance from objective 0 (talk) to 1 (fight)
      if (objIdxRef.current === 0) advanceObjRef.current();
    }
  };

  return (
    <div className="absolute inset-0 bg-[#08060a]">
      {/* PixiJS canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top bar: location */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 pointer-events-none">
        <p className="text-[#2c2640] text-[9px] tracking-[0.5em] uppercase font-mono">
          The Hollow · Training Grounds
        </p>
      </div>

      {/* Objectives sidebar */}
      <div className="absolute top-12 left-4 pointer-events-none">
        <p className="text-[#ffd98f] text-[8px] tracking-[0.4em] uppercase font-mono mb-2"
          style={{ textShadow: "0 0 8px #ffd98f66" }}>
          Tutorial
        </p>
        <div className="flex flex-col gap-1">
          {OBJECTIVES.map((obj, i) => (
            <div key={obj.id} className="flex items-center gap-2">
              <span className="text-[8px] font-mono"
                style={{ color: i < objIdx ? "#3d3555" : i === objIdx ? "#ffd98f" : "#1c1825" }}>
                {i < objIdx ? "✓" : i === objIdx ? "◈" : "○"}
              </span>
              <span className="text-[9px] font-mono"
                style={{
                  color: i < objIdx ? "#3d3555" : i === objIdx ? "#e8e3d4" : "#1c1825",
                  textDecoration: i < objIdx ? "line-through" : "none",
                }}>
                {obj.label}
                {obj.id === "fight" && i === objIdx ? ` (${dummyHits}/5)` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active objective hint */}
      {currentObj && objIdx < OBJECTIVES.length && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-[#564870] text-[9px] font-mono tracking-wide text-center">
            {currentObj.hint}
          </p>
        </div>
      )}

      {/* Dialogue overlay */}
      {showDialogue && (
        <div className="absolute inset-0 flex items-end justify-center pb-24 px-8 pointer-events-none">
          <div
            className="w-full max-w-[540px] bg-[#0d0b12]/95 border border-[#2c2640] p-5 pointer-events-auto"
            style={{ boxShadow: "0 0 30px rgba(184,112,240,0.15)" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="text-[#B870F0] text-[9px] tracking-[0.4em] uppercase font-mono shrink-0 pt-0.5">
                The Shade
              </span>
              <p className="text-[#e8e3d4] text-sm font-mono leading-relaxed italic">
                &ldquo;{GUIDE_LINES[dialogueLine]}&rdquo;
              </p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#3d3555] text-[8px] font-mono">
                {dialogueLine + 1} / {GUIDE_LINES.length}
              </span>
              <button
                onClick={advanceDialogue}
                className="border border-[#3d3555] text-[#a69581] text-[9px] uppercase tracking-[0.3em] px-4 py-1.5 font-mono hover:border-[#B870F0] hover:text-[#B870F0] transition-colors"
              >
                {isLastDialogue ? "Begin" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip link */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => onCompleteRef.current()}
          className="text-[#2c2640] text-[8px] uppercase tracking-widest font-mono hover:text-[#564870] transition-colors"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}
