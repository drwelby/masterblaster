
var map;
var presstimer;

$(document).ready(function () {

map = L.map('map');
var clickAction = function(e) {return};
var selectedLayer, selectionLayer, bufferLayer;
var allLayers = L.layerGroup();
var init = true;
var lastLatLng;

var bufferStyle = {
    "color": "#ff0000",
    "weight": 3,
    "opacity":1,
    "fillOpacity": 0
};
var selectionStyle = {
    "color": "#ff0000",
    "weight": 0,
    "fillOpacity": 0.5
};
var selectedStyle = {
    "color": "#0000ff",
    "opacity": 1,
    "weight": 2,
    "fillOpacity": 0
};

// Set up the map
    zoom = mapstate.zoom || 15;
    if (mapstate.lat) {
        center = [mapstate.lat, mapstate.lon];
    }else{
        center = [40.681,-122.364]; 
    }

    //L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/998/256/{z}/{x}/{y}.png', {

    L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
        attribution: 'Tiles courtesy MapQuest, NASA/JPL-Caltech and USDA Farm Service Agency',
        opacity: 0.8
    }).addTo(map);

    //L.tileLayer('http://old.enplan.com/cgi-bin/tilecache.cgi/1.0.0/pv/{z}/{x}/{y}.png?type=google').addTo(map);
    L.tileLayer.wms('http://50.56.215.16:8888/geoserver/wms?', {
            layers: 'counties:shastaco_parcels_owners',
            format: 'image/png',
            transparent: true}).addTo(map);
    map.setView(center,zoom);
    // draw the map state
    updateMapState();

    //set up the buttons
    $("#selectButton").click(selectButtonClick);
    // Map Events
    map.on('click', onMapClick);
    map.on('moveend', viewChange);
    map.on('mousemove', function(e) {
        lastLatLng = e.latlng;
        setTimeout(function(){hover(e)},750);
    });
   map.on('mouseout', function(){
       $('#info-overlay').hide();
   });
   map.on('mouseover', function(){
       $('#info-overlay').show().html('...');
   });
   map.on('mouseup', function(){
         clearTimeout(pressTimer)
         return false;
         });
   map.on('mousedown', function(e) {
        lastLatLng = e.latlng;
        pressTimer = window.setTimeout(function() { hover(e) },1000)
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
        e.cancelBubble = true;
        e.returnValue = false;
        return false; 
        });


function hover(e) {
    if (e.latlng.equals(lastLatLng)) {
        infoClick(e);
    }
}

function onMapClick(e) {
    if (e.originalEvent.altKey) {
        infoClick(e);
    }else{
        clickAction(e);
    }
}

function passClick(feature, layer) {
    layer.on('click', function(e) {
        map.fire('click', e);
    });
}

function viewChange(e) {
     data = {
        'action': 'viewchange',
        'lat': map.getCenter().lat,
        'lon': map.getCenter().lng,
        'zoom': map.getZoom()
     };
     sendAction(data);
}

// handle updates to the map state
function updateMapState() {
    // if this isn't the first draw, remove the old layers
    if (init) {
            init = false;
    } else {
        allLayers.clearLayers();
    }
    // redraw the layers in leaflet
    if (mapstate.selected.length > 0) {
        selectedLayer = L.geoJson(mapstate.selected, {style:selectedStyle, onEachFeature: passClick});
        allLayers.addLayer(selectedLayer);
    }
    if (mapstate.buffer.geometry) {
        bufferLayer = L.geoJson(mapstate.buffer, {style:bufferStyle, onEachFeature: passClick});
        allLayers.addLayer(bufferLayer);
    }
    if (mapstate.selection.length > 0) {
        selectionLayer = L.geoJson(mapstate.selection, {style:selectionStyle, onEachFeature: passClick});
        allLayers.addLayer(selectionLayer);
    }
    allLayers.addTo(map);
    // if the map has selections, enable the buffer button
    if (mapstate.selection.length > 0 ){
        $('#bufferButton.disabled').on('click', bufferButtonClick).removeClass('disabled');
    } else {
        $('#bufferButton:not(.disabled)').off('click').addClass('disabled');
    }
    // if the map has a buffer selections, enable label button
    if (mapstate.selected.length > 0 ){
        $('#labelButton.disabled').on('click', labelButtonClick).removeClass('disabled');
    } else {
        $('#labelButton:not(.disabled)').off('click').addClass('disabled');
    }

}

// api handler

function sendAction(data){
    $.ajax({
        type: "POST",
        url: window.location.href,
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify({ data: data }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        statusCode: {
            200: function(data, textStatus, jqXHR) {handleAjax(data)},
            304: function(data, textStatus, jqXHR) {return;},
            404: function() {alert('Server Error')}
        }
    });
}

function handleAjax(data) {
    console.log(data);
    if (data.mapstate) {
        mapstate = data.mapstate;
        updateMapState();
    }
    if (data.get_feature) {
        ft = data.get_feature;
        $('#info-overlay').html(ft.slice(0,2).join(' - '));
    }
}


// button handlers

function selectButtonClick() {
    //if there's already a buffer selecting this will reset everything
    if (mapstate.buffer.geometry) {
        if (confirm("Selecting new parcels will reset your existing buffer and labels!")) {
            var data = {
            'action': 'reset'
            }
            sendAction(data); //reset
        }else{
            return;
        }
    }
    $('#selectButton').addClass('btn-primary');
    $('#bufferButton').removeClass('btn-primary');
    clickAction = selectClick;
}

function bufferButtonClick() {
    clickAction = toggleClick;
    $('#bufferButton').addClass('btn-primary');
    $('#selectButton').removeClass('btn-primary');

    //if there's already a buffer 
    if (mapstate.buffer.geometry) {
        if (confirm("The map already has a buffer. Press OK to make a new buffer and reset the selection, or press cancel to modify what has already been selected.")) {
            var data = {
            'action': 'reset-buffer'
            }
            sendAction(data); //reset
        }
        return;
    }
    //otherwise buffer the map
    var data = {
        'action': 'buffer'
    }
    sendAction(data)
}

function labelButtonClick() {
    window.open(window.location.href.replace("/map/","/labels/"));
}
// map click handlers

function selectClick(e) {
    var data = {
        'action': 'select',
        'lat': e.latlng.lat,
        'lon': e.latlng.lng
    }
    sendAction(data)
}

function toggleClick(e) {
    var data = {
        'action': 'toggle',
        'lat': e.latlng.lat,
        'lon': e.latlng.lng
    }
    sendAction(data)
}

function infoClick(e) {
    $('#info-overlay').show().html('...');
    var data = {
        'action': 'get_feature',
        'lat': e.latlng.lat,
        'lon': e.latlng.lng
    }
    sendAction(data)
}

});
