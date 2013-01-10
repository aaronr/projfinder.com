/*
  ProjFinder
*/
var app = require('express')();
var express = require("express");
var server = require('http').createServer(app);
server.listen(9000);
/*var io = require('socket.io').listen(server);*/
var pg = require('pg');


app.get('/', function (req, res) {
    res.sendfile(__dirname + '/www/index.html');
});
app.use("/static", express.static(__dirname + '/static'));

app.get('/reproject', function (req, res) {
    function ReprojectionObject(){
	this.type = 'Reprojection';
	this.request = new Array();
	this.result = new Array();
    };
    
    var x = req.query['x'];
    var y = req.query['y'];
    var epsg = req.query['epsg'];
    if (!!x && !!y && !!epsg) {
        var connString = 'postgres://aaronr:aaronr@localhost:5432/projfinder';
        pg.connect(connString, function(err, client) {   
            if (err) {
                res.jsonp({'error':err});
                console.log(err);
            } else {
		var sql = "select st_asgeojson(st_geometryfromtext('POINT(" + x + " " + y + ")',4326),15,4) as request, st_asgeojson(st_transform(st_geometryfromtext('POINT(" + x + " " + y + ")',4326)," + epsg + "),15,4) as result limit 1;"
		//console.log(sql);
                client.query(sql, function(err,result) {
                    if ( err ) {
                        res.jsonp({'error':err});
                        console.log(err);                       
                    } else {
                        var reprojection = new ReprojectionObject();
                        for (i = 0; i < result.rows.length; i++) {
                            reprojection.request[i] = JSON.parse(result.rows[i].request);
                            reprojection.result[i] = JSON.parse(result.rows[i].result);
                        }
                        res.jsonp( reprojection );
                    }
                });
            }
        });
    } else {
        res.jsonp({'error':'invalid query parameters'});
    }
});

app.get('/projfinder', function (req, res) {
    function ProjFinderObject(){
	this.type = 'ProjFinder';
	this.request = new Array();
	this.result = new Array();
    };
    function ProjRequestObject(){
	this.type = 'ProjRequest';
	this.ref = null;
	this.unknown = null;
    };
    function ProjResultObject(){
	this.type = 'ProjResult';
	this.rank = -1;
	this.name = "";
	this.distance = -1;
	this.units = "";
	this.srid = -1;
	this.point = {};
    };
    
    var ref_lon = req.query['ref_lon'];
    var ref_lat = req.query['ref_lat'];
    var unknown_x = req.query['unknown_x'];
    var unknown_y = req.query['unknown_y'];

    if (!!ref_lon && !!ref_lat && !!unknown_x && !!unknown_y) {
	var limit = (req.query['limit']) ? req.query['limit'] : 10;
        var connString = 'postgres://aaronr:aaronr@localhost:5432/projfinder';
        pg.connect(connString, function(err, client) {   
            if (err) {
                res.jsonp({'error':err});
                console.log(err);
            } else {
		// First see if we get results...
		var sql = [
		    "select st_asgeojson(st_geometryfromtext('POINT(" + unknown_x + " " + unknown_y + ")',sp.srid),15,4) as geojson,",
		    "sp.srid as srid, split_part(sp.srtext,'\"',2) as name,",
		    "st_distance(st_transform(st_geometryfromtext('POINT(" + ref_lon + " " + ref_lat + ")',4326),sp.srid),",
		    "st_geometryfromtext('POINT(" + unknown_x + " " + unknown_y + ")',sp.srid)) as distance",
		    "from spatial_ref_sys as sp,",
		    "epsg_coordinatereferencesystem as cs,",
		    "epsg_poly_bb as bb",
		    "where st_contains(bb.geom, st_geometryfromtext('POINT(" + ref_lon + " " + ref_lat + ")',4326)) is true",
		    "and cs.area_of_use_code=bb.area_code and",
		    "exists(select 1 from spatial_ref_sys where srid=cs.coord_ref_sys_code)",
		    "and srid=cs.coord_ref_sys_code",
		    "group by sp.srid, sp.auth_name",
		    "order by distance,char_length(split_part(sp.srtext,'\"',2)) limit "+ limit].join("\n");
		//console.log(sql);
                client.query(sql, function(err,result) {
                    if ( err ) {
                        res.jsonp({'error':err});
                        console.log(err);                       
                    } else {
                        var projfinder = new ProjFinderObject();
                        for (i = 0; i < result.rows.length; i++) {
			    projfinder.result[i] = new ProjResultObject();
                            projfinder.result[i].rank = i;
                            projfinder.result[i].name = result.rows[i].name;
                            projfinder.result[i].distance = result.rows[i].distance;
                            projfinder.result[i].srid = result.rows[i].srid;
                            projfinder.result[i].units = result.rows[i].units;
                            projfinder.result[i].point = JSON.parse(result.rows[i].geojson);
                        }
			// Need to get some geojson for the initial request to send back as well...
			var sql = [
			    "select st_asgeojson(st_geometryfromtext('POINT(" + unknown_x + " " + unknown_y + ")',-1)) as unknown_geojson,",
			    "st_asgeojson(st_geometryfromtext('POINT(" + ref_lon + " " + ref_lat + ")',4326),15,4) as ref_geojson"].join("\n");
			//console.log(sql);
			client.query(sql, function(err,result) {
			    if ( err ) {
				res.jsonp({'error':err});
				console.log(err);                       
			    } else {
				for (i = 0; i < result.rows.length; i++) {
				    projfinder.request[i] = new ProjRequestObject();
				    projfinder.request[i].ref = JSON.parse(result.rows[i].ref_geojson);
				    projfinder.request[i].unknown = JSON.parse(result.rows[i].unknown_geojson);
				}
				res.jsonp( projfinder );
			    }
			});
                    }
                });
            }
        });
    } else {
        res.jsonp({'error':'invalid query parameters'});
    }
});

app.get('/psql', function (req, res) {
    //function FeatureCollection(){
    //    this.type = 'FeatureCollection';
    //    this.features = new Array();
    //}
    var connString = 'postgres://gcorradini:gcorradini@localhost:5432/projfinder';
    pg.connect(connString, function(err, client) {
        if ( err ) {
            console.log( err );                  
        }
        var sql = "select alias_code from epsg_alias";
        client.query(sql, function(err, result) {
            if ( err ) {
                console.log( err );                     
            }
            var featureCollection = new FeatureCollection();
            for (i = 0; i < result.rows.length; i++)
            {
                featureCollection.features[i] = JSON.parse( result.rows[i].alias_code );
            }
            //res.writeHead(200, { 'Content-Type': 'application/json' });
            //res.write( JSON.stringify( { 'hello' : 'goodbye' } ) );
            res.jsonp( featureCollection );
        });
    }); // END pg.connect
}); // END psql

/*app.use("/public", express.static(__dirname + '/public'));*/




















/*
**
**  socket.io
**
*/
/*
  io.sockets.on('connection', function (socket) {


  function FeatureCollection(){
  this.type = 'FeatureCollection';
  this.features = new Array();
  }

  
  pg.connect(connString, function(err, client) {
  
  if ( err ) {

  console.log( err );                  

  }

  var sql = 'select ST_X(geom_wgs84) as lon, ST_Y(geom_wgs84) as lat from common_interest;';
  
  client.query(sql, function(err, result) {
  
  var coordinates = new Array();

  for (i = 0; i < result.rows.length; i++)
  {
  coordinates[i] = { lat: result.rows[i].lat, lon: result.rows[i].lon };
  }

  socket.emit( 'coordinates', coordinates );
  
  });


  }); // END pg.connect

  socket.on( 'load_coordinates', function( data ) {

  if (! data.bbox ) {
  socket.emit( 'coordinates', { 'success' : false } );    
  }
  pg.connect(connString, function(err, client) {
  
  if ( err ) {

  console.log( err );                  

  }

  var sql = "select ST_X(geom_wgs84) as lon, ST_Y(geom_wgs84) as lat " + 
  "FROM common_interest " +
  "WHERE ST_Within( geom_wgs84, ST_GeomFromText( 'POLYGON((" +
  data.bbox[0] +" "+ data.bbox[1] +","+ data.bbox[0] +" "+ data.bbox[3] +","+ data.bbox[2] +" "+ data.bbox[3] +
  ","+ data.bbox[2] +" "+ data.bbox[1] +","+ data.bbox[0] +" "+ data.bbox[1] +"))', 4326 ) )";
  
  client.query(sql, function(err, result) {
  
  if ( err ) {

  console.log( err );                     

  }
  var coordinates = new Array();

  for (i = 0; i < result.rows.length; i++)
  {
  coordinates[i] = { lat: result.rows[i].lat, lon: result.rows[i].lon };
  }

  console.log( 'coordinates length = ' + coordinates.length );
  socket.emit( 'bbox_coordinates', coordinates );
  
  });


  }); // END pg.connect

  }); // END socket.on

  socket.on( 'load_polygons', function( data ) {

  if (! data.bbox ) {
  socket.emit( 'bbox_polygons', { 'success' : false } );  
  }
  pg.connect(connString, function(err, client) {
  
  if ( err ) {

  console.log( err );                  

  }

  var sql = "select ST_AsGeoJSON( geom_wgs84 )  as shape " + 
  "FROM dstcode " +
  "WHERE ST_Intersects( geom_wgs84, ST_GeomFromText( 'POLYGON((" +
  data.bbox[0] +" "+ data.bbox[1] +","+ data.bbox[0] +" "+ data.bbox[3] +","+ data.bbox[2] +" "+ data.bbox[3] +
  ","+ data.bbox[2] +" "+ data.bbox[1] +","+ data.bbox[0] +" "+ data.bbox[1] +"))', 4326 ) )";
  
  client.query(sql, function(err, result) {
  
  if ( err ) {

  console.log( err );                     

  }
  var featureCollection = new FeatureCollection();

  for (i = 0; i < result.rows.length; i++)
  {
  //console.log( result.rows[i] );
  //polygons[i] = {  obj : result.rows[i] };
  featureCollection.features[i] = JSON.parse(result.rows[i].shape);
  }

  socket.emit( 'bbox_polygons', featureCollection );
  
  });


  }); // END pg.connect

  }); // END socket.on


  socket.on( 'load_geojson_points', function( data ) {

  if (! data.bbox ) {
  socket.emit( 'bbox_geojson_points', { 'success' : false } );    
  }
  pg.connect(connString, function(err, client) {
  
  if ( err ) {

  console.log( err );                  

  }

  var sql = "select ST_AsGeoJSON( geom_wgs84 )  as shape " + 
  "FROM common_interest " +
  "WHERE ST_Within( geom_wgs84, ST_GeomFromText( 'POLYGON((" +
  data.bbox[0] +" "+ data.bbox[1] +","+ data.bbox[0] +" "+ data.bbox[3] +","+ data.bbox[2] +" "+ data.bbox[3] +
  ","+ data.bbox[2] +" "+ data.bbox[1] +","+ data.bbox[0] +" "+ data.bbox[1] +"))', 4326 ) )";
  
  client.query(sql, function(err, result) {
  
  if ( err ) {

  console.log( err );                     

  }

  var featureCollection = new FeatureCollection();

  for (i = 0; i < result.rows.length; i++)
  {
  featureCollection.features[i] = JSON.parse(result.rows[i].shape);
  }

  socket.emit( 'bbox_geojson_points', featureCollection );
  
  });


  }); // END pg.connect

  }); // END socket.on
  });
*/

