import React, { useEffect, useRef } from 'react';
import tt from "@tomtom-international/web-sdk-maps";
import { services } from '@tomtom-international/web-sdk-services';
import SearchBox from '@tomtom-international/web-sdk-plugin-searchbox';
import ZoomControls from '@tomtom-international/web-sdk-plugin-zoomcontrols';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import '@tomtom-international/web-sdk-plugin-searchbox/dist/SearchBox.css';
import '@tomtom-international/web-sdk-plugin-zoomcontrols/dist/ZoomControls.css';

const TomTomMap = () => {
    const mapContainerRef = useRef(null);
    const API_KEY = 'slbuC9DI0UphoNVEMdii60WZB5GT6kut';

    const addMarkerToMap = (map, options, lgnlat) => {
        new tt.Marker(options)
            .setLngLat(lgnlat)
            .addTo(map);
    };

    const addRouteLayer = (map, geoData) => {
        map.addLayer({
            id: "route",
            type: "line",
            source: {
                type: "geojson",
                data: geoData
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                "line-color": "#FF0000",
                "line-width": 3
            }
        });
    };

    const navigationSimulate = (map, geoData) => {
        let currentStep = 0;
        const stepInterval = 100; // Move to the next step every second
        const routeGeometry = geoData.features[0].geometry.coordinates;
        const popup = new tt.Popup()
            .setLngLat([routeGeometry[0][0], routeGeometry[0][1]])
            .setText("I'm here")
            .addTo(map);
        const simulateStep = () => {
            if (currentStep < routeGeometry.length) {
              const position = routeGeometry[currentStep];
              map.panTo([position[0], position[1]]);
              popup.setText(`I'm in spot ${currentStep}`);
              popup.setLngLat([position[0], position[1]]);
              currentStep++;
              setTimeout(simulateStep, stepInterval);
            }
        };
        simulateStep();
    };

    const searchSelected = (data, map, position) => {
        console.log('selected data ....');
        console.log({ data });
        const locations = `${position.coords.longitude},${position.coords.latitude}:${data.data.result.position.lng},${data.data.result.position.lat}`;
        console.log({ locations });
        // add the destination marker
        addMarkerToMap(map, { color: '#ff0000' }, [data.data.result.position.lng, data.data.result.position.lat]);
        services.calculateRoute({
            key: API_KEY,
            locations: locations
        }).then(routeData => {
            const geoData = routeData.toGeoJson();
            console.log({ geoData });
            addRouteLayer(map, geoData);
            console.log('starting navigation simulation...');
            navigationSimulate(map, geoData);
            // Enable 3D rendering for the map
            map.setPitch(45);
            map.setBearing(0);
        });
    };

    const initSearchBox = (map, position) => {
        const options = {
            searchOptions: {
                key: API_KEY,
                language: "en-GB",
                limit: 5,
            },
            noResultsMessage: 'No results found.'
        };
        const ttSearchBox = new SearchBox(services, options);
        ttSearchBox.on('tomtom.searchbox.resultselected', data => {
            searchSelected(data, map, position);
        });
        return ttSearchBox;
    };

    const initMap = (position) => {
        const map = tt.map({
            key: API_KEY,
            container: mapContainerRef.current,
            center: [position.coords.longitude, position.coords.latitude],
            language: 'en-GB',
            zoom: 8,
            minZoom: 2,
            maxZoom:12
        });
        // add a startMarker
        addMarkerToMap(map, { color: '#0016ff' }, [position.coords.longitude, position.coords.latitude]);

        // add a searchBox
        const ttSearchBox = initSearchBox(map, position);

        map.addControl(ttSearchBox, "top-left");
        map.addControl(new ZoomControls(), 'top-left');
    };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            initMap(position);
        });
    });

    return (
       <div>
           <div ref={mapContainerRef} style={{ width: '100%', height: '400px' }}></div>
       </div>
   );
};

export default TomTomMap;