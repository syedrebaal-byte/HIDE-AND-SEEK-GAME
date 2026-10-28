import * as THREE from 'three';

// Helper to create procedural CanvasTextures with SRGBColorSpace & anisotropy
export function createProceduralCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 1. Cyberpunk Wet Asphalt with Neon Edge Accents
export function getCyberpunkFloorTexture(): THREE.CanvasTexture {
  return createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0f1118';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1e2438';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, w, h);

    // Subtle grunge noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Neon accent stripes
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
  });
}

// 2. Temple Ancient Weathered Stone Tiles
export function getAncientStoneTexture(): THREE.CanvasTexture {
  return createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#40382d';
    ctx.fillRect(0, 0, w, h);

    // Stone tile grooves
    ctx.strokeStyle = '#261f18';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, w, h);

    // Moss and weathering specks
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(74, 107, 60, 0.25)' : 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x, y, 3, 3);
    }
  });
}

// 3. Sci-Fi Metallic Station Plating
export function getSciFiHullTexture(): THREE.CanvasTexture {
  return createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#222730';
    ctx.fillRect(0, 0, w, h);

    // Metal panel bevel
    ctx.strokeStyle = '#384152';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.strokeStyle = '#14171d';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Rivet corner dots
    ctx.fillStyle = '#64748b';
    const rivets = [
      [24, 24],
      [w - 24, 24],
      [24, h - 24],
      [w - 24, h - 24]
    ];
    rivets.forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

// 4. Sandstone Canyon & Desert Fortress Bricks
export function getSandstoneTexture(): THREE.CanvasTexture {
  return createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#a87948';
    ctx.fillRect(0, 0, w, h);

    // Brick mortar lines
    ctx.strokeStyle = '#6e4c27';
    ctx.lineWidth = 6;
    const rowH = 64;
    for (let y = 0; y < h; y += rowH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const offset = (y / rowH) % 2 === 0 ? 0 : 64;
      for (let x = offset; x < w; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }
  });
}

// 5. Military / Tactical Cargo Crate Texture with Stencil
export function getCargoCrateTexture(themeColor: string = '#06b6d4'): THREE.CanvasTexture {
  return createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, w, h);

    // Metal rim
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, w, h);

    // Diagonal hazard stripes in center banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, h * 0.38, w - 40, h * 0.24);

    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 8;
    for (let x = -w; x < w * 2; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.38);
      ctx.lineTo(x + 30, h * 0.62);
      ctx.stroke();
    }

    // Stencil text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CARGO SEC-04', w / 2, h * 0.52);
  });
}

// 6. Holographic Neon Sign Texture
export function getNeonSignTexture(text: string, color: string = '#ec4899'): THREE.CanvasTexture {
  return createProceduralCanvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(10, 10, 18, 0.9)';
    ctx.fillRect(0, 0, w, h);

    // Border glow
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  });
}
