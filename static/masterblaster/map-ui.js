var presstimer;
var lastLatLng;

var clickAction = function(e) {return};


var drawControl = new L.Control.Draw({
        polygon: {
            allowIntersection: false,
            shapeOptions: {
                color: '#ff0000'
            },
        circle:false,
        marker:false,
        polyline:false,
        rectangle:false
        }
    });
map.addControl(drawControl);



//set up the buttons
$("#pick").click(toggleButtonClick);
$("#addbuffer").click(selectButtonClick);
$("#dobuffer").click(bufferButtonClick);
$("#lasso").click(lassoButtonClick);
$("#printButton").click(printButtonClick);

$.fn.editableform.buttons = 
'<button type="submit" class="btn btn-primary editable-submit btn-mini"><i class="icon-ok icon-white"></i></button>' +
'<button type="button" class="btn editable-cancel btn-mini"><i class="icon-remove"></i></button>'; 

$("#map-title-editable").editable({
    type:'text',
    placement:'bottom',
    mode:'inline',
    url: function(params) {
        var data = {'action': 'name_map', 'name': params.value};
        sendAction(data);
    },
    value: ""
});

$("#map-title-editable").on('hidden', function(e,reason) {
    if (reason == 'save') {
        $('#no-title').html($("#map-title-editable").html()).attr('id', 'map-title');
    }
});
    
updatePageState();

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
map.on('contextmenu', getPopup);
       

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


function viewChange(e) {
     data = {
        'action': 'viewchange',
        'lat': map.getCenter().lat,
        'lon': map.getCenter().lng,
        'zoom': map.getZoom()
     };
     sendAction(data);
}

function updatePageState() {
    updateMapState();
    if (mapstate.selected.length > 0 ){
        $('#dataButton.disabled').on('click', dataButtonClick).removeClass('disabled');
    } else {
        $('#dataButton:not(.disabled)').off('click').addClass('disabled');
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
            304: function(data, textStatus, jqXHR) {console.log('pan')},
            404: function() {alert('Server Error')}
        }
    });
}

function handleAjax(data) {
    if (data.mapstate) {
        mapstate = data.mapstate;
        updatePageState();
    }
    if (data.name_map) {
        console.log(data.name_map.slug);
    }
    if (data.get_feature) {
        ft = data.get_feature;
        $('#info-overlay').html(ft.slice(0,2).join(' - '));
    }
    if (data.get_popup) {
        if (data.get_popup.feature) {
            lat = parseFloat(data.get_popup.lat);
            lon = parseFloat(data.get_popup.lon);
            ft = data.get_popup.feature;
            pstr = "<table class='popup-table'>";
            pstr += "<tr><td><b>Owner</b>: </td><td>" + (ft.owner || "") + "</td></tr>";
            pstr += "<tr><td><b>Situs</b>: </td><td>" + (ft.situs1 || "") + "</td></tr>";
            pstr += "<tr><td></td><td>" + (ft.situs2 || "") + "</td></tr>";
            pstr += "<tr><td><b>Mailing</b>: </td><td>" + (ft.mail1 || "") + "</td></tr>";
            pstr += "<tr><td></td><td>" + (ft.mail2 || "") + "</td></tr>";
            pstr += "</table>";
            pstr += '<a href="http://maps.google.com?q=loc:';
            pstr += data.get_popup.lat + ',' + data.get_popup.lon;
            pstr += '&z=18&t=h" target="_blank">View in Google Maps</a>';
            L.popup().setLatLng([lat, lon]).setContent(pstr).openOn(map);
        }
    }
}


// button handlers

function lassoButtonClick() {
    clickAction = lassoClick;
    drawControl.handlers.polygon.enable();
    $('#lasso').addClass('btn-primary');
    $('#pick').removeClass('btn-primary');
    $('#addbuffer').show();
    $('#fullbuffer').hide();
}

function toggleButtonClick() {
    clickAction = toggleClick;
    $('#pick').addClass('btn-primary');
    $('#lasso').removeClass('btn-primary');
    $('#addbuffer').show();
    $('#fullbuffer').hide();
    drawControl.handlers.polygon.disable();
}

function selectButtonClick() {
    $('#pick').removeClass('btn-primary');
    $('#lasso').removeClass('btn-primary');
    $('#addbuffer').hide();
    $('#fullbuffer').css('display', 'inline-block');
    clickAction = selectClick;
    drawControl.handlers.polygon.disable();
}

function bufferButtonClick() {
    clickAction = selectClick;
    drawControl.handlers.polygon.disable();
    var data = {
        'action': 'buffer',
        'dist': $('#bufferdist').val() || '300'
    }
    sendAction(data); //reset
    return;

}

function dataButtonClick() {
    window.open(window.location.href.replace("/map/","/data/"));
}

function printButtonClick() {
    window.open(window.location.href.replace("/map/","/print/"));
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
    if ($('#lasso').hasClass('btn-primary')) {
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
    };
    sendAction(data)
}

function getPopup(e) {
    var data = {
        'action': 'get_popup',
        'lat': e.latlng.lat,
        'lon': e.latlng.lng
    };
    sendAction(data);
}
