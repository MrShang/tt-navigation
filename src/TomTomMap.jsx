import React, { useEffect, useRef, useState } from 'react';
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
    const options = {
        searchOptions: {
            key: API_KEY,
            language: "en-GB",
            limit: 5,
        },
        noResultsMessage: 'No results found.'
    };

    const ttZoomControls = new ZoomControls({
        className: '', // default = ''
        animate: true // deafult = true
    });

    const getLocation = async () => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            position => {
              resolve(position);
            },
            error => {
              reject(error);
            }
          );
        });
      };

    let currentLocationIndex = 0;
    const moveCurrentLocation = (map, routeCoordinates) => {
        console.log('moving now....');
        console.log({ currentLocationIndex });
        console.log({ routeCoordinates });
        console.log(`length: ${routeCoordinates.length}`);
        if (currentLocationIndex < routeCoordinates.length) {
            const currentLocation = routeCoordinates[currentLocationIndex];
            map.setCenter(currentLocation);
            new tt.Popup()
                .setLngLat(currentLocation)
                .setHTML("<p>Start</p>")
                .addTo(map);
            currentLocationIndex++;
            setTimeout(moveCurrentLocation(map, routeCoordinates), 1); // Update every 2 seconds (adjust as needed)
        }
    }

    useEffect(() => {
        const fetchLocation = async () => {
          try {
            const position = await getLocation();
            const map = tt.map({
                key: API_KEY,
                container: mapContainerRef.current,
                center: [position.coords.longitude, position.coords.latitude],
                language: 'en-GB',
                zoom: 8,
                minZoom: 2,
                maxZoom:12
            });
            const marker = new tt.Marker({ color: '#0016ff' })
                .setLngLat([position.coords.longitude, position.coords.latitude])
                .addTo(map);

            const ttSearchBox = new SearchBox(services, options);
            ttSearchBox.on('tomtom.searchbox.resultselected', data => {
                console.log('selected data ....');
                console.log({ data });
                const locations = `${position.coords.longitude},${position.coords.latitude}:${data.data.result.position.lng},${data.data.result.position.lat}`;
                console.log({ locations });
                new tt.Marker({ color: '#ff0000' })
                    .setLngLat([data.data.result.position.lng, data.data.result.position.lat])
                    .addTo(map);
                services.calculateRoute({
                  key: API_KEY,
                  locations: locations
                }).then(routeData => {
                    const geoData = routeData.toGeoJson();
                    console.log({ geoData });
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
                    console.log('starting navigation simulation...');
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

                    // Enable 3D rendering for the map
                    map.setPitch(45);
                    map.setBearing(0);

                    simulateStep();
                });
            });

            map.addControl(ttSearchBox, "top-left");
            map.addControl(ttZoomControls, 'top-left');
          } catch (error) {
            console.error('Error fetching location:', error);
          }
        };
        fetchLocation();
        // 清理函数，在组件卸载时调用
//        return () => {
//            // 清理地图资源，如果需要的话
//            if (map) {
//                map.remove();
//            }
//        };
    }, []); // 空依赖数组确保这个effect只运行一次

    return (
       <div>
           <div ref={mapContainerRef} style={{ width: '100%', height: '400px' }}></div>
       </div>
   );
};

export default TomTomMap;