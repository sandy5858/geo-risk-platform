// src/features/map/components/IndiaMap.tsx

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

import {
    INDIA_MAP_STYLE,
    INDIA_MAP_CENTER,
    INDIA_MAP_ZOOM,
    INDIA_MAP_MIN_ZOOM,
    INDIA_MAP_MAX_ZOOM,
    INDIA_GEOJSON_PATH,
    INDIA_SOURCE_ID,
    INDIA_FILL_LAYER_ID,
    INDIA_BORDER_LAYER_ID,
    INDIA_FILL_OPACITY,
    INDIA_BORDER_WIDTH,
} from "../Common/Constants";
import H3Layer from "./H3Layer";
import { getIndiaH3CellLocations } from "../utils/h3Utilities";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface Location {
    latitude: number;
    longitude: number;
}

export default function IndiaMap() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [currentResolution, setCurrentResolution] = useState<number>(3);
    const [h3LocationsByResolution, setH3LocationsByResolution] = useState<Record<number, Location[]>>({
        3: [],
        4: [],
    });

    const getH3ResolutionForZoom = (zoom: number): number => (zoom <= 5 ? 3 : 4);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const mapInstance = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: INDIA_MAP_STYLE,
            center: INDIA_MAP_CENTER,
            zoom: INDIA_MAP_ZOOM,
            minZoom: INDIA_MAP_MIN_ZOOM,
            maxZoom: INDIA_MAP_MAX_ZOOM,
        });

        mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
        mapInstance.on("zoomend", () => {
            setCurrentResolution(getH3ResolutionForZoom(mapInstance.getZoom()));
        });

        mapInstance.on("load", async () => {
            const response = await fetch(INDIA_GEOJSON_PATH);
            const indiaGeoJson = await response.json();

            mapInstance.addSource(INDIA_SOURCE_ID, {
                type: "geojson",
                data: indiaGeoJson,
            });

            mapInstance.addLayer({
                id: INDIA_FILL_LAYER_ID,
                type: "fill",
                source: INDIA_SOURCE_ID,
                paint: {
                    "fill-opacity": INDIA_FILL_OPACITY,
                },
            });

            mapInstance.addLayer({
                id: INDIA_BORDER_LAYER_ID,
                type: "line",
                source: INDIA_SOURCE_ID,
                paint: {
                    "line-width": INDIA_BORDER_WIDTH,
                },
            });

            setMap(mapInstance);
            setCurrentResolution(getH3ResolutionForZoom(mapInstance.getZoom()));

            try {
                const [res3Locations, res4Locations] = await Promise.all([
                    getIndiaH3CellLocations(3),
                    getIndiaH3CellLocations(4),
                ]);

                setH3LocationsByResolution({
                    3: res3Locations,
                    4: res4Locations,
                });
            } catch (error) {
                console.error("Failed to get India H3 cell locations:", error);
            }
        });

        return () => {
            mapInstance.remove();
        };
    }, []);

    const displayedLocations = h3LocationsByResolution[currentResolution] ?? [];

    return (
        <>
            <div
                ref={mapContainerRef}
                style={{
                    width: "100%",
                    height: "100vh",
                }}
            />
            {map && displayedLocations.length > 0 && (
                <H3Layer
                    map={map}
                    locations={displayedLocations}
                    resolution={currentResolution}
                />
            )}
        </>
    );
}