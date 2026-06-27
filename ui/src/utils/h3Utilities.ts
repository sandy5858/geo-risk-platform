import { polygonToCells, cellToLatLng } from "h3-js";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";

interface Location {
    latitude: number;
    longitude: number;
}

/**
 * Fetch and dissolve India GeoJSON, then get all H3 cells covering India with their centers
 * @param resolution H3 resolution level (0-15, where higher numbers are more granular)
 * @returns Array of locations representing H3 cell centers covering India
 */
export async function getIndiaH3CellLocations(
    resolution: number
): Promise<Location[]> {
    try {
        // Fetch the India GeoJSON
        const response = await fetch("/india.geojson");
        const geojson = (await response.json()) as FeatureCollection<
            Polygon | MultiPolygon
        >;

        if (!geojson.features || geojson.features.length === 0) {
            throw new Error("GeoJSON has no features");
        }

        // Collect all H3 cells from all features
        const allH3Cells = new Set<string>();

        for (const feature of geojson.features) {
            if (!feature.geometry) continue;

            const coords = feature.geometry.coordinates;

            try {
                if (feature.geometry.type === "Polygon") {
                    // Polygon coordinates are [ring, hole, hole, ...]
                    const cells = polygonToCells(coords as number[][][], resolution, true);
                    cells.forEach((cell) => allH3Cells.add(cell));
                } else if (feature.geometry.type === "MultiPolygon") {
                    // MultiPolygon coordinates are [[ring, hole, ...], [ring, hole, ...], ...]
                    const polygons = coords as number[][][][];
                    for (const polygon of polygons) {
                        const cells = polygonToCells(polygon, resolution, true);
                        cells.forEach((cell) => allH3Cells.add(cell));
                    }
                }
            } catch (featureError) {
                console.warn(
                    `Warning: Could not process feature, continuing:`,
                    featureError
                );
            }
        }

        if (allH3Cells.size === 0) {
            throw new Error("No H3 cells generated from any features");
        }

        // Convert H3 cell indices to locations (cell centers)
        const locations = Array.from(allH3Cells).map((cellIndex) => {
            const [latitude, longitude] = cellToLatLng(cellIndex);
            return { latitude, longitude };
        });

        console.log(
            `Generated ${locations.length} H3 cell centers at resolution ${resolution} for India`
        );

        return locations;
    } catch (error) {
        console.error("Error getting India H3 cell locations:", error);
        throw error;
    }
}