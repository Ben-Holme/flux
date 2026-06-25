"use client";

import { useEffect, useRef } from "react";

const PALETTE: Record<string, string | null> = {
  "0": null,
  "1": "#0d0b12",
  "2": "#16131f",
  "3": "#2c2640",
  "4": "#3d3555",
  "5": "#564870",
  "6": "#ffd98f",
  "7": "#c8923a",
  "8": "#b8442a",
  "9": "#e8e3d4",
};

const TORSO: string[] = [
  "0000011111100000", // 00 helmet crown
  "0000134444310000", // 01 dome
  "0000134594310000", // 02 dome highlight
  "0000133343310000", // 03 brow ridge
  "0000138118310000", // 04 visor eyes
  "0000133663310000", // 05 gold visor slit
  "0001133333310000", // 06 chin guard
  "0013344444431000", // 07 gorget
  "0134454444543410", // 08 pauldrons
  "0134455455543410", // 09 upper chest
  "0133456666543310", // 10 breastplate
  "0133366666633310", // 11 gold band
  "0133336666333310", // 12 breastplate lower
  "0113337667333110", // 13 plackart
  "0016666666666100", // 14 gold belt
  "0011333443331100", // 15 fauld
  "0001334443331000", // 16 tassets
  "0001331001331000", // 17 upper greaves
  "0001331001331000", // 18 greaves
];

const WALK_LEGS: string[][] = [
  // 0 — neutral
  [
    "0001341001431000",
    "0001331001331000",
    "0001331001331000",
    "0001331001331000",
    "0013331001333100",
  ],
  // 1 — right planted, left raised
  [
    "0001310001431000",
    "0001310001331000",
    "0001100001331000",
    "0001000001331000",
    "0000000001333100",
  ],
  // 2 — neutral (same as 0, for cycle symmetry)
  [
    "0001341001431000",
    "0001331001331000",
    "0001331001331000",
    "0001331001331000",
    "0013331001333100",
  ],
  // 3 — left planted, right raised
  [
    "0001431001310000",
    "0001331001310000",
    "0001331001100000",
    "0001331001000000",
    "0013331000000000",
  ],
];

const IDLE_LEGS = WALK_LEGS[0];
const IDLE_EYES = ["0000138118310000", "0000133113310000"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRows(legs: string[], eyeRow?: string): string[] {
  const rows = [...TORSO];
  if (eyeRow) rows[4] = eyeRow;
  return [...rows, ...legs];
}

// Shift just the head+torso (rows 0-16) by n pixels; positive = rightward lean
function buildLeanRows(legs: string[], lean: number, eyeRow?: string): string[] {
  const rows = buildRows(legs, eyeRow);
  const shift = (row: string, n: number) =>
    n > 0 ? "0".repeat(n) + row.slice(0, 16 - n) : row.slice(-n) + "0".repeat(-n);
  return rows.map((row, i) => (i < 17 ? shift(row, lean) : row));
}

// ── Attack frames ─────────────────────────────────────────────────────────────
// Wind-up pulls back (lean -1), strike lunges forward (lean +2) with leg step.
const ATTACK_ROWS = [
  buildRows(WALK_LEGS[0]), // 0: ready stance
  buildLeanRows(WALK_LEGS[0], -1), // 1: pull back
  buildLeanRows(WALK_LEGS[1], 2), // 2: STRIKE — lean in, right leg plants
  buildLeanRows(WALK_LEGS[0], 1), // 3: follow-through
];

// ── Dash frames ───────────────────────────────────────────────────────────────
// Aggressive lean (+3) with legs pumping — afterimage trail added in ticker.
const DASH_ROWS = [
  buildLeanRows(WALK_LEGS[1], 3), // A: right planted, lunging
  buildLeanRows(WALK_LEGS[3], 3), // B: left planted, lunging
];

function drawPixelArt(rows: string[], scale: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;
  const ctx = canvas.getContext("2d")!;
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const color = PALETTE[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  });
  return canvas;
}

function canvasToTexture(
  PIXI: typeof import("pixi.js"),
  canvas: HTMLCanvasElement,
): Promise<import("pixi.js").Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const texture = PIXI.Texture.from(img);
      try {
        (texture.source as any).scaleMode = "nearest";
      } catch {}
      resolve(texture);
    };
    img.src = canvas.toDataURL();
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PixelTestPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let app: import("pixi.js").Application | undefined;
    let destroyed = false;

    (async () => {
      const PIXI = await import("pixi.js");
      if (destroyed) return;

      try {
        (PIXI.TextureStyle as any).defaultOptions = {
          ...(PIXI.TextureStyle as any).defaultOptions,
          scaleMode: "nearest",
        };
      } catch {}

      app = new PIXI.Application();
      await app.init({
        width: 640,
        height: 360,
        background: 0x0d0b12,
        antialias: false,
        resolution: 1,
      });
      if (destroyed) {
        app.destroy(true);
        return;
      }
      containerRef.current?.appendChild(app.canvas);

      const PX = 4;

      const makeTextures = (rows: string[][]): Promise<import("pixi.js").Texture[]> =>
        Promise.all(rows.map((r) => canvasToTexture(PIXI, drawPixelArt(r, PX))));

      const walkTextures = await makeTextures(WALK_LEGS.map((l) => buildRows(l)));
      const idleTextures = await makeTextures(IDLE_EYES.map((e) => buildRows(IDLE_LEGS, e)));
      const attackTextures = await makeTextures(ATTACK_ROWS);
      const dashTextures = await makeTextures(DASH_ROWS);

      const BLANK = "0000000000000000";
      const base = buildRows(WALK_LEGS[0]);
      const deathTextures = await makeTextures([
        buildRows(WALK_LEGS[0], "0000139119310000"),
        [...Array(6).fill(BLANK), ...base.slice(6)],
        [...Array(12).fill(BLANK), ...base.slice(12)],
        [
          ...Array(20).fill(BLANK),
          "0000011111100000",
          "0001344444431000",
          "0133333333333310",
          "1333333333333331",
        ],
      ]);

      if (destroyed) {
        app.destroy(true);
        return;
      }

      // ── Scene ────────────────────────────────────────────────────────────────
      const ground = new PIXI.Graphics();
      ground.rect(0, 0, 640, 360).fill(0x16131f);
      app.stage.addChild(ground);

      const knight = new PIXI.AnimatedSprite(idleTextures);
      knight.anchor.set(0.5, 1);
      knight.x = 320;
      knight.y = 180;
      knight.animationSpeed = 3 / 60;
      knight.play();
      app.stage.addChild(knight);

      // Slash effect graphic (rendered above knight)
      const slashGfx = new PIXI.Graphics();
      slashGfx.visible = false;
      app.stage.addChild(slashGfx);
      let slashTimer = 0;

      // ── State machine ─────────────────────────────────────────────────────────
      type State = "idle" | "walk" | "attack" | "dash" | "dead";
      let state: State = "idle";
      let dashTimer = 0;
      let dashCooldown = 0;
      let dashDirX = 1;
      let dashDirY = 0;

      // Afterimage pool for dash
      interface Ghost {
        sprite: import("pixi.js").Sprite;
        life: number;
      }
      const ghosts: Ghost[] = [];

      function resolveMotion(): State {
        const left = keys["ArrowLeft"] || keys["a"] || keys["A"];
        const right = keys["ArrowRight"] || keys["d"] || keys["D"];
        const up = keys["ArrowUp"] || keys["w"] || keys["W"];
        const down = keys["ArrowDown"] || keys["s"] || keys["S"];
        return left || right || up || down ? "walk" : "idle";
      }

      function setState(next: State) {
        state = next;
        knight.onComplete = undefined;
        switch (next) {
          case "idle":
            knight.textures = idleTextures;
            knight.animationSpeed = 3 / 60;
            knight.loop = true;
            knight.gotoAndPlay(0);
            break;
          case "walk":
            knight.textures = walkTextures;
            knight.animationSpeed = 10 / 60;
            knight.loop = true;
            knight.gotoAndPlay(0);
            break;
          case "attack":
            knight.textures = attackTextures;
            knight.animationSpeed = 12 / 60;
            knight.loop = false;
            knight.gotoAndPlay(0);
            knight.onComplete = () => setState(resolveMotion());
            break;
          case "dash":
            knight.textures = dashTextures;
            knight.animationSpeed = 18 / 60;
            knight.loop = true;
            knight.gotoAndPlay(0);
            dashTimer = 22;
            break;
          case "dead":
            knight.textures = deathTextures;
            knight.animationSpeed = 7 / 60;
            knight.loop = false;
            knight.gotoAndPlay(0);
            // clear ghosts
            ghosts.forEach((g) => app!.stage.removeChild(g.sprite));
            ghosts.length = 0;
            break;
        }
      }

      // ── Input ─────────────────────────────────────────────────────────────────
      const keys: Record<string, boolean> = {};
      let attackConsumed = false;
      let dieConsumed = false;
      let restartConsumed = false;
      let dashConsumed = false;

      const onDown = (e: KeyboardEvent) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key))
          e.preventDefault();
        if (!keys[e.key]) {
          if (e.key === "j" || e.key === "J" || e.key === "z" || e.key === "Z")
            attackConsumed = false;
          if (e.key === "k" || e.key === "K") dieConsumed = false;
          if (e.key === "r" || e.key === "R") restartConsumed = false;
          if (e.key === "Shift") dashConsumed = false;
        }
        keys[e.key] = true;
      };
      const onUp = (e: KeyboardEvent) => {
        keys[e.key] = false;
      };
      const clearAllInput = () => {
        for (const k of Object.keys(keys)) keys[k] = false;
        attackConsumed = false;
        dashConsumed = false;
      };
      const onBlur = clearAllInput;
      const onVisibilityChange = () => { if (document.hidden) clearAllInput(); };
      const onContextMenu = () => clearAllInput();
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);
      window.addEventListener("blur", onBlur);
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("contextmenu", onContextMenu);

      // ── Ticker ────────────────────────────────────────────────────────────────
      app.ticker.add(() => {
        const left = keys["ArrowLeft"] || keys["a"] || keys["A"];
        const right = keys["ArrowRight"] || keys["d"] || keys["D"];
        const up = keys["ArrowUp"] || keys["w"] || keys["W"];
        const down = keys["ArrowDown"] || keys["s"] || keys["S"];

        // ── Ghost fade ──────────────────────────────────────────────────────────
        for (let i = ghosts.length - 1; i >= 0; i--) {
          ghosts[i].life--;
          ghosts[i].sprite.alpha = (ghosts[i].life / 12) * 0.45;
          if (ghosts[i].life <= 0) {
            app!.stage.removeChild(ghosts[i].sprite);
            ghosts.splice(i, 1);
          }
        }

        // ── Slash fade ──────────────────────────────────────────────────────────
        if (slashTimer > 0 && --slashTimer === 0) slashGfx.visible = false;

        // ── Dead / restart ──────────────────────────────────────────────────────
        if (state === "dead") {
          if ((keys["r"] || keys["R"]) && !restartConsumed) {
            restartConsumed = true;
            knight.y = 180;
            knight.x = 320;
            knight.scale.x = 1;
            dashCooldown = 0;
            setState("idle");
          }
          return;
        }

        // ── Die ─────────────────────────────────────────────────────────────────
        if ((keys["k"] || keys["K"]) && !dieConsumed) {
          dieConsumed = true;
          setState("dead");
          return;
        }

        // ── Attack ──────────────────────────────────────────────────────────────
        const wantAttack = (keys["j"] || keys["J"] || keys["z"] || keys["Z"]) && !attackConsumed;
        if (wantAttack && (state === "idle" || state === "walk")) {
          attackConsumed = true;
          setState("attack");
        }
        if (!keys["j"] && !keys["J"] && !keys["z"] && !keys["Z"]) attackConsumed = false;

        // Show slash on strike frame
        if (state === "attack" && knight.currentFrame === 2 && slashTimer === 0) {
          const dir = knight.scale.x;
          const sx = knight.x + dir * 38;
          const sy = knight.y - 52;
          slashGfx.clear();
          slashGfx
            .moveTo(sx - dir * 8, sy - 22)
            .lineTo(sx + dir * 28, sy + 18)
            .stroke({ color: 0xffd98f, width: 5 });
          slashGfx
            .moveTo(sx + dir * 12, sy - 28)
            .lineTo(sx - dir * 4, sy + 12)
            .stroke({ color: 0xffffff, width: 2 });
          slashGfx.visible = true;
          slashTimer = 4;
        }

        // ── Dash ────────────────────────────────────────────────────────────────
        if (dashCooldown > 0) dashCooldown--;
        const wantDash = keys["Shift"] && !dashConsumed && dashCooldown === 0;
        if (wantDash && (state === "idle" || state === "walk")) {
          dashConsumed = true;

          let dx = 0;
          let dy = 0;
          if (left) dx -= 1;
          if (right) dx += 1;
          if (up) dy -= 1;
          if (down) dy += 1;

          if (dx === 0 && dy === 0) {
            dx = knight.scale.x;
          } else {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;
          }
          dashDirX = dx;
          dashDirY = dy;

          setState("dash");
        }
        if (!keys["Shift"]) dashConsumed = false;

        // ── Dash movement + afterimage ──────────────────────────────────────────
        if (state === "dash") {
          dashTimer--;
          knight.x = Math.max(40, Math.min(600, knight.x + dashDirX * 6));
          knight.y = Math.max(40, Math.min(320, knight.y + dashDirY * 6));

          // Spawn afterimage every other frame
          if (dashTimer % 2 === 0) {
            const tex = knight.textures[knight.currentFrame];
            const ghostTex = (tex as any).texture ?? tex;
            const ghost = new PIXI.Sprite(ghostTex as import("pixi.js").Texture);
            ghost.anchor.set(0.5, 1);
            ghost.x = knight.x;
            ghost.y = knight.y;
            ghost.scale.copyFrom(knight.scale);
            ghost.alpha = 0.45;
            app!.stage.addChildAt(ghost, app!.stage.getChildIndex(knight));
            ghosts.push({ sprite: ghost, life: 12 });
          }

          if (dashTimer <= 0) {
            dashCooldown = 55;
            setState(resolveMotion());
          }
          return;
        }

        // ── Horizontal and Vertical movement (idle / walk / attack) ──────────────────────────
        if (state !== "attack") {
          let dx = 0;
          let dy = 0;
          if (left) dx -= 1;
          if (right) dx += 1;
          if (up) dy -= 1;
          if (down) dy += 1;

          if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            const speed = 2;
            knight.x += (dx / len) * speed;
            knight.y += (dy / len) * speed;
          }

          knight.x = Math.max(40, Math.min(600, knight.x));
          knight.y = Math.max(40, Math.min(320, knight.y));

          if (dx < 0) knight.scale.x = -1;
          if (dx > 0) knight.scale.x = 1;
        }

        // ── Walk ↔ idle transition ───────────────────────────────────────────────
        if (state === "idle" || state === "walk") {
          const moving = !!(left || right || up || down);
          if (moving && state !== "walk") setState("walk");
          else if (!moving && state !== "idle") setState("idle");
        }
      });
      (app as any)._cleanup = () => {
        window.removeEventListener("keydown", onDown);
        window.removeEventListener("keyup", onUp);
        window.removeEventListener("blur", onBlur);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("contextmenu", onContextMenu);
      };
    })();

    return () => {
      destroyed = true;
      (app as any)?._cleanup?.();
      app?.destroy(true, { children: true, texture: true });
    };
  }, []);

  return (
    <div className="bg-void flex min-h-screen flex-col items-center justify-center gap-6">
      <p
        className="text-gold font-mono text-[11px] tracking-[0.35em] uppercase"
        style={{ textShadow: "0 0 12px #ffd98f" }}
      >
        Knight — Animation Test
      </p>
      <div ref={containerRef} className="border border-white/5" />
      <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase">
        WASD/arrows move &nbsp;·&nbsp; J/Z attack &nbsp;·&nbsp; Shift dash &nbsp;·&nbsp; K die
        &nbsp;·&nbsp; R restart
      </p>
    </div>
  );
}
