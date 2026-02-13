/**
 * Hex spiral grid layout utility.
 * Generates pixel positions for items arranged in a honeycomb pattern,
 * spiraling outward from center (ring 0 = center, ring k = 6k cells).
 */

const SQRT3 = Math.sqrt(3);

// Axial hex directions (pointy-top, clockwise from E)
const HEX_DIRS: [number, number][] = [
  [1, 0],   // E
  [0, 1],   // SE
  [-1, 1],  // SW
  [-1, 0],  // W
  [0, -1],  // NW
  [1, -1],  // NE
];

export interface HexPosition {
  x: number;
  y: number;
}

export interface HexBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Generate a hex spiral of axial coordinates, center-outward.
 * Ring 0 = 1 cell, ring k = 6k cells.
 */
function hexSpiral(count: number): [number, number][] {
  if (count <= 0) return [];
  const result: [number, number][] = [[0, 0]];

  for (let ring = 1; result.length < count; ring++) {
    // Start position of ring: (0, -ring) — top of ring
    let q = 0;
    let r = -ring;

    for (let side = 0; side < 6; side++) {
      for (let step = 0; step < ring; step++) {
        if (result.length >= count) return result;
        result.push([q, r]);
        q += HEX_DIRS[side][0];
        r += HEX_DIRS[side][1];
      }
    }
  }

  return result;
}

/**
 * Convert axial (q, r) to pixel coordinates.
 * Uses pointy-top orientation so odd rows are offset horizontally.
 */
function axialToPixel(q: number, r: number, d: number): HexPosition {
  return {
    x: d * (q + r * 0.5),
    y: d * r * (SQRT3 / 2),
  };
}

/**
 * Generate hex spiral positions for N items.
 * Returns pixel positions centered at (0, 0).
 *
 * @param count    Number of items
 * @param cellDiameter  Diameter of each circle
 * @param gap      Gap between circles
 */
export function generateHexPositions(
  count: number,
  cellDiameter: number,
  gap: number,
): HexPosition[] {
  const d = cellDiameter + gap;
  const coords = hexSpiral(count);
  return coords.map(([q, r]) => axialToPixel(q, r, d));
}

/**
 * Compute bounding box of all positions (including cell radius).
 */
export function getHexBounds(
  positions: HexPosition[],
  cellDiameter: number,
): HexBounds {
  if (positions.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const half = cellDiameter / 2;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const { x, y } of positions) {
    if (x - half < minX) minX = x - half;
    if (x + half > maxX) maxX = x + half;
    if (y - half < minY) minY = y - half;
    if (y + half > maxY) maxY = y + half;
  }

  return { minX, maxX, minY, maxY };
}
