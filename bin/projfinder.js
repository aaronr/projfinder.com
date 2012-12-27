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
    res.sendfile(__dirname + '/index.html');
});
app.use("/static", express.static(__dirname + '/static'));

app.get('/reproject', function (req, res) {
    function ReprojectionObject(){
	this.type = 'Reprojection';
	this.from = new Array();
	this.to = new Array();
    };
    
    var x = req.query['x'];
    var y = req.query['y'];
    var epsg = req.query['epsg'];
    if (!!x && !!y && !!epsg) {
        //res.jsonp({'epsg':epsg,'x':x,'y':y});
        var connString = 'postgres://aaronr:aaronr@localhost:5432/projfinder';
        pg.connect(connString, function(err, client) {   
            if (err) {
                res.jsonp({'error':err});
                console.log(err);
            } else {
		var sql = "select st_asgeojson(st_geometryfromtext('POINT(" + x + " " + y + ")',4326),15,4) as from, st_asgeojson(st_transform(st_geometryfromtext('POINT(" + x + " " + y + ")',4326)," + epsg + "),15,4) as to;"
		//console.log(sql);
		//var sql = "select alias_code from epsg_alias";
                client.query(sql, function(err,result) {
                    if ( err ) {
                        res.jsonp({'error':err});
                        console.log(err);                       
                    } else {
                        var reprojection = new ReprojectionObject();
                        for (i = 0; i < result.rows.length; i++) {
                            reprojection.from[i] = JSON.parse(result.rows[i].from);
                            reprojection.to[i] = JSON.parse(result.rows[i].to);
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

