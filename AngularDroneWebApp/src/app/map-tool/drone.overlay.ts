export function loadDroneOverlay(google) {
    return class DroneOverlay extends (google.maps.OverlayView as { new():any}) {
        image_: any;
        map_: any;
        div_: any;
        rotation_: any;
        gpsPoint_: any;
        batteryLevel_: any;
        sprayLevel_: any;
        batteryDiv_: any;
        sprayerDiv_: any;
        displayBars: any;
        zIndex: any;
        constructor(gps, image, private map, display_bars = true, zIndex = 9999) {
            super();
            // Initialize all properties.
            this.image_ = image;
            this.map_ = map;
            this.rotation_ = 0;
            this.gpsPoint_ = gps;
            this.batteryLevel_ = 100;
            this.sprayLevel_ = 100;
            this.displayBars = display_bars;
            this.zIndex = zIndex;
            // Define a property to hold the image's div. We'll
            // actually create this div upon receipt of the onAdd()
            // method so we'll leave it null for now.
            this.div_ = null;
            this.batteryDiv_ = null;
            this.sprayerDiv_ = null;
            // Explicitly call setMap on this overlay.
            this.setMap(map);
        }
        /**
         * onAdd is called when the map's panes are ready and the overlay has been
         * added to the map.
         */
        onAdd() {
            const div = document.createElement('div');
            div.style.borderStyle = 'none';
            div.style.borderWidth = '0px';
            div.style.position = 'absolute';
    
            // Create the img element and attach it to the div.
            const img = document.createElement('img');
            img.src = this.image_;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.position = 'absolute';
            div.style.zIndex = this.zIndex;
            img.id = 'droneId';
            div.appendChild(img);
            
            if(this.displayBars) {
                const bdiv = document.createElement('div');
                const sdiv = document.createElement('div');
        
                bdiv.className = 'statusContainer battery';
                sdiv.className = 'statusContainer spray';
                bdiv.style.top = '-15px';
                sdiv.style.top = '-30px';
        
                bdiv.style.width = '80px';
                bdiv.style.border = '2px solid #4b4641';
                bdiv.style.left = '-12px';
                bdiv.style.position = 'absolute';
                bdiv.style.borderRadius = '2px';
        
                sdiv.style.width = '80px';
                sdiv.style.border = '2px solid #4b4641';
                sdiv.style.left = '-12px';
                sdiv.style.position = 'absolute';
                sdiv.style.borderRadius = '2px';
        
        
                const battery = document.createElement('div');
                battery.style.width = (0.8 * this.batteryLevel_) + 'px';
                battery.style.height = '8px';
                battery.style.background = '#f14a42';
                this.batteryDiv_ = battery;
        
                const spray = document.createElement('div');
                spray.style.width = (0.8 * this.sprayLevel_) + 'px';
                spray.style.height = '8px';
                spray.style.background = '#4260f1';
                this.sprayerDiv_ = spray;
        
                bdiv.appendChild(battery);
                sdiv.appendChild(spray);
        
                div.appendChild(bdiv);
                div.appendChild(sdiv);
            }
            this.div_ = div;
            // Add the element to the "overlayLayer" pane.
            const panes = this.getPanes();
            panes.overlayLayer.appendChild(div);
        };
        draw() {
            if(!this.map) return;
            // We use the south-west and north-east
            // coordinates of the overlay to peg it to the correct position and size.
            // To do this, we need to retrieve the projection from the overlay.
            const overlayProjection = this.getProjection();
            // Retrieve the south-west and north-east coordinates of this overlay
            // in LatLngs and convert them to pixel coordinates.
            // We'll use these coordinates to resize the div.
            const gp = overlayProjection.fromLatLngToDivPixel(this.gpsPoint_);
            // Resize the image's div to fit the indicated dimensions.
            const div = this.div_;
            div.style.left = (gp.x - 30) + 'px';
            div.style.top = (gp.y - 30) + 'px';
            div.style.width = '60px';
            div.style.height = '60px';
            div.style.transform = "rotate(" + this.rotation_ + "deg)";
            if(this.displayBars) {
                this.batteryDiv_.style.width = (0.8 * this.batteryLevel_) + 'px';
                this.sprayerDiv_.style.width = (0.8 * this.sprayLevel_) + 'px';
            }
        };
        setPosition(gps, angle, battery = 0, spray = 0) {
          this.gpsPoint_ = new google.maps.LatLng(gps.lat, gps.lng);
          this.rotation_ = angle;
          if(this.displayBars) {
            this.batteryLevel_ = battery;
            this.sprayLevel_ = spray;
          }
          this.draw();
        }
        // The onRemove() method will be called automatically from the API if
        // we ever set the overlay's map property to 'null'.
        onRemove() {
            this.div_.parentNode.removeChild(this.div_);
            this.div_ = null;
        };
    };
}