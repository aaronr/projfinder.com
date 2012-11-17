var map = null;

function init(){

    // map options
    var options = {
              projection: new OpenLayers.Projection("EPSG:900913"),
              displayProjection: new OpenLayers.Projection("EPSG:4326"),
              units: "m",
              numZoomLevels: 20,
              maxResolution: 156543.0339,
              maxExtent: new OpenLayers.Bounds(-20037508, -20037508,
                                  20037508, 20037508.34)
    };
    map = new OpenLayers.Map( 'map', options );

    //  layers
    var gmap = new OpenLayers.Layer.Google(
          "Google Streets", // the default
          {'sphericalMercator': true, numZoomLevels: 20}
    );
    var osm = new OpenLayers.Layer.OSM( 
          "Open Street Maps"
    );
    
    map.addLayers( [ osm, gmap] );

    map.addControl(new OpenLayers.Control.LayerSwitcher());

    // Coordinate display at bottom of map
    map.addControl(new OpenLayers.Control.MousePosition());

    map.events.register("moveend", map, function(e) {
        //var position = this.events.getMousePosition(e);
        // Always display lat/lon
        OpenLayers.Util.getElement("xcoord").innerHTML = '' + 
            this.getCenter().transform(map.getProjectionObject(),
				       new OpenLayers.Projection("EPSG:4326")).lon;
        OpenLayers.Util.getElement("ycoord").innerHTML = '' + 
            this.getCenter().transform(map.getProjectionObject(),
				       new OpenLayers.Projection("EPSG:4326")).lat;
        // Also display transformed
        var lon = this.getCenter().transform(map.getProjectionObject(),
					     new OpenLayers.Projection("EPSG:4326")).lon;
        var lat = this.getCenter().transform(map.getProjectionObject(),
					     new OpenLayers.Projection("EPSG:4326")).lat;
        var url = "/pmp?x="+lon+"&y="+lat+"&epsg="+$("#xyproj").val();
        $.get(url, function(data) {
            $('#xycoord').html(data);
        });



    });

    var point = new OpenLayers.LonLat(-122.1066 , 48.033); 
    // Need to convert zoom point to mercator too
    point.transform(new OpenLayers.Projection("EPSG:4326"), 
		    map.getProjectionObject());
    map.setCenter(point, 10); 

    // Hook up to the button to query
    $("#myButton").click(function(){
        var url = "/pmp?x="+$("#xcoord").html()+"&y="+$("#ycoord").html()+"&xx="+$("#xtxt").val()+"&yy="+$("#ytxt").val();
        $.get(url, function(data) {
            $('#results').html(data);
        });
    })
}
