import { Graphics } from "pixi.js";
import type { FacilityEmblemType } from "./facilityVisuals";

export function drawEmblem(g: Graphics, type: FacilityEmblemType, cx: number, cy: number, size: number): void {
  const hs = size / 2;
  switch (type) {
    case "refining": {
      g.moveTo(cx - hs * 0.6, cy - hs);
      g.lineTo(cx + hs * 0.6, cy - hs);
      g.lineTo(cx + hs * 0.6, cy + hs);
      g.lineTo(cx - hs * 0.6, cy + hs);
      g.lineTo(cx - hs * 0.6, cy - hs);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.moveTo(cx, cy - hs * 0.5);
      g.lineTo(cx, cy + hs * 0.5);
      g.moveTo(cx - hs * 0.4, cy);
      g.lineTo(cx + hs * 0.4, cy);
      break;
    }
    case "shredding": {
      const teeth = 6;
      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = ((i + 0.5) / teeth) * Math.PI * 2;
        const r0 = hs * 0.7;
        const r1 = hs;
        g.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
        g.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
        g.lineTo(cx + Math.cos((i + 1) / teeth * Math.PI * 2) * r0, cy + Math.sin((i + 1) / teeth * Math.PI * 2) * r0);
      }
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.circle(cx, cy, hs * 0.3);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "moulding": {
      g.rect(cx - hs * 0.55, cy - hs * 0.55, hs * 1.1, hs * 1.1);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.rect(cx - hs * 0.3, cy - hs * 0.3, hs * 0.6, hs * 0.6);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "fitting": {
      g.moveTo(cx, cy - hs);
      g.lineTo(cx + hs * 0.87, cy + hs * 0.5);
      g.lineTo(cx - hs * 0.87, cy + hs * 0.5);
      g.closePath();
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.circle(cx, cy, hs * 0.4);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "planting": {
      for (let i = 0; i < 3; i++) {
        const angle = -Math.PI / 2 + (i - 1) * 0.6;
        const ex = cx + Math.cos(angle) * hs * 0.7;
        const ey = cy + Math.sin(angle) * hs * 0.7;
        g.moveTo(cx, cy);
        g.lineTo(ex, ey);
        g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
        g.circle(ex, ey, hs * 0.2);
        g.fill({ color: 0xffffff, alpha: 0.2 });
      }
      break;
    }
    case "seed_picking": {
      g.circle(cx, cy, hs * 0.5);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.moveTo(cx - hs * 0.5, cy);
      g.lineTo(cx + hs * 0.5, cy);
      g.moveTo(cx, cy - hs * 0.5);
      g.lineTo(cx, cy + hs * 0.5);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "gearing": {
      const teeth = 8;
      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = ((i + 0.5) / teeth) * Math.PI * 2;
        const r0 = hs * 0.55;
        const r1 = hs * 0.85;
        g.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
        g.lineTo(cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1);
        g.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
        g.lineTo(cx + Math.cos(a1) * r0, cy + Math.sin(a1) * r0);
      }
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.circle(cx, cy, hs * 0.35);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "filling": {
      g.moveTo(cx - hs * 0.5, cy - hs * 0.6);
      g.lineTo(cx + hs * 0.5, cy - hs * 0.6);
      g.lineTo(cx + hs * 0.5, cy + hs * 0.4);
      g.lineTo(cx - hs * 0.5, cy + hs * 0.4);
      g.closePath();
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.moveTo(cx, cy - hs * 0.6);
      g.lineTo(cx, cy - hs * 0.2);
      g.stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "packaging": {
      g.rect(cx - hs * 0.5, cy - hs * 0.5, hs, hs);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.moveTo(cx - hs * 0.5, cy - hs * 0.5);
      g.lineTo(cx + hs * 0.5, cy + hs * 0.5);
      g.moveTo(cx + hs * 0.5, cy - hs * 0.5);
      g.lineTo(cx - hs * 0.5, cy + hs * 0.5);
      g.stroke({ width: 1, color: 0xffffff, alpha: 0.25 });
      break;
    }
    case "grinding": {
      g.circle(cx, cy, hs * 0.6);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        g.moveTo(cx + Math.cos(a) * hs * 0.25, cy + Math.sin(a) * hs * 0.25);
        g.lineTo(cx + Math.cos(a) * hs * 0.55, cy + Math.sin(a) * hs * 0.55);
        g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      }
      break;
    }
    case "reactor": {
      g.moveTo(cx, cy - hs);
      g.quadraticCurveTo(cx + hs, cy - hs, cx + hs, cy);
      g.quadraticCurveTo(cx + hs, cy + hs, cx, cy + hs);
      g.quadraticCurveTo(cx - hs, cy + hs, cx - hs, cy);
      g.quadraticCurveTo(cx - hs, cy - hs, cx, cy - hs);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.circle(cx, cy, hs * 0.35);
      g.fill({ color: 0xffffff, alpha: 0.15 });
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "forge": {
      g.moveTo(cx - hs * 0.4, cy + hs * 0.7);
      g.lineTo(cx - hs * 0.2, cy - hs * 0.5);
      g.lineTo(cx + hs * 0.2, cy - hs * 0.5);
      g.lineTo(cx + hs * 0.4, cy + hs * 0.7);
      g.closePath();
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.moveTo(cx - hs * 0.5, cy + hs * 0.7);
      g.lineTo(cx + hs * 0.5, cy + hs * 0.7);
      g.stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "separating": {
      g.moveTo(cx, cy - hs);
      g.lineTo(cx + hs, cy);
      g.lineTo(cx, cy + hs);
      g.lineTo(cx - hs, cy);
      g.closePath();
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.circle(cx, cy, hs * 0.3);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      break;
    }
    case "generic":
    default: {
      g.rect(cx - hs * 0.5, cy - hs * 0.5, hs, hs);
      g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.3 });
      g.moveTo(cx - hs * 0.35, cy - hs * 0.35);
      g.lineTo(cx + hs * 0.35, cy + hs * 0.35);
      g.moveTo(cx + hs * 0.35, cy - hs * 0.35);
      g.lineTo(cx - hs * 0.35, cy + hs * 0.35);
      g.stroke({ width: 1, color: 0xffffff, alpha: 0.2 });
      break;
    }
  }
}

export function drawRoleTriangle(g: Graphics, x: number, y: number, w: number, h: number, color: number): void {
  const s = Math.min(w, h) * 0.22;
  g.moveTo(x + w, y + h);
  g.lineTo(x + w, y + h - s);
  g.lineTo(x + w - s, y + h);
  g.closePath();
  g.fill({ color, alpha: 0.85 });
}
