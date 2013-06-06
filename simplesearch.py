from masterblaster.models import Parcel
from django.db.models import Q

def exactsearch(term, site, limit=0):
    Parcel._meta.db_table = site.table
    # spatial match
    q = Parcel.objects.filter( Q(geom__contained=site.safebounds),
    # beginning of APN matches
    Q(apn__istartswith=term) |
    # or match in situs address
    Q(situs1__icontains=term) |
    # or match in the owner name
    Q(owner__icontains=term) )
    if limit > 0:
        q = q[:limit]
    return q.values('apn','situs1','situs2','owner','geom')

def keywordsearch(term, site, limit=0):
    Parcel._meta.db_table = site.table
    # spatial match
    parcels = Parcel.objects.filter(geom__intersects=site.safebounds)

    keywords = term.split(' ')

    q = Q(apn__istartswith=keywords[0]) |  \
        Q(situs1__icontains=keywords[0]) | \
        Q(owner__icontains=keywords[0]) 

    for keyword in keywords[1:]:
        if keyword == '': continue
        q.add( (Q(apn__istartswith=keyword) | \
            Q(situs1__icontains=keyword) | \
            Q(owner__icontains=keyword) ), Q.AND)

    parcels = parcels.filter(q)

    if limit > 0:
        parcels = parcels[:limit]
    return parcels.values('apn','situs1','situs2','owner','geom')
