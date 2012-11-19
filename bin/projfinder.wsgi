#!/usr/bin/python

import hashlib
import psycopg2
import sys
import os
from paste.request import parse_formvars

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def application(environ, start_response):
    output = ''
    if environ['REQUEST_METHOD'] == 'GET':
        params = parse_formvars(environ)

        connstring="dbname='projfinder' port=5432 user='aaronr' host='localhost' password='aaronr'"
        try:
            conn=psycopg2.connect(connstring)
            cursor=conn.cursor()
            output += 'Connection Success\n'
        except Exception, e:            
            output = 'Connection Failed\n'
            response_headers = [('Content-type', 'text/plain'),
                                ('Content-Length', str(len(output)))]
            status = '500 Internal Server Error'
            start_response(status, response_headers)
            return [output]

        if params.has_key('x') and params.has_key('y') and params.has_key('xx') and params.has_key('yy'):
            selectStatement = "select sp.srid, split_part(sp.srtext,'\"',2), st_distance(st_transform(st_geometryfromtext('POINT(%s %s)',4326),sp.srid),st_geometryfromtext('POINT(%s %s)',sp.srid)) from spatial_ref_sys as sp, epsg_coordinatereferencesystem as cs, epsg_area where st_contains(st_geometryfromtext('POLYGON((' || epsg_area.area_west_bound_lon || ' ' || epsg_area.area_south_bound_lat || ',' || epsg_area.area_east_bound_lon || ' ' || epsg_area.area_south_bound_lat || ',' || epsg_area.area_east_bound_lon || ' ' || epsg_area.area_north_bound_lat || ',' || epsg_area.area_west_bound_lon || ' ' || epsg_area.area_north_bound_lat || ',' || epsg_area.area_west_bound_lon ||  ' ' ||  epsg_area.area_south_bound_lat || '))',4326),st_geometryfromtext('POINT(%s %s)',4326)) is true and cs.area_of_use_code=epsg_area.area_code and exists(select 1 from spatial_ref_sys where srid=cs.coord_ref_sys_code) and srid=cs.coord_ref_sys_code group by sp.srid, sp.auth_name order by st_distance,char_length(split_part(sp.srtext,'\"',2)) limit 10;" % (params['x'],params['y'],params['xx'],params['yy'],params['x'],params['y'])
            cursor.execute(selectStatement)
            results = cursor.fetchall()
            result = "<br><br>"
            for row in results:
                result += '<b>EPSG:</b>%d  <b>Desc:</b>%s  <b>Dist:</b>%f<br><br>' % (row[0],row[1],row[2])
            output += result

            output += 'Query Success<br>'

            response_headers = [('Content-type', 'text/plain'),
                                ('Content-Length', str(len(output)))]
            status = '200 OK'
            start_response(status, response_headers)
        elif params.has_key('x') and params.has_key('y') and params.has_key('epsg'):
            # Need to reproject the coords
            selectStatement = "select st_x(st_transform(st_geometryfromtext('POINT(%s %s)',4326),%s)), st_y(st_transform(st_geometryfromtext('POINT(%s %s)',4326),%s));" % (params['x'],params['y'],params['epsg'],params['x'],params['y'],params['epsg'])
            cursor.execute(selectStatement)
            results = cursor.fetchone()
            output = "x=%f y=%f" % (results[0], results[1])
            response_headers = [('Content-type', 'text/plain'),
                                ('Content-Length', str(len(output)))]
            status = '200 OK'
            start_response(status, response_headers)
        else:
            output = 'No Params\n'
            status = '500 Internal Server Error'
            response_headers = [('Content-type', 'text/plain'),
                                ('Content-Length', str(len(output)))]
            start_response(status, response_headers)
    else:
        output = 'Needs to be GET\n'
        status = '500 Internal Server Error'
        response_headers = [('Content-type', 'text/plain'),
                            ('Content-Length', str(len(output)))]
        start_response(status, response_headers)
    return [output]

def check_password(environ, user, password):
    connstring="dbname='erma_gregc' port=5432 user='gcorradini' host='localhost' password='gcorradini'"
    try:
        conn=psycopg2.connect(connstring)
        cursor=conn.cursor()
    except Exception, e:            
        return False

    cursor.execute("SET SEARCH_PATH TO arctic_gregc, public, postgis, topology")
    selectStatement = "select count(*) from people where lower(username) = '%s' and password = '%s'" % (user, hashlib.md5(password).hexdigest())
    cursor.execute(selectStatement)
    validUser = cursor.fetchone()[0]

    if validUser > 0:
        return True
    else:
        return False


if __name__ == "__main__":
    from optparse import OptionParser
    usage = "usage: %prog username password"

    # Options parsing
    parser = OptionParser(usage=usage)
    #parser.add_option("-v", "--verbose",
    #                  action="store_true", dest="verbose")
    (options, args) = parser.parse_args()

    if len(args) < 2:
        parser.error("Please specify a username and password to test...")

    if check_password('',args[0],args[1]):
        print "Valid User"
    else:
        print "Not Valid User"
