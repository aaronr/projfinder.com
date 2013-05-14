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
    var osm = new OpenLayers.Layer.OSM( 
          "Open Street Maps"
    );
    
    map.addLayers( [ osm ] );

    // Coordinate display at bottom of map
    //map.addControl(new OpenLayers.Control.MousePosition());

    map.events.register("move", map, function(e) {
        // Always display lat/lon
        OpenLayers.Util.getElement("xcoord").innerHTML = '' + 
            this.getCenter().transform(map.getProjectionObject(),
				       new OpenLayers.Projection("EPSG:4326")).lon.toFixed(6);
        OpenLayers.Util.getElement("ycoord").innerHTML = '' + 
            this.getCenter().transform(map.getProjectionObject(),
				       new OpenLayers.Projection("EPSG:4326")).lat.toFixed(6);
    });

//    map.events.register("moveend", map, function(e) {
//        // Also display transformed
//        var lon = this.getCenter().transform(map.getProjectionObject(),
//					     new OpenLayers.Projection("EPSG:4326")).lon;
//        var lat = this.getCenter().transform(map.getProjectionObject(),
//					     new OpenLayers.Projection("EPSG:4326")).lat;
//        var url = "http://api.projfinder.com/api/reproject?x="+lon+"&y="+lat+"&epsg="+$("#xyproj").val();
//	url = url + "&callback=?";
//        $.getJSON(url, function(data) {
//            $('#xycoord').html("x="+data.response[0].coordinates[0]+" y="+data.response[0].coordinates[1]);
//        });
//    });

    var point = new OpenLayers.LonLat(-122.1066 , 48.033); 
    // Need to convert zoom point to mercator too
    point.transform(new OpenLayers.Projection("EPSG:4326"), 
		    map.getProjectionObject());
    map.setCenter(point, 10); 

    // Hook up to the button to query
    $("#myButton").click(function(){
	var url = "http://api.projfinder.com/api/projfinder?ref_lon="+$("#xcoord").html()+"&ref_lat="+$("#ycoord").html()+"&unknown_x="+$("#xtxt").val()+"&unknown_y="+$("#ytxt").val()+"&limit=5";
	url = url + "&callback=?";
        $.getJSON(url, function(data) {
            $("#response-table tbody").remove();
            for (i = 0; i < data.response.length; i++) {
                $("#response-table").append("<tr><td>"+data.response[i].rank+"</td><td>"+" EPSG:"+data.response[i].srid+" Name:"+data.response[i].name+"</td></tr>");
            }
            $("#response-div").show();
        });
    })
}
