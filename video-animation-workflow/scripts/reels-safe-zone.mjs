#!/usr/bin/env node

import process from "node:process";

function readNumber(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flag} must be a positive number`);
  }
  return value;
}

function clearance(size, ratio) {
  return Math.ceil(size * ratio);
}

const width = readNumber("--width", 1080);
const height = readNumber("--height", 1920);
const top = clearance(height, 0.14);
const bottom = clearance(height, 0.35);
const left = clearance(width, 0.06);
const right = clearance(width, 0.06);
const captionRight = clearance(width, 0.10);

const report = {
  canvas: {
    width,
    height,
    aspectRatio: `${width}:${height}`,
    isNineBySixteen: Math.abs(width / height - 9 / 16) < 0.001,
  },
  metaGuideDerived: {
    sourceNote:
      "Bottom 35% is from Meta's official Reels ads guide; top 14% and sides 6% are supplemental Meta-branded guide geometry.",
    clearances: {
      top: { ratio: 0.14, pixels: top },
      bottom: { ratio: 0.35, pixels: bottom },
      left: { ratio: 0.06, pixels: left },
      right: { ratio: 0.06, pixels: right },
    },
    safeRect: {
      x1: left,
      y1: top,
      x2: width - right,
      y2: height - bottom,
      width: width - left - right,
      height: height - top - bottom,
    },
  },
  workflowCaptionGuardrail: {
    note: "10% right clearance is a conservative workflow rule for the interaction rail.",
    clearances: {
      top,
      bottom,
      left,
      right: captionRight,
    },
    safeRect: {
      x1: left,
      y1: top,
      x2: width - captionRight,
      y2: height - bottom,
      width: width - left - captionRight,
      height: height - top - bottom,
    },
  },
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const meta = report.metaGuideDerived.safeRect;
  const caption = report.workflowCaptionGuardrail.safeRect;
  process.stdout.write(
    [
      `Canvas: ${width}x${height}`,
      `Conservative Reels critical rectangle: x=${meta.x1}-${meta.x2}, y=${meta.y1}-${meta.y2}`,
      `Workflow caption rectangle: x=${caption.x1}-${caption.x2}, y=${caption.y1}-${caption.y2}`,
      report.canvas.isNineBySixteen
        ? "Aspect ratio check: 9:16"
        : "Warning: canvas is not 9:16",
      "",
    ].join("\n"),
  );
}
