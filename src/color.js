const RAD = Math.PI / 180;
const D65 = [0.95047, 1, 1.08883];

function linearize(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function labF(t) {
  return t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
}

export function srgbToLab(r, g, b) {
  const [lr, lg, lb] = [linearize(r), linearize(g), linearize(b)];
  const x = labF((lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / D65[0]);
  const y = labF((lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175) / D65[1]);
  const z = labF((lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / D65[2]);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function hueDegrees(b, a) {
  if (a === 0 && b === 0) return 0;
  const h = Math.atan2(b, a) / RAD;
  return h < 0 ? h + 360 : h;
}

// Sharma, Wu & Dalal (2005) formulation, kL = kC = kH = 1.
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const cBar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + g);
  const a2p = a2 * (1 + g);
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const h1p = hueDegrees(b1, a1p);
  const h2p = hueDegrees(b2, a2p);
  const chromaProduct = c1p * c2p;

  let dhp = 0;
  if (chromaProduct !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dLp = L2 - L1;
  const dCp = c2p - c1p;
  const dHp = 2 * Math.sqrt(chromaProduct) * Math.sin((dhp / 2) * RAD);

  const lBarP = (L1 + L2) / 2;
  const cBarP = (c1p + c2p) / 2;
  let hBarP = h1p + h2p;
  if (chromaProduct !== 0) {
    if (Math.abs(h1p - h2p) > 180) hBarP += hBarP < 360 ? 360 : -360;
    hBarP /= 2;
  }

  const t = 1
    - 0.17 * Math.cos((hBarP - 30) * RAD)
    + 0.24 * Math.cos(2 * hBarP * RAD)
    + 0.32 * Math.cos((3 * hBarP + 6) * RAD)
    - 0.2 * Math.cos((4 * hBarP - 63) * RAD);
  const dTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const rC = 2 * Math.sqrt(cBarP ** 7 / (cBarP ** 7 + 25 ** 7));
  const sL = 1 + (0.015 * (lBarP - 50) ** 2) / Math.sqrt(20 + (lBarP - 50) ** 2);
  const sC = 1 + 0.045 * cBarP;
  const sH = 1 + 0.015 * cBarP * t;
  const rT = -Math.sin(2 * dTheta * RAD) * rC;

  return Math.sqrt(
    (dLp / sL) ** 2 + (dCp / sC) ** 2 + (dHp / sH) ** 2 + rT * (dCp / sC) * (dHp / sH),
  );
}
