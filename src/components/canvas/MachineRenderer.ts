import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { PixiFacilityRect } from "./usePixiSceneModel";
import { getFacilityVisual, ROLE_COLORS } from "./facilityVisuals";
import type { FacilityEmblemType } from "./facilityVisuals";
import { drawEmblem, drawRoleTriangle } from "./FacilityEmblems";

const FACILITY_FONT = "monospace";
const ITEM_FONT = "sans-serif";

// Shared styles — created once, reused
const sharedNameStyle = new TextStyle({
  fontFamily: FACILITY_FONT,
  fontSize: 9,
  fontWeight: "bold",
  fill: 0xdddddd,
  wordWrap: true,
});

const sharedItemStyle = new TextStyle({
  fontFamily: ITEM_FONT,
  fontSize: 7,
  fill: 0x888888,
  wordWrap: true,
});

function machineBaseColor(fac: PixiFacilityRect): number {
  return getFacilityVisual(fac.facilityId, fac.category).baseColor;
}

function machineBorderColor(fac: PixiFacilityRect): number {
  if (fac.isTarget) return 0xffc840;
  return 0x555555;
}

interface MachineRenderOptions {
  selected: boolean;
  hovered: boolean;
}

// Per-machine cache so we can update selected/hovered cheaply
interface CachedMachine {
  container: Container;
  body: Graphics;
  nameText: Text;
  itemText: Text;
  selRing: Graphics;
  glow: Graphics;
}

export function createMachineNode(fac: PixiFacilityRect): CachedMachine {
  const container = new Container();
  const { x, y, w, h, isTarget } = fac;

  const visual = getFacilityVisual(fac.facilityId, fac.category);
  const baseColor = machineBaseColor(fac);
  const borderColor = machineBorderColor(fac);

  // Outer glow for target / selected
  const glow = new Graphics();
  if (isTarget) {
    glow.roundRect(x - 2, y - 2, w + 4, h + 4, 3);
    glow.fill({ color: 0xffc840, alpha: 0.15 });
    container.addChild(glow);
  }

  // Machine body
  const body = new Graphics();
  body.roundRect(x, y, w, h, 2);
  body.fill({ color: baseColor, alpha: 0.88 });
  body.stroke({ width: isTarget ? 2 : 1, color: borderColor, alpha: 0.7 });
  container.addChild(body);

  // Inner panel
  const innerPad = 3;
  const innerBody = new Graphics();
  innerBody.roundRect(x + innerPad, y + innerPad, w - innerPad * 2, h - innerPad * 2, 1);
  innerBody.fill({ color: 0x000000, alpha: 0.2 });
  container.addChild(innerBody);

  // Emblem in the body center
  const emblemSize = Math.min(w, h) * 0.45;
  const emblemCx = x + w / 2;
  const emblemCy = y + h * 0.55;
  const emblemG = new Graphics();
  drawEmblem(emblemG, visual.emblemType as FacilityEmblemType, emblemCx, emblemCy, emblemSize);
  container.addChild(emblemG);

  // Role corner triangle
  const roleColor = ROLE_COLORS[fac.role] ?? ROLE_COLORS.intermediate;
  const triG = new Graphics();
  drawRoleTriangle(triG, x, y, w, h, roleColor);
  container.addChild(triG);

  // Top label: facility name
  const nameStyle = sharedNameStyle.clone();
  nameStyle.wordWrapWidth = w - 4;
  nameStyle.fill = isTarget ? 0xffc840 : 0xdddddd;
  const nameText = new Text({ text: fac.facilityName || "???", style: nameStyle });
  const nameScale = Math.min(1, (w - 6) / nameText.width);
  nameText.scale.set(nameScale);
  nameText.position.set(x + (w - nameText.width * nameScale) / 2, y + 3);
  container.addChild(nameText);

  // Below name: output item
  const itemStyle = sharedItemStyle.clone();
  itemStyle.wordWrapWidth = w - 6;
  const itemText = new Text({ text: fac.outputItemName || "???", style: itemStyle });
  const itemScale = Math.min(1, (w - 6) / itemText.width);
  itemText.scale.set(itemScale);
  itemText.position.set(x + (w - itemText.width * itemScale) / 2, y + 4 + (nameText.height || 10) * nameScale);
  container.addChild(itemText);

  // Selection ring (added only when selected via updateMachineNode)
  const selRing = new Graphics();
  selRing.visible = false;
  container.addChild(selRing);

  return { container, body, nameText, itemText, selRing, glow };
}

export function updateMachineNode(
  cached: CachedMachine,
  fac: PixiFacilityRect,
  opts: MachineRenderOptions,
): void {
  const { x, y, w, h, isTarget } = fac;
  const baseColor = machineBaseColor(fac);
  const borderColor = machineBorderColor(fac);

  // Glow
  cached.glow.visible = isTarget || opts.selected || opts.hovered;
  if (cached.glow.visible) {
    cached.glow.clear();
    cached.glow.roundRect(x - 2, y - 2, w + 4, h + 4, 3);
    cached.glow.fill({ color: isTarget ? 0xffc840 : opts.selected ? 0xffd060 : 0xffd060, alpha: 0.15 });
  }

  // Body
  cached.body.clear();
  cached.body.roundRect(x, y, w, h, 2);
  cached.body.fill({ color: baseColor, alpha: opts.hovered ? 0.95 : 0.88 });
  cached.body.stroke({ width: isTarget ? 2 : 1, color: borderColor, alpha: opts.selected ? 1 : 0.7 });

  // Name
  cached.nameText.text = fac.facilityName || "???";
  cached.nameText.style.fill = isTarget ? 0xffc840 : 0xdddddd;
  const nameScale = Math.min(1, (w - 6) / cached.nameText.width);
  cached.nameText.scale.set(nameScale);
  cached.nameText.position.set(x + (w - cached.nameText.width * nameScale) / 2, y + 3);

  // Item
  cached.itemText.text = fac.outputItemName || "???";
  const itemScale = Math.min(1, (w - 6) / cached.itemText.width);
  cached.itemText.scale.set(itemScale);
  cached.itemText.position.set(x + (w - cached.itemText.width * itemScale) / 2, y + 4 + (cached.nameText.height || 10) * nameScale);

  // Selection ring
  cached.selRing.clear();
  if (opts.selected) {
    cached.selRing.roundRect(x - 1, y - 1, w + 2, h + 2, 2);
    cached.selRing.stroke({ width: 1.5, color: 0xffd060, alpha: 0.9 });
  }

  // Role triangle — redraw each time since colors can change
  const triG = cached.container.children.find((c) => c instanceof Graphics && c !== cached.body && c !== cached.glow && c !== cached.selRing) as Graphics | undefined;
  if (triG) {
    triG.clear();
    const roleColor = ROLE_COLORS[fac.role] ?? ROLE_COLORS.intermediate;
    drawRoleTriangle(triG, x, y, w, h, roleColor);
  }
}
