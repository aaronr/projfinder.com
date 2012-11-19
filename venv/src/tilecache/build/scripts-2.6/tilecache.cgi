#!/data2/aaron.noaaerma.org/regional/arctic2/venv/erma/bin/python

from TileCache import Service, cgiHandler, cfgfiles

if __name__ == '__main__':
    svc = Service.load(*cfgfiles)
    cgiHandler(svc)

