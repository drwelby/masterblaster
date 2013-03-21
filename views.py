import json
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, HttpResponseNotModified, HttpResponseServerError
from django.shortcuts import render_to_response, redirect
from django.contrib.gis.geos import Point, MultiPolygon, GEOSGeometry
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.decorators.gzip import gzip_page
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.forms.models import model_to_dict
from django.contrib.auth import authenticate, login
from django.template.defaultfilters import slugify
from masterblaster.utils import xls_response, pdf_response, csv_response, pdf_table
from masterblaster.models import Map, Parcel, Site
from masterblaster.simplesearch import simplesearch

''' json responses:

    to buffer endpoint:
    {   action: 'buffer',
        dist: (buffer distance), 
        mapstate: (mapstate object)
        }
        
        returns mapstate

    to lasso endpoint:
    {   action: 'lasso',
        lasso: (polygon json of lasso), 
        mapstate: (mapstate object)
        }

        returns mapstate

    to save endpoint:
    {   action: 'save',
        lasso: (polygon json of lasso), 
        mapstate: (mapstate object)
        }

    mapstate object:
    {
        name: (name),
        center: (x,y)
        zoom: (int)
        selected: (dict of parcel selected keyed by APN)
        selection: (dict of parcels to buffer keyed by APN)
        buffer: (buffer multipolygon) 
        }
'''
def site_login(request, error = None):
    if request.POST:
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                return redirect('newmap')
            else:
                return render_to_response('login.html', {'error':'inactive'}, context_instance=RequestContext(request))
        else:
            return render_to_response('login.html', {'error':'invalid'}, context_instance=RequestContext(request))
    else:
        return render_to_response('login.html', {'error':error}, context_instance=RequestContext(request))
        

@login_required
def allmaps(request):
    ''' returns all maps belonging to a user '''
    # TODO paginate?
    maps = request.user.sites.all()[0].maps.all()[20]
    return render_to_response('all.html', {'maps':maps})

@login_required
def newmap(request):
    ''' requests for unsaved/new maps '''
    site = request.user.sites.all()[0]
    bmap = Map()
    bmap.name = 'GeoNotice'
    bmap.state = '{center:%s,zoom:%s,selected:{},selection:{},buffer:{}}' % ( list(site.center), int(site.maxzoom + 1))
    return render_to_response('map.html', {'bmap':bmap})

@login_required
def get_feature(request):
    ''' Given a lat and lon returns the containing parcel as json'''
    data = json.loads(request.body)['data']
    site = request.user.sites.all()[0] 
    lat = data['lat']
    lon = data['lon']
    # should lat/lon return centroid of parcel?
    action = data['action']
    pt = Point(lon,lat)
    if not site.bounds.prepared.contains(pt):
        return HttpResponse(json.dumps({action:{'lat':lat, 'lon':lon}}), mimetype="application/json")
    Parcel._meta.db_table = site.table
    parcel = Parcel.objects.filter(geom__contains=pt)[0]
    if parcel and parcel.owner:
        data = {action: {'lat':lat, 'lon':lon, 'feature': parcel.to_pygeojson() }}
    else:
        data = {action:{'lat':lat, 'lon':lon}}
    return HttpResponse(json.dumps(data), mimetype="application/json")

@login_required
def name_map(request, id_or_slug):
    ''' returns a named map
        template will pull mapstate from map object
    '''
    #should urls include site name to avoid slug duplication?
    bmap = get_map(id_or_slug)
    site = request.user.sites.all()[0]
    if bmap and bmap.site == site:
        return render_to_response('map.html', {'bmap':bmap})
    else:
        return render_to_response('missing.html', {'request':request})

@login_required
def print_map(request):
    mapstate = json.loads(request.body)['data']['mapstate']
    bmap = Map()
    bmap.name = mapstate.get('name', 'GeoNotice')
    bmap.state = json.dumps(mapstate)
    return render_to_response('print.html', {'bmap':bmap})

def get_map(id_or_slug):
    try:
        try:
            int_id = int(id_or_slug)
            bmap = Map.objects.get(id=int_id)
        except ValueError:
            bmap = Map.objects.get(slug=id_or_slug)
        return bmap
    except ObjectDoesNotExist:
        return None

@login_required
def labels(request):
    data = json.loads(request.body)['data']
    mapstate = data['mapstate']
    parcels = mapstate['selected']
    kwargs = {}
    if "apn" in data:
        if data['apn'] == '1':
            kwargs['apn'] = True
    if "address" in data:
        kwargs['address'] = data['address']
    if "type" in request.POST:
        kwargs['type'] = data['type']
    if "unique" in request.POST:
        if data['unique'] == '1':
            kwargs['unique'] = True
    return pdf_response(parcels, slugify(mapstate['name']), **kwargs)

@login_required
def data(request):
    mapstate = json.loads(request.body)['data']['mapstate']
    parcels = mapstate['selected']
    slug = slugify(mapstate['name'])
    if data['filetype'] == 'pdf':
        return pdf_table(parcels, slug )
    elif data['filetype'] == 'xls':
        return xls_response(parcels, slug)
    elif data['filetype'] == 'csv':
        return csv_response(parcels, slug)

@login_required
def save(request):

    '''given a mapstate, saves a map'''

    mapstate = json.loads(request.body)['data']['mapstate']
    name = mapstate['name']
    try:
        bmap = Map.objects.get(name=name)
    except ObjectDoesNotExist:
        bmap = Map()
        bmap.set_name(name)
    bmap.state = request.POST['data']['mapstate']
    bmap.site = request.user.sites.all()[0]
    bmap.zoom = mapstate['zoom']
    bmap.center = Point(mapstate['center'])
    bmap.save()
    # return value? 304 it?
    return HttpResponse(json.dumps(mapstate), mimetype="application/json")

@login_required
@gzip_page
def lasso(request):

    '''Toggles selected parcels with a polygon boundary'''

    data = json.loads(request.body)['data']
    mapstate = data['mapstate']
    site = request.user.sites.all()[0] 
    bounds = site.bounds.prepared
    Parcel._meta.db_table = site.table
    newparcels = Parcel.objects.filter(geom__intersects=GEOSGeometry(data['lasso']))
    print "lasso-ed %s parcels" % (len(newparcels))
    for parcel in newparcels:
        if not bounds.covers(parcel.geom):
            continue
        if parcel.apn in mapstate['selected']:
            del mapstate['selected'][parcel.apn]
            print 'toggling %s' % (parcel.apn)
        else:
            mapstate['selected'][parcel.apn] = parcel.to_pygeojson()
            print 'adding %s' % (parcel.apn)
    return HttpResponse(json.dumps({'mapstate':mapstate}), mimetype="application/json")

@login_required
@gzip_page
def buffer(request):

    '''Given a mapstate, runs a buffer and returns a new mapstate'''

    site = request.user.sites.all()[0] 
    Parcel._meta.db_table = site.table
    data = json.loads(request.body)['data']
    dist = float(data['dist'])
    mapstate = data['mapstate']
    # get the old buffer, unselect old parcels, and delete old buffer
    if mapstate['buffer']:
        oldbuffer = GEOSGeometry(json.dumps(mapstate['buffer']['geometry']))
        # deselect all the old buffered parcels
        oldselected = mapstate['selected']
        duplicates = []
        for apn in oldselected:
            oldparcel = GEOSGeometry(json.dumps(oldselected[apn]['geometry']))
            if oldbuffer.prepared.intersects(oldparcel):
                duplicates.append(apn)
        for apn in duplicates:
            del mapstate['selected'][apn]
        mapstate['buffer'] = {}
    # build new buffer and select new parcels
    if mapstate['selection']:
        selections = [GEOSGeometry(json.dumps(mapstate['selection'][apn]['geometry'])) for apn in mapstate['selection']]
        inputs = selections[0]
        for selection in selections[1:]:
            inputs = inputs.union(selection)
        inputs.srid = 4326
        inputs.transform(2225)
        buffered = inputs.buffer(dist)
        buffered.transform(4326)
        mapstate['buffer'] = {'type':'Feature', 'geometry':json.loads(buffered.json)}
        # select new parcels
        newparcels = Parcel.objects.filter(geom__intersects=buffered)
        newparcels.filter(geom__intersects=site.bounds)
        for parcel in newparcels:
            if not parcel.owner:
                continue
            if parcel.apn in mapstate['selected']:
                continue
            else:
                mapstate['selected'][parcel.apn] = parcel.to_pygeojson()
    # return json
    return HttpResponse(json.dumps({'mapstate':mapstate}), mimetype="application/json")

# @gzip_page
def search(request):
    site = request.user.sites.all()[0] 
    q = ""
    limit = 10
    if request.GET:
        q = request.GET['q']
        if 'limit' in request.GET:
            limit = int(request.GET['limit'])
            print request.GET['limit']
    if request.POST:
        q = request.POST['q']
        if 'limit' in request.POST:
            limit = int(request.POST['limit'])
    if len(q) < 3:
        return HttpResponse(json.dumps({'results':{}}), mimetype="application/json")
    results = simplesearch(q, site, limit)
    data = {}
    for result in results:
        poly = GEOSGeometry(result['geom'].json)
        center = poly.centroid.coords
        del result['geom']
        for key in result:
            if result[key]:
                if q.lower() in result[key].lower():
                    match = result[key]
        data[match] = center
    return HttpResponse(json.dumps({'results':data}), mimetype="application/json")
        