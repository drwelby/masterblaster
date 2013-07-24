masterblaster.tools.measure = masterblaster.Tool.extend({
    name: 'measure',
    toggleId: '#measure',
    activate: function() {
        this.activateButtons();
        this._startMeasuring();
    },

    deactivate: function() {
        this._stopMeasuring();
        this.deactivateButtons();
    },

    _startMeasuring: function() {
        this._oldCursor = this._map._container.style.cursor;
        this._map._container.style.cursor = 'crosshair';
        
        $(".leaflet-clickable").css('cursor','crosshair');

        this._doubleClickZoom = this._map.doubleClickZoom.enabled();
        this._map.doubleClickZoom.disable();


        if(!this._layerPaint) {
            this._layerPaint = L.layerGroup().addTo(this._map); 
        }

        if(!this._points) {
            this._points = [];
        }
    },

    _stopMeasuring: function() {
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
        
        if(!this._layerPaintPathTemp) {
            this._layerPaintPathTemp = L.polyline([this._lastPoint, e.latlng], { 
                color: 'orange',
                weight: 1.5,
                clickable: false,
                dashArray: '8,6'
            }).addTo(this._layerPaint);
        } else {
            this._layerPaintPathTemp.spliceLatLngs(0, 2, this._lastPoint, e.latlng);
        }

        if(this._tooltip) {
            if(!this._distance) {
                this._distance = 0;
            }

            this._updateTooltipPosition(e.latlng);

            var distance = e.latlng.distanceTo(this._lastPoint);
            this._updateTooltipDistance(this._distance + distance, distance);
        }
    },

    click: function(e) {
        // Skip if no coordinates
        if(!e.latlng) {
            return;
        }

        // If we have a tooltip, update the distance and create a new tooltip, leaving the old one exactly where it is (i.e. where the user has clicked)
        if(this._lastPoint && this._tooltip) {
            if(!this._distance) {
                this._distance = 0;
            }

            this._updateTooltipPosition(e.latlng);

            var distance = e.latlng.distanceTo(this._lastPoint) * 3.2808;
            this._updateTooltipDistance(this._distance + distance, distance);

            this._distance += distance;
        }
        this._createTooltip(e.latlng);
        

        // If this is already the second click, add the location to the fix path (create one first if we don't have one)
        if(this._lastPoint && !this._layerPaintPath) {
            this._layerPaintPath = L.polyline([this._lastPoint], { 
                color: 'orange',
                weight: 2,
                clickable: false
            }).addTo(this._layerPaint);
        }

        if(this._layerPaintPath) {
            this._layerPaintPath.addLatLng(e.latlng);
        }

        // Upate the end marker to the current location
        if(this._lastCircle) {
            this._layerPaint.removeLayer(this._lastCircle);
        }

        this._lastCircle = new L.CircleMarker(e.latlng, { 
            color: 'orange', 
            opacity: 1, 
            weight: 1, 
            fill: true, 
            fillOpacity: 1,
            radius:2,
            clickable: this._lastCircle ? true : false
        }).addTo(this._layerPaint);
        
        this._lastCircle.on('click', function() { this.dblclick(); }, this);

        // Save current location as last location
        this._lastPoint = e.latlng;
    },

    dblclick: function() {
        // Remove the last end marker as well as the last (moving tooltip)
        console.log(this);
        if(this._lastCircle) {
            this._layerPaint.removeLayer(this._lastCircle);
        }
        if(this._tooltip) {
            this._layerPaint.removeLayer(this._tooltip);
        }
        if(this._layerPaint && this._layerPaintPathTemp) {
            this._layerPaint.removeLayer(this._layerPaintPathTemp);
        }

        // Reset everything
        this._restartPath();
    },

    _restartPath: function() {
        this._distance = 0;
        this._tooltip = undefined;
        this._lastCircle = undefined;
        this._lastPoint = undefined;
        this._layerPaintPath = undefined;
        this._layerPaintPathTemp = undefined;
    },
    
    _createTooltip: function(position) {
        var icon = L.divIcon({
            className: 'leaflet-measure-tooltip',
            iconAnchor: [-5, -5]
        });
        this._tooltip = L.marker(position, { 
            icon: icon,
            clickable: false
        }).addTo(this._layerPaint);
    },

    _updateTooltipPosition: function(position) {
        this._tooltip.setLatLng(position);
    },

    _updateTooltipDistance: function(total, difference) {
        var totalRound = this._round(total),
            differenceRound = this._round(difference);

        var text = '<div class="leaflet-measure-tooltip-total">' + totalRound + ' ft</div>';
        if(differenceRound > 0 && totalRound != differenceRound) {
            text += '<div class="leaflet-measure-tooltip-difference">(+' + differenceRound + ' ft)</div>';
        }

        this._tooltip._icon.innerHTML = text;
    },

    _round: function(val) {
        return Math.floor(val);
        //return Math.round((val / 1852) * 10) / 10;
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
    }
});

masterblaster.tools.add(new masterblaster.tools.measure)
