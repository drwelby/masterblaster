from masterblaster.models import Parcel
from django.db.models import Q

def simplesearch(term, site, limit=0):
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

