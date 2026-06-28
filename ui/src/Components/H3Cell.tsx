import { latLngToCell, cellToBoundary } from "h3-js";
import type { Feature, GeoJsonProperties, Polygon } from "geojson";

interface Location {
    latitude: number;
    longitude: number;
}

const yellowShades = [
    "#fff9c4",
    "#fff59d",
    "#fff176",
    "#ffee58",
    "#ffeb3b",
    "#fdd835",
    "#fbc02d",
    "#f9a825",
    "#f57f17",
];

function getYellowShadeForH3Index(h3Index: string): string {
    let hash = 0;
    for (let i = 0; i < h3Index.length; i += 1) {
        hash = (hash * 31 + h3Index.charCodeAt(i)) >>> 0;
    }
    return yellowShades[hash % yellowShades.length];
}

export default function createH3Feature(
    location: Location,
    resolution: number
): Feature<Polygon, GeoJsonProperties> {
    const h3Index = latLngToCell(location.latitude, location.longitude, resolution);
    const boundary = cellToBoundary(h3Index);
    const ring = boundary.map(([lat, lng]) => [lng, lat]);
    ring.push(ring[0]);

    const feature: Feature<Polygon, GeoJsonProperties> = {
        type: "Feature",
        properties: {
            id: h3Index,
            h3: h3Index,
            fillColor: getYellowShadeForH3Index(h3Index),
        },
        geometry: {
            type: "Polygon",
            coordinates: [ring],
        },
    };

    return feature;
}
