// Deterministic, non-scannable data-matrix visual generated from a string.
// Ported verbatim from the prototype (assets/app.js) so the certificate keeps
// its distinctive look. Purely decorative — the real check is the record ID.

function isFinder(x, y, N) {
  return (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
}

function finder(ctx, ox, oy, cell) {
  ctx.fillStyle = "#0B2A26";
  ctx.fillRect(ox, oy, cell * 7, cell * 7);
  ctx.fillStyle = "#fff";
  ctx.fillRect(ox + cell, oy + cell, cell * 5, cell * 5);
  ctx.fillStyle = "#1F8A70";
  ctx.fillRect(ox + cell * 2, oy + cell * 2, cell * 3, cell * 3);
  ctx.fillStyle = "#0B2A26";
}

export function drawQR(canvas, str) {
  if (!canvas || !canvas.getContext) return;
  const N = 25;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cell = Math.floor(size / N);
  const pad = Math.floor((size - cell * N) / 2);
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#0B2A26";

  let h = 2166136261;
  const bit = (i) => {
    h ^= str.charCodeAt(i % str.length) + i * 131;
    h = Math.imul(h, 16777619);
    return (h >>> (i % 29)) & 1;
  };

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (isFinder(x, y, N)) continue;
      if (bit(y * N + x + 7)) ctx.fillRect(pad + x * cell, pad + y * cell, cell, cell);
    }
  }
  finder(ctx, pad, pad, cell);
  finder(ctx, pad + (N - 7) * cell, pad, cell);
  finder(ctx, pad, pad + (N - 7) * cell, cell);
}
