export function createFacadeTexture(baseHex, isNight) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#' + baseHex.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 256, 512);

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 2, 512);

  for (let y = 10; y < 500; y += 20) {
    for (let x = 8; x < 248; x += 24) {
      const lit = Math.random() > 0.35;
      ctx.fillStyle = isNight
        ? (lit ? '#fef08a' : '#090d16')
        : (lit ? '#bae6fd' : '#1e293b');
      ctx.fillRect(x, y, 16, 13);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

export function createRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#18202c';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(10, 0, 5, 256);
  ctx.fillRect(241, 0, 5, 256);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(125, 16, 6, 80);
  ctx.fillRect(125, 144, 6, 80);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 50);
  tex.anisotropy = 4;
  return tex;
}
