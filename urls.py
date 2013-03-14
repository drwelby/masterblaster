from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'masterblaster.views.newmap', name='new'),
    url(r'^login/$', 'masterblaster.views.login', name='login'),
    url(r'^maps/$', 'masterblaster.views.allmaps', name='all'),
    url(r'^map/(.+)/$', 'slc.views.name_map', name='map'),
    url(r'^get_feature/$', 'slc.views.get_feature', name='get_feature'),
    url(r'^save/$', 'masterblaster.views.save', name='save'),
    url(r'^lasso/$', 'masterblaster.views.lasso', name='lasso'),
    url(r'^labels/$', 'masterblaster.views.labels', name='labels'),
    url(r'^data/$', 'masterblaster.views.data', name='data'),
    url(r'^print/$', 'masterblaster.views.print_map', name='print'),
    # url(r'^masterblaster/', include('masterblaster.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
