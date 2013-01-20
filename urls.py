from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^maps/$', 'slc.views.allmaps', name='all'),
    url(r'^$', 'slc.views.newmap', name='new'),
    url(r'^map/([\w-]+)/$', 'slc.views.map_handler', name='map'),
    url(r'^labels/([\w-]+)/$', 'slc.views.labels', name='labels'),
    # url(r'^masterblaster/', include('masterblaster.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
