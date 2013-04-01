var presstimer;
var lastLatLng;
var lastapn = "";

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
$("#nav-map").click(navMapButtonClick);
$("#nav-output").click(navOutputButtonClick);

//set up map buttons
$("#pick").click(toggleButtonClick);
$("#addbuffer").click(selectButtonClick);
$("#dobuffer").click(bufferButtonClick);
$("#lasso").click(lassoButtonClick);
$("#saveButton").click(saveMap);

//set up output buttons
$("#labelButton").click(labelButtonClick);
$("#tableButton").click(tableButtonClick);
$("#excelButton").click(excelButtonClick);
$("#csvButton").click(csvButtonClick);

$.fn.editableform.buttons = 
'<button type="submit" class="btn btn-primary editable-submit btn-mini"><i class="icon-ok icon-white"></i></button>' +
'<button type="button" class="btn editable-cancel btn-mini"><i class="icon-remove"></i></button>'; 

$("#map-title-editable").editable({
    type:'text',
    placement:'bottom',
    mode:'inline',
    onblur   : 'submit',
    emptytext: "(click here to name this map)",
    url: function(params) {
        mapstate.name = params.value;
        return true;
    },
    value: ""
});

$("#map-title-editable").on('hidden', function(e,reason) {
        $('i.fade').toggle();
});
$("#map-title-editable").on('shown', function(e,reason) {
        $('i.fade').toggle();
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
map.on('move', updateBounds);

function updateBounds() {
    mapstate.zoom = map.getZoom();
    center = map.getCenter();
    mapstate.center = [center.lat,center.lng];
}

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
            msg = ftprop.owner;
            if (ftprop.situs1 != "No Data") {
                msg += " - " + ftprop.situs1;
            }
        } else {
            msg = "...";
        }
        if (ftprop.apn != lastapn) {
            $('#info-overlay').html(msg).hide().fadeIn(200);
            lastapn = ftprop.apn;
        }
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
            pstr += "<tr><td><b>APN</b>: </td><td>" + (ftprop.apn || "") + "</td></tr>";
            pstr += "</table>";
            pstr += '<br><a href="http://maps.google.com?q=loc:';
            pstr += data.get_popup.lat + ',' + data.get_popup.lon;
            pstr += '&z=' + map.getZoom();
            pstr += '&t=h" target="_blank">View in Google Maps</a>';
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
    if (data.save) {
        alert('Map saved');
    }
}

function updateTable(){
    $('#data-table table tbody tr').remove();
    if (Object.keys(mapstate.selected).length == 0) {
        $('#data-table table tbody').append('<tr><td>(No Parcels Selected)</td></tr>');
    }
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
    msdata = jQuery.extend(true,{},mapstate);
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

function navMapButtonClick() {
    $('#map-actions').show().siblings().hide();
    $('#lasso').removeClass('btn-primary'); //disables the tool
    $('div.leaflet-top.leaflet-left').css('left','200px');
    $('#map').show();
    $('#data-table').hide();
    drawControl.handlers.polygon.disable();
}

function navOutputButtonClick() {
    $('#output-actions').show().siblings().hide()
    $('#lasso').removeClass('btn-primary');
    $('div.leaflet-top.leaflet-left').css('left','200px');
    updateTable();
    $('#map').hide();
    $('#data-table').show();
    $('input[class=csrf]').val(csrftoken);
    $('input[class=data]').val(JSON.stringify(selectionMapState()));
    drawControl.handlers.polygon.disable();
}

function saveMap(){
    if (!mapstate.name){
        alert('Please name this map first');
        return;
    }
    var data = {
        'action': 'save',
        'mapstate': mapstate
    };
    sendAction(data);
}

function labelButtonClick() {
    $('#label-actions').toggle()
    $('#lasso').removeClass('btn-primary');
    drawControl.handlers.polygon.disable();
}

function tableButtonClick(){
    getData('pdf');
}

function csvButtonClick() {
    getData('csv');
}

function excelButtonClick() {
    getData('xls');
}

function getData(filetype) {
    $('input[id=filetype]').val(filetype);
    $('form#dataform').submit();
}
