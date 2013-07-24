masterblaster.tools.buffer = masterblaster.Tool.extend({
    name: 'buffer',
    toggleId: '#addbuffer',
    activate: function() {
        this.activateButtons();
        $("#dobuffer").click( $.proxy(this.runBuffer, this));
        $('#addbuffer').hide();
        $('#fullbuffer').css('display', 'inline-block');
        $("#hidebuffer").click( $.proxy(this.deactivate, this));
    },

    deactivate: function() {
        $('#addbuffer').show();
        $('#fullbuffer').hide();
        this.deactivateButtons();
    },

    click: function(e) {
        var data = {
            'action': 'select',
            'lat': e.latlng.lat,
            'lon': e.latlng.lng
        }
    masterblaster.tools.sendAction(data, this.drawParcel)
    },

    drawParcel: function(data) {
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
        }
    },

    runBuffer: function() {
        var data = {
            'action': 'buffer',
            'dist': $('#bufferdist').val() || '300',
            'mapstate': mapstate
        }
        masterblaster.tools.sendAction(data, this.drawBuffer);
    },

    drawBuffer: function(data) {
        if (data.mapstate) {
            mapstate = data.mapstate;
            updatePageState();
        }
    }
});

masterblaster.tools.add(new masterblaster.tools.buffer)
