
var map;
var presstimer;

$(document).ready(function () {

function setHeight() {
    windowHt = $('body').height();
    rowsHt = 0;
    $('.hrow').each( function() {rowsHt += $(this).height()});
    $('.maprow').height(windowHt-rowsHt-30);
}
setHeight();
$(window).resize(setHeight);

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


    L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
        attribution: 'Tiles courtesy MapQuest, NASA/JPL-Caltech and USDA Farm Service Agency',
        opacity: 0.8,
        subdomains: "1234"
    }).addTo(map);

    L.tileLayer.wms('http://50.56.215.16:8888/geoserver/wms?', {
            layers: 'counties:shastaco_parcels_owners',
            format: 'image/png',
            transparent: true}).addTo(map);
    map.setView(center,zoom);

    var drawControl = new L.Control.Draw({
            polygon: {
                allowIntersection: false,
                shapeOptions: {
                    color: '#ff0000'
                },
            circle:false,
            marker:false,
            polyline:false,
            rectangge:false
            }
        });
        map.addControl(drawControl);

    // draw the map state
    updateMapState();

    //set up the buttons
    $("#pick,#pickback,#pickmore").click(toggleButtonClick);
    $("#buffer,#addbuffer").click(selectButtonClick);
    $("#dobuffer").click(bufferButtonClick);
    $("#lasso").click(lassoButtonClick);
    $("#refresh").click(mapRefresh);

    // Map Events
    map.on('click', onMapClick);
    map.on('moveend', viewChange);
    map.on('mousemove', function(e) {
        lastLatLng = e.latlng;
        setTimeout(function(){hover(e)},300);
    });
    map.on('mouseout', function(){
       $('#info-overlay').hide();
    });
    map.on('mouseover', function(){
       $('#info-overlay').show().html('...');
    });
    map.on('contextmenu', infoClick);

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
    //
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
        $('#info-overlay').show().html(ft.slice(0,2).join(' - '));
    }
}


// button handlers

function lassoButtonClick() {
    clickAction = lassoClick;
    drawControl.handlers.polygon.enable();
    $('#step3').fadeIn().siblings().hide();
}

function toggleButtonClick() {
    clickAction = toggleClick;
    drawControl.handlers.polygon.disable();
    $('#step2').fadeIn().siblings().hide();
}

function selectButtonClick() {
    $('#step4').fadeIn().siblings().hide();
    clickAction = selectClick;
    drawControl.handlers.polygon.disable();
}

function bufferButtonClick() {
    clickAction = selectClick;
    drawControl.handlers.polygon.disable();
    var data = {
        'action': 'buffer',
        'dist': $('#bufferdist').val()
    }
    sendAction(data); //reset
    return;

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
    };
    sendAction(data)
}

function lassoClick(e) {
    return false;
}

map.on('draw:poly-created', function(e){
    lpoly = e.poly.getLatLngs();
    geojson = '{ "type": "Polygon", "coordinates": [[';
    points = [];
    for (var i=0; i < lpoly.length; i++) {
        point = "[" + lpoly[i].lng;
        point += ", " + lpoly[i].lat;
        point += "]";
        points.push(point);
    }
    lastpoint = "[" + lpoly[0].lng;
    lastpoint += ", " + lpoly[0].lat;
    lastpoint += "]";
    points.push(lastpoint);
    geojson += points.join(',');
    geojson += ']]}';
    console.log(geojson)
    drawControl.handlers.polygon.enable();
    var data = {
        'action': 'lasso',
        'poly': geojson
    };
    sendAction(data);
});

map.on('drawing-disabled', function(){
    if ($('#lassoButton').hasClass('btn-primary')) {
            drawControl.handlers.polygon.enable();
        }
});

function mapRefresh() {
    if (confirm("Reset the map and delete all parcels and buffers?")) {
        var data = {
            'action': 'reset',
        };
        sendAction(data);
    }
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
