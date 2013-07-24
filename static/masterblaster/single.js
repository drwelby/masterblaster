masterblaster.tools.single = masterblaster.Tool.extend({
    name: 'single',
    toggleId: '#pick',
    activate: function() {
        this.activateButtons();
    },

    deactivate: function() {
        this.deactivateButtons();
    },

    click: function(e) {
        var data = {
            'action': 'toggle',
            'lat': e.latlng.lat,
            'lon': e.latlng.lng
        };
        masterblaster.tools.sendAction(data,this.callback)
    },

    callback: function(data) {
        if (data.toggle.feature) {
            apn = data.toggle.feature.properties.apn;
            if (mapstate.selected[apn]) {
                delete mapstate.selected[apn];
            }else{
                mapstate.selected[apn] = data.toggle.feature;
            }
            updatePageState();
        }
    }
});

masterblaster.tools.add(new masterblaster.tools.single)
