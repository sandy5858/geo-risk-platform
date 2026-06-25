import { useEffect } from "react";
import type * as mapboxgl from "mapbox-gl";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import createH3Feature from "./H3Cell";

interface Location {
    latitude: number;
    longitude: number;
}

interface H3LayerProps {
    map: mapboxgl.Map;
    // Either provide a single location via latitude/longitude or multiple locations via `locations`.
    latitude?: number;
    longitude?: number;
    locations?: Location[];
    resolution: number;
    fillColor?: string;
    fillOpacity?: number;
    outlineColor?: string;
    outlineWidth?: number;
}

export default function H3Layer({
    map,
    latitude,
    longitude,
    locations,
    resolution,
    fillColor = "#ff0000",
    fillOpacity = 0.4,
    outlineColor = "#000000",
    outlineWidth = 2,
}: H3LayerProps) {
    useEffect(() => {
        const addH3Layer = () => {
            try {
                console.log("Adding H3 layer(s)");

                const locs: Location[] = locations && locations.length ? locations : latitude && longitude ? [{ latitude, longitude }] : [] as Location[];

                if (!locs.length) {
                    console.warn("No locations provided for H3Layer");
                    return;
                }

                const features = locs.map((loc, idx) => createH3Feature(loc, resolution, `h3-${idx}`));

                const geojson: FeatureCollection<Geometry, GeoJsonProperties> = {
                    type: "FeatureCollection",
                    features,
                };

                // Replace existing source if present
                if (map.getSource("h3-cells")) {
                    try {
                        // Mapbox's getSource returns a Source, which may not have a `setData` in TS typing here, so remove/re-add for simplicity
                        map.removeSource("h3-cells");
                    } catch (e) {
                        console.warn("Failed to remove existing h3-cells source, continuing to add new one", e);
                    }
                }

                map.addSource("h3-cells", {
                    type: "geojson",
                    data: geojson,
                });

                // Add fill layer
                if (!map.getLayer("h3-fill")) {
                    map.addLayer({
                        id: "h3-fill",
                        type: "fill",
                        source: "h3-cells",
                        paint: {
                            "fill-color": fillColor,
                            "fill-opacity": fillOpacity,
                        },
                    });
                } else {
                    // update paint if exists
                    map.setPaintProperty("h3-fill", "fill-color", fillColor);
                    map.setPaintProperty("h3-fill", "fill-opacity", fillOpacity);
                }

                // Add outline layer
                if (!map.getLayer("h3-outline")) {
                    map.addLayer({
                        id: "h3-outline",
                        type: "line",
                        source: "h3-cells",
                        paint: {
                            "line-color": outlineColor,
                            "line-width": outlineWidth,
                        },
                    });
                } else {
                    map.setPaintProperty("h3-outline", "line-color", outlineColor);
                    map.setPaintProperty("h3-outline", "line-width", outlineWidth);
                }

                console.log("H3 layers added/updated successfully");
            } catch (error) {
                console.error("Error adding H3 layer(s):", error);
                setTimeout(addH3Layer, 500);
            }
        };

        console.log("H3Layer effect running, map loaded:", map.isStyleLoaded());

        // Try adding regardless; addH3Layer retries if style isn't ready
        addH3Layer();

        return () => {
            if (map.getLayer("h3-outline")) {
                map.removeLayer("h3-outline");
            }
            if (map.getLayer("h3-fill")) {
                map.removeLayer("h3-fill");
            }
            if (map.getSource("h3-cells")) {
                map.removeSource("h3-cells");
            }
        };
    }, [map, latitude, longitude, locations, resolution, fillColor, fillOpacity, outlineColor, outlineWidth]);

    return null;
}
