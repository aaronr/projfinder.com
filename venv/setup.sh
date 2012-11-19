#!/bin/bash

# This script should be run whenever new packages are installed to ensure
# things are set for future runs, and of course to setup a new virtualenv
VENV_BASE=$(pwd)
VENV_SUBDIR='projfinder'
CMD=pip
REQ="requirements.txt"
EGG_CACHE="egg-cache"
APACHE_USER="www-data"
which virtualenv &>/dev/null
if [ $? -ne 0 ]; then
  echo "virtualenv command not found"
  sudo easy_install virtualenv
  exit "Install virtualenv..."
fi

if [ -d "${VENV_SUBDIR}" ]; then
  echo "virtualenv has already been created"
else
  virtualenv --no-site-packages "${VENV_SUBDIR}"
  # Install GDAL in venv
  CONFIG=$(which gdal-config)
  if [ $? -ne 0 ]; then
    echo "gdal-config is not in PATH"
    rm -rf "${VENV_SUBDIR}"
    exit 1
  fi
  ln -s $CONFIG "${VENV_SUBDIR}/bin/"
fi
source "${VENV_SUBDIR}/bin/activate"
easy_install pip
pip install https://github.com/hiidef/oauth2app/tarball/master

if [ -f "$REQ" ]; then
  $CMD_PREFIX $CMD install $EXTRA_ARGS -r $REQ
fi

# Install the patch for paste.cgiapp so we can set the proctitle
# to better detect what mapfiles are being served.
patch -r - -N ${VENV_SUBDIR}/lib/python2.7/site-packages/paste/cgiapp.py < patches/cgiapp.diff 

# Install the patch for Django to provide support for PostGIS 2.0 
# and PostgreSQL 9.1


patch -r - -N ${VENV_SUBDIR}/lib/python2.7/site-packages/django/contrib/gis/db/backends/postgis/creation.py < patches/django-postgis.diff


echo "Downloading and install TileCache from svn"
mkdir -p src
echo $CMD_PREFIX svn co http://svn.osgeo.org/tilecache/trunk/tilecache/ src/tilecache
$CMD_PREFIX svn co http://svn.osgeo.org/tilecache/trunk/tilecache/ src/tilecache
cd src/tilecache
python setup.py install
cd $VENV_BASE
echo "To generate a new requirements.txt, run the command '$CMD freeze|grep -vi tilecache > $REQ'"
if [ ! -d "$EGG_CACHE" ]; then
  echo "Creating the egg cache"
  mkdir -p "$EGG_CACHE"
fi
sudo chown "$APACHE_USER" "$EGG_CACHE"
echo "To switch to this venv run the command 'source $VENV_SUBDIR/bin/activate'"
