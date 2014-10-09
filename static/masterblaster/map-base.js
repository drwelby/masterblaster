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
    "weight": 3,
    "fillOpacity": 0
};

// Set up the map

L.tileLayer('http://{s}.mapport.net/tiles/ortho.php?z={z}&x={x}&y={y}', {
    attribution: 'Imagery &copy; ENPLAN 2010',
    maxZoom: 20,
    tms: true,
    opacity: 1,
    subdomains: "1234",
    zIndex:-1,
}).addTo(map);

L.tileLayer.wms('http://{s}.mapport.net/tiles/wms.php', {
        layers: 'counties:shastaco_parcels_owners',
        maxZoom: 20,
        format: 'image/png',
	subdomains: '1234',
        transparent: true}).addTo(map);

siteBoundsLayer = L.geoJson(sitebounds, {style:siteBoundsStyle, onEachFeature: passClick});
siteBoundsLayer.addTo(map);

if (mapstate.zoom && mapstate.center) {
    map.setView(mapstate.center,mapstate.zoom);
}else{
    map.fitBounds(siteBoundsLayer.getBounds());
}

map.setMaxBounds(panbounds);

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
    layer.on('dblclick', function(e) {
        map.fire('dblclick', e);
    });
    layer.on('contextmenu', function(e) {
        map.fire('contextmenu', e);
    });
}
