import * as THREE from "three";

const PARTS = {
  leaf_main: [
    [0.0145, 0.1364],
    [0.2174, 0.1364],
    [0.4783, 0.3636],
    [0.4783, 0.7727],
    [0.2754, 0.7727],
    [0.0145, 0.5909],
  ],
  leaf_bud: [
    [0.6812, 0],
    [0.7536, 0],
    [0.7536, 0.2273],
    [0.5362, 0.3636],
    [0.5362, 0.1136],
  ],
  leaf_fold: [
    [0.7681, 0.3636],
    [1, 0.3636],
    [1, 0.7727],
    [0.7681, 0.9773],
    [0.5362, 0.9773],
    [0.5362, 0.5682],
  ],
} as const;

const ASPECT = 616 / 675;

type LogoMarkOptions = {
  height?: number;
  depth?: number;
  metalness?: number;
  roughness?: number;
  goldDeep?: number;
  goldLight?: number;
};

export function buildLogoMark({
  height = 1.2,
  depth = 0.17,
  metalness = 0.9,
  roughness = 0.34,
  goldDeep = 0xdfbb72,
  goldLight = 0xf0d79a,
}: LogoMarkOptions = {}) {
  const width = ASPECT * height;
  const matDeep = new THREE.MeshStandardMaterial({ color: goldDeep, metalness, roughness });
  const matLight = new THREE.MeshStandardMaterial({
    color: goldLight,
    metalness,
    roughness: roughness * 0.85,
  });

  const root = new THREE.Group();
  root.name = "phu_gia_bao_loc_mark";

  const extrude = {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.07,
    bevelSize: height * 0.008,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 4,
  };

  for (const [name, pts] of Object.entries(PARTS)) {
    const shape = new THREE.Shape();

    pts.forEach(([u, v], index) => {
      const x = (u - 0.5) * width;
      const y = (0.5 - v) * height;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrude);
    geometry.computeBoundingBox();

    const bounds = geometry.boundingBox;
    if (!bounds) continue;

    const cx = (bounds.min.x + bounds.max.x) / 2;
    const cy = (bounds.min.y + bounds.max.y) / 2;
    geometry.translate(-cx, -cy, -depth / 2);

    const mesh = new THREE.Mesh(geometry, name === "leaf_main" ? matDeep : matLight);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const pivot = new THREE.Group();
    pivot.name = `pivot_${name}`;
    pivot.position.set(cx, cy, 0);
    pivot.add(mesh);
    root.add(pivot);
  }

  return root;
}
