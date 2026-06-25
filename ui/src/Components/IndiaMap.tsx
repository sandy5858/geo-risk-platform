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

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function IndiaMap() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<mapboxgl.Map | null>(null);

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
        });

        return () => {
            mapInstance.remove();
        };
    }, []);

    return (
        <>
            <div
                ref={mapContainerRef}
                style={{
                    width: "100%",
                    height: "100vh",
                }}
            />
            {map && (
                <H3Layer
                    map={map}
                    locations={[
                        { latitude: 12.9716, longitude: 77.5946 },  // Bangalore
                        { latitude: 28.6139, longitude: 77.209 },   // Delhi
                        { latitude: 19.076, longitude: 72.8777 }    // Mumbai
                    ]}
                    resolution={4}
                />
            )}
        </>
    );
}