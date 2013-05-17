var map = null;
var vector_layer = null;
var select_feature = null;
var getCenter = null;

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
    
    //var vector_style = new OpenLayers.Style({
    //    strokeWidth:2, fillOpacity:0, strokeColor: '#008000'});
    //
    //
    //var styleMap = new OpenLayers.StyleMap({
    //    'default': vector_style,
    //    'select': {strokeColor: '#0000FF'}
    //});
    //vector_layer = new OpenLayers.Layer.Vector("points", {displayInLayerSwitcher: false,
    //                                                      styleMap: styleMap},
    //                                           {visibility: true});

    vector_layer = new OpenLayers.Layer.Vector("points");

    map.addLayers( [ osm, vector_layer ] );

    select_feature = new OpenLayers.Control.SelectFeature(vector_layer);
    map.addControl(select_feature);
    select_feature.activate();

    // Coordinate display at bottom of map
    map.addControl(new OpenLayers.Control.MousePosition());

    map.events.register("move", map, function(e) {
        // Always display lat/lon
        OpenLayers.Util.getElement("xcoord").innerHTML = '' + 
            this.getCenter().transform(map.getProjectionObject(),
				       new OpenLayers.Projection("EPSG:4326")).lon.toFixed(6);
        OpenLayers.Util.getElement("ycoord").innerHTML = '' + 
            this.getCenter().transform(map.getProjectionObject(),
				       new OpenLayers.Projection("EPSG:4326")).lat.toFixed(6);
    });

    getCenter = function(epsg) {
        // Also display transformed
        var lon = map.getCenter().transform(map.getProjectionObject(),
					    new OpenLayers.Projection("EPSG:4326")).lon;
        var lat = map.getCenter().transform(map.getProjectionObject(),
					    new OpenLayers.Projection("EPSG:4326")).lat;
        var url = "http://api.projfinder.com/api/reproject?x="+lon+"&y="+lat+"&epsg="+epsg;
	url = url + "&callback=?";
        $.getJSON(url, function(data) {
            console.log("x="+data.response[0].coordinates[0]+" y="+data.response[0].coordinates[1]);
            //$('#xycoord').html("x="+data.response[0].coordinates[0]+" y="+data.response[0].coordinates[1]);
        });
    };

    // x=-93.20981044922574 y=44.95983271358222
    var point = new OpenLayers.LonLat(-93.209810 , 44.95983); 
    // Need to convert zoom point to mercator too
    point.transform(new OpenLayers.Projection("EPSG:4326"), 
		    map.getProjectionObject());
    map.setCenter(point, 10); 

    // Hook up to the button to query
    $("#myButton").click(function(){
	var url = "http://api.projfinder.com/api/projfinder?ref_lon="+$("#xcoord").html()+"&ref_lat="+$("#ycoord").html()+"&unknown_x="+$("#xtxt").val()+"&unknown_y="+$("#ytxt").val()+"&limit=10";
	url = url + "&callback=?";
        $.getJSON(url, function(data) {
            var geojson_format = new OpenLayers.Format.GeoJSON({
                externalProjection: new OpenLayers.Projection("EPSG:900913"),
                internalProject: new OpenLayers.Projection("EPSG:4326")
            });
            var features = [];
            $("#response-table tbody").remove();
            for (i = 0; i < data.response.length; i++) {
                $("#response-table").append("<tr id=\""+data.response[i].rank+"\"><td>"+data.response[i].rank+"</td><td>"+" EPSG:"+data.response[i].srid+" Name:"+data.response[i].name+"</td><td>"+" Distance:"+data.response[i].distance.toFixed(6)+"</td></tr>");
                features.push(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(data.response[i].point.coordinates[0],data.response[i].point.coordinates[1]).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),{id:i}));
            }
            vector_layer.removeAllFeatures();
            vector_layer.addFeatures(features.reverse());
            $("#response-div").show();
            $('tr').click(function() {
                // row was clicked
                for(fid in vector_layer.features) {
                    feature = vector_layer.features[fid];
                    if(feature.data.id == parseInt(this.id)){
                        select_feature.select(feature);
                    } else {
                        select_feature.unselect(feature);
                    }
                }
            });
            $('tr#0').click();
        });
    });
}
