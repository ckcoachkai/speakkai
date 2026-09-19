// Face-only source rectangles; clip in canvas so the supplied photos stay exact.
// Hair, suit, limbs and the existing animation mesh remain the original artwork.
export const TRUMP_FACE_CROPS = [
  [33, 235, 510, 508], [176, 65, 145, 161], [158, 65, 252, 244],
  [171, 101, 232, 231], [132, 0, 385, 365], [82, 0, 413, 365],
  [66, 214, 183, 206], [208, 87, 187, 199], [0, 0, 273, 365],
];

export function composeTrumpFace(base, photo, index) {
  const canvas = document.createElement('canvas');
  canvas.width = base.width; canvas.height = base.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(base, 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(180, 134);
  ctx.bezierCurveTo(204, 115, 259, 120, 286, 142);
  ctx.bezierCurveTo(301, 163, 302, 199, 283, 226);
  ctx.bezierCurveTo(273, 246, 244, 256, 222, 252);
  ctx.bezierCurveTo(194, 251, 182, 229, 175, 204);
  ctx.bezierCurveTo(169, 179, 169, 149, 180, 134);
  ctx.closePath(); ctx.clip();
  ctx.drawImage(photo, ...TRUMP_FACE_CROPS[index], 169, 121, 134, 135);
  ctx.restore();
  return canvas;
}
