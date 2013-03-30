from django.contrib.gis.db import models
from django.contrib.gis.geos import MultiPolygon
from django.contrib.auth.models import User
from datetime import datetime
from django.template.defaultfilters import slugify
from django.forms import ModelForm
from django.forms.models import model_to_dict
import json
import math

class Lazy(object):
    ''' caches property calculations 
        we use this to calculate the buffered boundary once'''

    def __init__(self, calculate_function):
        self._calculate = calculate_function

    def __get__(self, obj, _=None):
        if obj is None:
            return self
        value = self._calculate(obj)
        setattr(obj, self._calculate.func_name, value)
        return value

class Site(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, related_name='sites')
    bounds = models.MultiPolygonField()
    table = models.CharField(max_length=100)

    objects = models.GeoManager()

    @property
    def srid(self):
        return 2225

    @property
    def center(self):
        pt = self.bounds.centroid
        return pt.coords

    @property
    def maxzoom(self):
        GLOBE_WIDTH = 256
        (west, south, east, north) = self.bounds.extent
        width = east - west;
        if width < 0:
            width += 360;
        height = north - south
        angle = max(height,width)
        return round(math.log(960 * 360 / angle / GLOBE_WIDTH) / math.log(2)) -1


    @Lazy
    def safebounds(self):
        boundsSPCS = self.bounds
        boundsSPCS.transform(2225)
        buffered = boundsSPCS.buffer(500)
        buffered.transform(4326)
        return buffered

    @property
    def panbounds(self):
        (xmin, ymin, xmax, ymax) = self.bounds.extent
        #5000 feet around 42.5 degrees N
        xmin -= .0137
        xmax += .0137
        ymin -= .0185
        ymax += .0185
        width = xmax-xmin
        height = ymax-ymin
        if width < height:
            newwidth = height * 1.5
            bump = newwidth - width
            xmax += bump/2
            xmin -= bump/2
        else:
            newheight = width / 1.5
            bump = newheight - height
            ymax += bump/2
            ymin -= bump/2
        return (xmin, ymin, xmax, ymax)  

class Map(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    state = models.TextField(blank=True, null=True)
    slug = models.SlugField()
    edit_date = models.DateTimeField()
    site = models.ForeignKey(Site, related_name='maps')
    zoom = models.IntegerField()
    center = models.PointField()

    objects = models.GeoManager()

    def save(self, *args, **kwargs):
        ''' saves the map, updating the edit date '''
        self.edit_date = datetime.now()
        super(Map, self).save(*args, **kwargs)

    def set_name(self, name):
        ''' sets the name and calculates a unique slug'''

        self.name = name
        orig_slug = slug = slugify(self.name)
        index = 0
        check = True
        while check:
            try:
                Map.objects.get(slug=slug)
                index += 1
                slug = orig_slug + '-' + str(index)
                print slug
            except Map.DoesNotExist:
                self.slug = slug
                check = False
        self.save()

    @models.permalink
    def get_absolute_url(self):
        return ('masterblaster.views.map_handler', [str(self.id)])

    @property
    def contents(self):

        '''Returns a python object of the features in the map'''
        return json.loads(self.state)['mapstate']

class Parcel(models.Model):
    apn = models.CharField(max_length=12)
    geom = models.MultiPolygonField()
    owner = models.CharField(max_length=255)
    mail1 = models.CharField(max_length=255)
    mail2 = models.CharField(max_length=255)
    situs1 = models.CharField(max_length=255)
    situs2 = models.CharField(max_length=255)
    area = models.FloatField()

    objects = models.GeoManager()

    class Meta:
        # table is set on the fly based on user/site
        db_table = ""
        managed = False

    def to_dict(self):
        ''' converts model object to dict with better values for nulls '''
        d = model_to_dict(self)
        del d['geom']
        for k in d:
            if not d[k]:
                d[k] = "No Data"
        return d

    def to_pygeojson(self):
        ''' returns geojson as python objects '''
        return {'type':'Feature', 'properties':self.to_dict(), 'geometry':json.loads(self.geom.json)}
