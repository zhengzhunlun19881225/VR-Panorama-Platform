import * as THREE from 'three';

// Convert Spherical Yaw & Pitch to 3D Cartesian Vector3 on sphere
export function yawPitchToVector3(yawDeg: number, pitchDeg: number, radius: number = 500): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - pitchDeg);
  const theta = THREE.MathUtils.degToRad(yawDeg);

  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = -radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

// Convert 3D Point on unit sphere back to Yaw and Pitch in degrees
export function vector3ToYawPitch(vector: THREE.Vector3): { yaw: number; pitch: number } {
  const norm = vector.clone().normalize();
  const pitch = THREE.MathUtils.radToDeg(Math.asin(norm.y));
  const yaw = THREE.MathUtils.radToDeg(Math.atan2(norm.x, -norm.z));
  return {
    yaw: Math.round(yaw * 10) / 10,
    pitch: Math.round(pitch * 10) / 10,
  };
}

// Convert 3D Vector3 into 2D Screen pixel coordinates given camera and viewport size
export function worldToScreenCoords(
  position: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number
): { x: number; y: number; isBehind: boolean } {
  const pos = position.clone();
  pos.project(camera);

  const isBehind = pos.z > 1 || pos.z < -1;
  const x = (pos.x * 0.5 + 0.5) * width;
  const y = (-(pos.y * 0.5) + 0.5) * height;

  return { x, y, isBehind };
}

// Procedural Equirectangular 2:1 Canvas Texture Generator for instant offline 360 preview
export function generateProceduralEquirectangular(
  theme: 'tech' | 'luxury' | 'museum' | 'nature' | 'cyber',
  title: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const w = canvas.width;
  const h = canvas.height;

  // Sky to Ground Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (theme === 'tech') {
    grad.addColorStop(0, '#0a192f');
    grad.addColorStop(0.45, '#1e3a8a');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(0.55, '#0f172a');
    grad.addColorStop(1, '#020617');
  } else if (theme === 'luxury') {
    grad.addColorStop(0, '#78716c');
    grad.addColorStop(0.48, '#e7e5e4');
    grad.addColorStop(0.5, '#d6d3d1');
    grad.addColorStop(0.52, '#a8a29e');
    grad.addColorStop(1, '#44403c');
  } else if (theme === 'museum') {
    grad.addColorStop(0, '#451a03');
    grad.addColorStop(0.45, '#78350f');
    grad.addColorStop(0.5, '#b45309');
    grad.addColorStop(0.55, '#292524');
    grad.addColorStop(1, '#1c1917');
  } else if (theme === 'cyber') {
    grad.addColorStop(0, '#3b0764');
    grad.addColorStop(0.48, '#701a75');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(0.52, '#09090b');
    grad.addColorStop(1, '#030712');
  } else {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.49, '#bae6fd');
    grad.addColorStop(0.5, '#22c55e');
    grad.addColorStop(0.6, '#15803d');
    grad.addColorStop(1, '#14532d');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Horizon line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();

  // Grid longitude lines (every 30 degrees)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += 30) {
    const x = (deg / 360) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px sans-serif';
    ctx.fillText(`${deg}°`, x + 10, h * 0.5 - 16);
  }

  // Ground Grid Floor Circles / Perspective
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let r = 50; r < 400; r += 50) {
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.85, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center watermark/label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w * 0.5, h * 0.35);

  ctx.font = '26px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('360° VR Equirectangular Panorama Preview (2:1)', w * 0.5, h * 0.4);

  return canvas.toDataURL('image/jpeg', 0.9);
}

// Simulate automatic multi-resolution tile generator for 2:1 equirectangular panorama
export function simulateTileGeneration(fileSizeMb: number = 18.5) {
  return {
    status: 'optimized' as const,
    originalSize: `${fileSizeMb.toFixed(1)} MB (8192×4096 8K超清)`,
    compressionRatio: '84.2%',
    tileLevels: [
      { level: 'L0 缩略图', resolution: '512×256', chunks: 1, size: '84 KB (秒开首屏)' },
      { level: 'L1 低清层', resolution: '1024×512', chunks: 4, size: '420 KB' },
      { level: 'L2 标准层', resolution: '2048×1024', chunks: 16, size: '1.8 MB' },
      { level: 'L3 高清层', resolution: '4096×2048', chunks: 64, size: '6.2 MB' },
      { level: 'L4 超清瓦片', resolution: '8192×4096', chunks: 256, size: '21.0 MB (分块按需载入)' }
    ]
  };
}
