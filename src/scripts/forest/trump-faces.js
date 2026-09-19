// Face-only source rectangles; clip in canvas so the supplied photos stay exact.
// Natural photo hair replaces the flame silhouette; suit and limbs stay intact.
export const TRUMP_FACE_CROPS = [
  [5, 0, 581, 743], [163, 15, 174, 211], [139, 0, 288, 309],
  [153, 0, 258, 332], [115, 0, 421, 365], [56, 0, 459, 365],
  [52, 159, 205, 261], [194, 29, 222, 257], [0, 0, 273, 365],
];

export function composeTrumpFace(base, photo, index) {
  const canvas = document.createElement('canvas');
  canvas.width = base.width; canvas.height = base.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(base, 0, 0);
  ctx.clearRect(145, 0, 220, 228);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(178, 124);
  ctx.bezierCurveTo(173, 76, 279, 72, 296, 117);
  ctx.bezierCurveTo(302, 130, 299, 145, 298, 160);
  ctx.bezierCurveTo(301, 163, 302, 199, 283, 226);
  ctx.bezierCurveTo(273, 246, 244, 256, 222, 252);
  ctx.bezierCurveTo(194, 251, 182, 229, 175, 204);
  ctx.bezierCurveTo(169, 179, 169, 149, 178, 124);
  ctx.closePath(); ctx.clip();
  ctx.drawImage(photo, ...TRUMP_FACE_CROPS[index], 169, 84, 134, 172);
  ctx.restore();
  return canvas;
}
