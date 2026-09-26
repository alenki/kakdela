const R = 6371; // km

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Equirectangular projection of points into a padded box, preserving aspect around the centre latitude. */
export function project(
  points: { lat: number; lon: number }[],
  box: { w: number; h: number; pad: number },
): { x: number; y: number }[] {
  const lats = points.map((p) => p.lat), lons = points.map((p) => p.lon);
  const cosLat = Math.cos(((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180));
  const xs = lons.map((l) => l * cosLat), ys = lats;
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
  const s = Math.min((box.w - box.pad * 2) / spanX, (box.h - box.pad * 2) / spanY);
  const offX = (box.w - spanX * s) / 2, offY = (box.h - spanY * s) / 2;
  return xs.map((x, i) => ({ x: offX + (x - minX) * s, y: offY + (maxY - ys[i]) * s }));
}
