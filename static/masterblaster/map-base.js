var map = L.map('map');
var selectedLayer, selectionLayer, bufferLayer;
var allLayers = L.layerGroup();

var bufferStyle = {
    "color": "#ff0000",
    "weight": 3,
    "opacity":1,
    "fillOpacity": 0
};
var selectionStyle = {
    "color": "#ff0000",
    "weight": 2,
    "opacity":1,
    "fillOpacity": 0
};
var selectedStyle = {
    "color": "#0000ff",
    "opacity": 1,
    "weight": 2,
    "fillOpacity": 0.25
};
var siteBoundsStyle = {
    "color": "#ffff00",
    "opacity": 1,
    "weight": 2,
    "fillOpacity": 0
};

// Set up the map
if (mapstate.zoom && mapstate.center) {
    console.log(mapstate.zoom);
    console.log(mapstate.center);
    map.setView(mapstate.center,mapstate.zoom);
}
map.setMaxBounds(panbounds);

L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
    attribution: 'Tiles courtesy MapQuest, NASA/JPL-Caltech and USDA Farm Service Agency',
    opacity: 0.8,
    zIndex:-1,
    subdomains: "1234"
}).addTo(map);

L.tileLayer.wms('http://50.56.215.16:8888/geoserver/wms?', {
        layers: 'counties:shastaco_parcels_owners',
        format: 'image/png',
        transparent: true}).addTo(map);

siteBoundsLayer = L.geoJson(sitebounds, {style:siteBoundsStyle, onEachFeature: passClick});
siteBoundsLayer.addTo(map);

updateMapState();

// handle updates to the map state
function updateMapState() {
    // redraw the layers in leaflet
    allLayers.clearLayers();
    if (mapstate.selected && Object.keys(mapstate.selected).length > 0) {
        selectedData = [];
        for (apn in mapstate.selected) {
            selectedData.push(mapstate.selected[apn]);
        }
        selectedLayer = L.geoJson(selectedData, {style:selectedStyle, onEachFeature: passClick});
        allLayers.addLayer(selectedLayer);
    }
    if (mapstate.buffer && mapstate.buffer.geometry) {
        bufferLayer = L.geoJson(mapstate.buffer, {style:bufferStyle, onEachFeature: passClick});
        allLayers.addLayer(bufferLayer);
    }
    if (mapstate.selection && Object.keys(mapstate.selection).length > 0) {
        selectionData = [];
        for (apn in mapstate.selection) {
            selectionData.push(mapstate.selection[apn]);
        }
        selectionLayer = L.geoJson(selectionData, {style:selectionStyle, onEachFeature: passClick});
        allLayers.addLayer(selectionLayer);
    }
    allLayers.addTo(map);
}

function passClick(feature, layer) {
layer.on('click', function(e) {
    map.fire('click', e);
});
}
