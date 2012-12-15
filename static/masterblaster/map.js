
var map;
$(document).ready(function () {

map = L.map('map');
var clickAction = function(e) {return};
var selectedLayer, selectionLayer, bufferLayer;
var allLayers = L.layerGroup();
var init = true;

var bufferStyle = {
    "color": "#ff0000",
    "weight": 3,
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
    zoom = mapstate.zoom || 14;
    center = [mapstate.lat, mapstate.lon] || [40.681,-122.364]; 

    L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/998/256/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    }).addTo(map);
    L.tileLayer('http://old.enplan.com/cgi-bin/tilecache.cgi/1.0.0/pv/{z}/{x}/{y}.png?type=google').addTo(map);

    map.invalidateSize();
    map.setView(center,zoom);
    // draw the map state
    updateMapState();

    //set up the buttons
    $("#selectButton").click(selectButtonClick);
    // Map Events
    map.on('click', onMapClick);
    map.on('moveend', viewChange);


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
    mapstate = data;
    updateMapState();
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
    alert('Hey Labels!');
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
    var data = {
        'action': 'get_feature',
        'lat': e.latlng.lat,
        'lon': e.latlng.lng
    }
    sendAction(data)
}

});
