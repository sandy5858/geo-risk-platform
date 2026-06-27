import { useEffect } from "react";
import type * as mapboxgl from "mapbox-gl";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import createH3Feature from "./H3Cell";
import {
    H3_FILL_COLOR,
    H3_FILL_OPACITY,
    H3_OUTLINE_COLOR,
    H3_OUTLINE_WIDTH,
    H3_FILL_LAYER_ID,
    H3_OUTLINE_LAYER_ID,
    H3_SOURCE_ID,
} from "../Common/Constants";

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
    fillColor = H3_FILL_COLOR,
    fillOpacity = H3_FILL_OPACITY,
    outlineColor = H3_OUTLINE_COLOR,
    outlineWidth = H3_OUTLINE_WIDTH,
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
                if (map.getSource(H3_SOURCE_ID)) {
                    try {
                        // Mapbox's getSource returns a Source, which may not have a `setData` in TS typing here, so remove/re-add for simplicity
                        map.removeSource(H3_SOURCE_ID);
                    } catch (e) {
                        console.warn(`Failed to remove existing ${H3_SOURCE_ID} source, continuing to add new one`, e);
                    }
                }

                map.addSource(H3_SOURCE_ID, {
                    type: "geojson",
                    data: geojson,
                });

                // Add fill layer
                if (!map.getLayer(H3_FILL_LAYER_ID)) {
                    map.addLayer({
                        id: H3_FILL_LAYER_ID,
                        type: "fill",
                        source: H3_SOURCE_ID,
                        paint: {
                            "fill-color": fillColor,
                            "fill-opacity": fillOpacity,
                        },
                    });
                } else {
                    // update paint if exists
                    map.setPaintProperty(H3_FILL_LAYER_ID, "fill-color", fillColor);
                    map.setPaintProperty(H3_FILL_LAYER_ID, "fill-opacity", fillOpacity);
                }

                // Add outline layer
                if (!map.getLayer(H3_OUTLINE_LAYER_ID)) {
                    map.addLayer({
                        id: H3_OUTLINE_LAYER_ID,
                        type: "line",
                        source: H3_SOURCE_ID,
                        paint: {
                            "line-color": outlineColor,
                            "line-width": outlineWidth,
                        },
                    });
                } else {
                    map.setPaintProperty(H3_OUTLINE_LAYER_ID, "line-color", outlineColor);
                    map.setPaintProperty(H3_OUTLINE_LAYER_ID, "line-width", outlineWidth);
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
            if (map.getLayer(H3_OUTLINE_LAYER_ID)) {
                map.removeLayer(H3_OUTLINE_LAYER_ID);
            }
            if (map.getLayer(H3_FILL_LAYER_ID)) {
                map.removeLayer(H3_FILL_LAYER_ID);
            }
            if (map.getSource(H3_SOURCE_ID)) {
                map.removeSource(H3_SOURCE_ID);
            }
        };
    }, [map, latitude, longitude, locations, resolution, fillColor, fillOpacity, outlineColor, outlineWidth]);

    return null;
}
