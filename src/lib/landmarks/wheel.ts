import * as THREE from "three";

/** The big wheel on Erzsébet tér (Deák tér): a rim, spokes and little cabins that stay upright as it turns. */
export function buildWheel(materials: Record<string, THREE.Material>, lines: Record<string, THREE.LineBasicMaterial>) {
  const root = new THREE.Group();
  const R = 30;
  const hubZ = 34;
  const rimMat = materials.rim!;
  const spin = new THREE.Group();
  spin.position.set(0, 0, hubZ);
  root.add(spin);

  const rimGeo = new THREE.TorusGeometry(R, 0.5, 6, 56);
  rimGeo.rotateY(Math.PI / 2); // the ring stands in the north-south plane
  for (const x of [-1.5, 1.5]) {
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.x = x;
    spin.add(rim);
  }
  const spokes: number[] = [];
  const cabins: THREE.Mesh[] = [];
  const cabinGeo = new THREE.BoxGeometry(2.6, 2.4, 2.8);
  cabinGeo.translate(0, 0, -1.8);
  const count = 28;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const y = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    for (const x of [-1.5, 1.5]) spokes.push(0, 0, 0, x, y, z);
    const cabin = new THREE.Mesh(cabinGeo, materials.cabin);
    cabin.position.set(0, y, z);
    spin.add(cabin);
    cabins.push(cabin);
  }
  const spokeGeo = new THREE.BufferGeometry();
  spokeGeo.setAttribute("position", new THREE.Float32BufferAttribute(spokes, 3));
  spin.add(new THREE.LineSegments(spokeGeo, lines.lineWhite));

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.4, 12).rotateZ(Math.PI / 2), rimMat);
  hub.position.set(0, 0, hubZ);
  root.add(hub);
  // The A-frame legs on both sides.
  for (const x of [-3.2, 3.2]) {
    for (const y of [-15, 15]) {
      const from = new THREE.Vector3(x, y, 0);
      const to = new THREE.Vector3(x * 0.5, 0, hubZ);
      const dir = to.clone().sub(from);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, dir.length(), 6), rimMat);
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      leg.position.copy(from.clone().add(to).multiplyScalar(0.5));
      root.add(leg);
    }
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(9, 36, 0.8), materials.deck);
  base.position.z = 0.4;
  root.add(base);

  /** Turns the wheel slowly; the cabins hang straight down all the same. */
  const update = (seconds: number) => {
    const angle = seconds * 0.05;
    spin.rotation.x = angle;
    for (const c of cabins) c.rotation.x = -angle;
  };
  return { root, update };
}
