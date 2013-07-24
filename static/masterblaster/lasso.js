masterblaster.tools.lasso = masterblaster.Tool.extend({
    name: 'lasso',
    toggleId: '#lasso',
    activate: function() {
        this.activateButtons();
        this._startSelecting();
    },

    deactivate: function() {
        this._stopSelecting();
        this.deactivateButtons();
    },

    _startSelecting: function() {
        this._oldCursor = this._map._container.style.cursor;
        this._map._container.style.cursor = 'default';
        
        $(".leaflet-clickable").css('cursor','default');

        this._doubleClickZoom = this._map.doubleClickZoom.enabled();
        this._map.doubleClickZoom.disable();


        if(!this._layerPaint) {
            this._layerPaint = L.layerGroup().addTo(this._map); 
        }

        if(!this._points) {
            this._points = [];
        }
    },

    _stopSelecting: function() {
        this._map._container.style.cursor = this._oldCursor;
        $(".leaflet-clickable").css('cursor','pointer');

        if(this._doubleClickZoom) {
            this._map.doubleClickZoom.enable();
        }

        if(this._layerPaint) {
            this._layerPaint.clearLayers();
        }
        
        this._restartPath();
    },

    mousemove: function(e) {
        if(!e.latlng || !this._lastPoint) {
            return;
        }
        
        this._layerPaintPath.spliceLatLngs(-1, 1,  e.latlng);
    },

    click: function(e) {
        console.log(e.latlng.equals(this._lastPoint));
        if(!e.latlng || e.latlng.equals(this._lastPoint)) {
            return;
        }

        if(!this._layerPaintPath) {
            this._layerPaintPath = L.polygon([e.latlng], { 
                color: 'orange',
                weight: 2,
                clickable: false
            }).addTo(this._layerPaint);
            this._layerPaintPath.addLatLng(e.latlng);
        }
        if (this._layerPaintPath) {
            this._layerPaintPath.addLatLng(e.latlng);
        }
        this._lastPoint = e.latlng;
    },

    dblclick: function() {
        if (this._layerPaintPath.getLatLngs().length <= 3) {
            return;
        }
        this._layerPaint.removeLayer(this._layerPaintPath);
        this._layerPaintPath.spliceLatLngs(-1, 1);
        geojson = this._layerPaintPath.toGeoJSON();
        var data = {
            'action': 'lasso',
            'lasso': JSON.stringify(geojson),
            'mapstate': mapstate
        };
        masterblaster.tools.sendAction(data, this.callback);
        this._restartPath();
    },

    _restartPath: function() {
        this._layerPaintPath = undefined;
        this._lastPoint = undefined;
    },
    


    _onKeyDown: function (e) {
        if(e.keyCode == 27) {
            // If not in path exit measuring mode, else just finish path
            if(!this._lastPoint) {
                this.toggle();
            } else {
                this.dblclick();
            }
        }
    },

    callback: function(data) {
        if (data.mapstate) {
            mapstate = data.mapstate;
            updatePageState();
        }

    }
});

masterblaster.tools.add(new masterblaster.tools.lasso)
