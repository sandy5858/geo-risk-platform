import { latLngToCell, cellToBoundary } from "h3-js";
import type { Feature, GeoJsonProperties, Polygon } from "geojson";

interface Location {
    latitude: number;
    longitude: number;
}

export default function createH3Feature(
    location: Location,
    resolution: number,
    id?: string,
): Feature<Polygon, GeoJsonProperties> {
    const h3Index = latLngToCell(location.latitude, location.longitude, resolution);
    const boundary = cellToBoundary(h3Index);
    const ring = boundary.map(([lat, lng]) => [lng, lat]);
    ring.push(ring[0]);

    const feature: Feature<Polygon, GeoJsonProperties> = {
        type: "Feature",
        properties: { id, h3: h3Index },
        geometry: {
            type: "Polygon",
            coordinates: [ring],
        },
    };

    return feature;
}
