var presstimer;
var lastLatLng;
var lastapn = "";


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
map.on('popupclose', function(){delete mapstate.popup});

function hover(e) {
    if (e.latlng.equals(lastLatLng)) {
        var data = {
            'action': 'get_feature',
            'lat': e.latlng.lat,
            'lon': e.latlng.lng
        };
        masterblaster.tools.sendAction(data, callbackInfo)
    }
}

function callbackInfo(data) {
    if (data.get_feature) {
        if (data.get_feature.feature) {
            ftprop = data.get_feature.feature.properties;
            msg = ftprop.owner;
            if (ftprop.situs1 != "No Data") {
                msg += " - " + ftprop.situs1;
            }
            if (ftprop.apn != lastapn) {
                $('#info-overlay').html(msg).hide().fadeIn(100);
                lastapn = ftprop.apn;
        }
        } else {
            msg = "...";
            $('#info-overlay').html(msg);
            lastapn = "";
        }
    }
}

function getPopup(e) {
    var data = {
        'action': 'get_popup',
        'lat': e.latlng.lat,
        'lon': e.latlng.lng
    };
    masterblaster.tools.sendAction(data, callbackPopup);
}

function callbackPopup(data) {
    if (data.get_popup) {
        if (data.get_popup.feature) {
            lat = parseFloat(data.get_popup.lat);
            lon = parseFloat(data.get_popup.lon);
            mapstate.popup = [lat,lon];
            ftprop = data.get_popup.feature.properties;
            pstr = "<table class='popup-table'>";
            pstr += "<tr><td><b>Owner</b>: </td><td>" + (ftprop.owner || "") + "</td></tr>";
            pstr += "<tr><td><b>Situs</b>: </td><td>" + (ftprop.situs1 || "") + "</td></tr>";
            pstr += "<tr><td></td><td>" + (ftprop.situs2 || "") + "</td></tr>";
            pstr += "<tr><td><b>Mailing</b>: </td><td>" + (ftprop.mail1 || "") + "</td></tr>";
            pstr += "<tr><td></td><td>" + (ftprop.mail2 || "") + "</td></tr>";
            pstr += "<tr><td><b>Acres</b>: </td><td>" + (ftprop.area || "") + "</td></tr>";
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
}
