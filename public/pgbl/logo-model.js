// Phu Gia Bao Loc — 3D mark. Outlines traced from the supplied logo PNG.
// Normalized (u,v): u across the mark's width, v down its height.
const PARTS = {
  leaf_main: [[0.0145,0.1364],[0.2174,0.1364],[0.4783,0.3636],[0.4783,0.7727],[0.2754,0.7727],[0.0145,0.5909]],
  leaf_bud:  [[0.6812,0.0000],[0.7536,0.0000],[0.7536,0.2273],[0.5362,0.3636],[0.5362,0.1136]],
  leaf_fold: [[0.7681,0.3636],[1.0000,0.3636],[1.0000,0.7727],[0.7681,0.9773],[0.5362,0.9773],[0.5362,0.5682]]
};

const ASPECT = 616 / 675; // mark width / height in the source art

export function buildLogoMark(THREE, opts = {}) {
  const {
    height = 1.2,
    depth = 0.17,
    metalness = 0.9,
    roughness = 0.34,
    goldDeep = 0xdfbb72,
    goldLight = 0xf0d79a
  } = opts;

  const W = ASPECT * height, H = height;
  const matDeep = new THREE.MeshStandardMaterial({ color: goldDeep, metalness, roughness });
  matDeep.name = 'gold_brushed';
  const matLight = new THREE.MeshStandardMaterial({ color: goldLight, metalness, roughness: roughness * 0.85 });
  matLight.name = 'gold_polished';

  const root = new THREE.Group();
  root.name = 'phu_gia_bao_loc_mark';

  const extrude = {
    depth, bevelEnabled: true, bevelThickness: depth * 0.07,
    bevelSize: height * 0.008, bevelOffset: 0, bevelSegments: 3, curveSegments: 4
  };

  for (const [name, pts] of Object.entries(PARTS)) {
    const shape = new THREE.Shape();
    pts.forEach(([u, v], i) => {
      const x = (u - 0.5) * W, y = (0.5 - v) * H;
      i ? shape.lineTo(x, y) : shape.moveTo(x, y);
    });
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, extrude);
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
    geo.translate(-cx, -cy, -depth / 2);

    const mesh = new THREE.Mesh(geo, name === 'leaf_main' ? matDeep : matLight);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;

    const pivot = new THREE.Group();
    pivot.name = 'pivot_' + name;
    pivot.position.set(cx, cy, 0);
    pivot.add(mesh);
    root.add(pivot);
  }
  return root;
}
