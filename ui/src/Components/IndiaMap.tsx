// src/features/map/components/IndiaMap.tsx

import { useEffect, useRef } from "react";
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

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function IndiaMap() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: INDIA_MAP_STYLE,
            center: INDIA_MAP_CENTER,
            zoom: INDIA_MAP_ZOOM,
            minZoom: INDIA_MAP_MIN_ZOOM,
            maxZoom: INDIA_MAP_MAX_ZOOM,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.on("load", async () => {
            const response = await fetch(INDIA_GEOJSON_PATH);
            const indiaGeoJson = await response.json();

            map.addSource(INDIA_SOURCE_ID, {
                type: "geojson",
                data: indiaGeoJson,
            });

            map.addLayer({
                id: INDIA_FILL_LAYER_ID,
                type: "fill",
                source: INDIA_SOURCE_ID,
                paint: {
                    "fill-opacity": INDIA_FILL_OPACITY,
                },
            });

            map.addLayer({
                id: INDIA_BORDER_LAYER_ID,
                type: "line",
                source: INDIA_SOURCE_ID,
                paint: {
                    "line-width": INDIA_BORDER_WIDTH,
                },
            });
        });

        return () => {
            map.remove();
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            style={{
                width: "100%",
                height: "100vh",
            }}
        />
    );
}