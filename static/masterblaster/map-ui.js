var presstimer;
var lastLatLng;

var clickAction = function(e) {return};

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

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


//set up nav buttons
$("#nav-pick").click(navPickButtonClick);
$("#nav-file").click(navFileButtonClick);
$("#nav-output").click(navOutputButtonClick);

//set up map buttons
$("#pick").click(toggleButtonClick);
$("#addbuffer").click(selectButtonClick);
$("#dobuffer").click(bufferButtonClick);
$("#lasso").click(lassoButtonClick);
$("#printButton").click(printButtonClick);

//set up output buttons
$("#labelButton").click(labelButtonClick);

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
        url: "/" + data.action + "/",
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
    if (data.get_feature) {
        if (data.get_feature.feature) {
            ftprop = data.get_feature.feature.properties;
            msg = ftprop.owner + " - " + ftprop.situs1;
        } else {
            msg = "...";
        }
        $('#info-overlay').html(msg);
        return;
    }
    if (data.get_popup) {
        if (data.get_popup.feature) {
            lat = parseFloat(data.get_popup.lat);
            lon = parseFloat(data.get_popup.lon);
            ftprop = data.get_popup.feature.properties;
            pstr = "<table class='popup-table'>";
            pstr += "<tr><td><b>Owner</b>: </td><td>" + (ftprop.owner || "") + "</td></tr>";
            pstr += "<tr><td><b>Situs</b>: </td><td>" + (ftprop.situs1 || "") + "</td></tr>";
            pstr += "<tr><td></td><td>" + (ftprop.situs2 || "") + "</td></tr>";
            pstr += "<tr><td><b>Mailing</b>: </td><td>" + (ftprop.mail1 || "") + "</td></tr>";
            pstr += "<tr><td></td><td>" + (ftprop.mail2 || "") + "</td></tr>";
            pstr += "<tr><td><b>Area(ac.)</b>: </td><td>" + (ftprop.area || "") + "</td></tr>";
            pstr += "</table>";
            pstr += '<a href="http://maps.google.com?q=loc:';
            pstr += data.get_popup.lat + ',' + data.get_popup.lon;
            pstr += '&z=18&t=h" target="_blank">View in Google Maps</a>';
            L.popup().setLatLng([lat, lon]).setContent(pstr).openOn(map);
        }
        return;
    }
    if (data.toggle) {
        if (data.toggle.feature) {
            apn = data.toggle.feature.properties.apn;
            if (mapstate.selected[apn]) {
                delete mapstate.selected[apn];
            }else{
                mapstate.selected[apn] = data.toggle.feature;
            }
            updatePageState();
        }
        return;
    }
    if (data.select) {
        if (data.select.feature) {
            apn = data.select.feature.properties.apn;
            if (mapstate.selection[apn]) {
                delete mapstate.selection[apn];
            }else{
                mapstate.selection[apn] = data.select.feature;
            }
            updatePageState();
        }
        return;
    }
    if (data.mapstate) {
        mapstate = data.mapstate;
        updatePageState();
    }
    if (data.name_map) {
        console.log(data.name_map.slug);
    }
}

function updateTable(){
    for (var apn in mapstate.selected) {
        $('#data-table table tbody').append('<tr>');
        p = mapstate.selected[apn].properties;
        row = $('#data-table table tr:last');
        row.append($('<td>').text(p.apn));
        row.append($('<td>').text(p.owner));
        row.append($('<td>').text(p.situs1));
        row.append($('<td>').text(p.mail1 + " " + p.mail2));
    }
}

function selectionMapState() {
    msdata = jQuery.extend({},mapstate);
    delete msdata.selection;
    delete msdata.buffer;
    for (var apn in msdata.selected) {
        delete msdata.selected[apn].geometry;
        delete msdata.selected[apn].type;
    }
    return msdata;
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
        'dist': $('#bufferdist').val() || '300',
        'mapstate': mapstate
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
        'lasso': geojson,
        'mapstate': mapstate
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

function navPickButtonClick() {
    $('#map-actions').show().siblings().hide();
    $('#map').show();
    $('#data-table').hide();
}

function navFileButtonClick() {
    $('#file-actions').show().siblings().hide();
    $('#lasso').removeClass('btn-primary');
    $('#map').show();
    $('#data-table').hide();
    drawControl.handlers.polygon.disable();
}

function navOutputButtonClick() {
    $('#output-actions').show().siblings().hide()
    $('#lasso').removeClass('btn-primary');
    updateTable();
    $('#map').hide();
    $('#data-table').show();
    drawControl.handlers.polygon.disable();
}

function labelButtonClick() {
    $('#label-actions').show().siblings().hide()
    $('#lasso').removeClass('btn-primary');
    drawControl.handlers.polygon.disable();
}
