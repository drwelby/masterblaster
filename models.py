from django.contrib.gis.db import models
from django.contrib.gis.geos import MultiPolygon
from django.contrib.auth.models import User
from datetime import datetime
from django.template.defaultfilters import slugify
from django.forms import ModelForm
from django.forms.models import model_to_dict
import json
import math


class Site(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, related_name='sites')
    bounds = models.MultiPolygonField()
    table = models.CharField(max_length=100)

    objects = models.GeoManager()

    cache = {}

    @property
    def safebounds(self):
        if self.pk in Site.cache:
            return Site.cache[self.pk]
        boundsSPCS = self.bounds
        boundsSPCS.transform(2225)
        buffered = boundsSPCS.buffer(1000)
        buffered.transform(4326)
        Site.cache[self.pk] = buffered
        return buffered

    @property
    def panbounds(self):
        (xmin, ymin, xmax, ymax) = self.bounds.extent
        # these values seem to work to restrict panning
        # while still being able to zoom out to the whole boundary
        xmin -= .04
        xmax += .04
        ymin -= .06
        ymax += .06
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
        return ([[ymin, xmin], [ymax, xmax]])

class Map(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    state = models.TextField(blank=True, null=True)
    slug = models.SlugField()
    edit_date = models.DateTimeField()
    site = models.ForeignKey(Site, related_name='maps')
    #zoom = models.IntegerField()
    #center = models.PointField()

    objects = models.GeoManager()

    def save(self, *args, **kwargs):
        ''' saves the map, updating the edit date '''
        self.edit_date = datetime.now()
        super(Map, self).save(*args, **kwargs)

    def set_name(self, name):
        ''' sets the name and calculates a slug'''

        self.name = name
        self.slug = slugify(self.name)
        return

    @models.permalink
    def get_absolute_url(self):
        return ('masterblaster.views.name_map', [str(self.id), self.slug])

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
