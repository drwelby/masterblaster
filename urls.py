from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'masterblaster.views.newmap', name='newmap'),
    url(r'^accounts/login/$', 'masterblaster.views.site_login', name='site_login'),
    url(r'^maps/$', 'masterblaster.views.allmaps', name='all'),
    url(r'^map/(.+)/(.+)/$', 'masterblaster.views.name_map', name='map'),
    url(r'^get_feature/$', 'masterblaster.views.get_feature', name='get_feature'),
    url(r'^get_popup/$', 'masterblaster.views.get_feature', name='get_feature'),
    url(r'^toggle/$', 'masterblaster.views.get_feature', name='get_feature'),
    url(r'^select/$', 'masterblaster.views.get_feature', name='get_feature'),
    url(r'^save/$', 'masterblaster.views.save', name='save'),
    url(r'^lasso/$', 'masterblaster.views.lasso', name='lasso'),
    url(r'^buffer/$', 'masterblaster.views.buffer', name='buffer'),
    url(r'^search/$', 'masterblaster.views.search', name='search'),
    url(r'^labels/$', 'masterblaster.views.labels', name='labels'),
    url(r'^data/$', 'masterblaster.views.data', name='data'),
    url(r'^print/$', 'masterblaster.views.print_map', name='print'),
    url(r'^pdf/$', 'masterblaster.views.pdf_map', name='pdf'),

    # url(r'^masterblaster/', include('masterblaster.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
