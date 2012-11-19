#!/data2/aaron.noaaerma.org/regional/arctic2/venv/erma/bin/python
from TileCache.Service import wsgiApp

if __name__ == '__main__':
    from flup.server.fcgi_fork  import WSGIServer
    WSGIServer(wsgiApp).run()
