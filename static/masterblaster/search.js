var searchMap, searchMatches

$(document).on('mousedown', 'ul.typeahead', function(e) {
        e.preventDefault();
});

$('#search').typeahead({
    source: function (query, process) {
        return $.ajax({
            url: $(this)[0].$element[0].dataset.link,
            type: 'get',
            data: {q: query},
            dataType: 'json',
            success: function(json) {
                searchMap = {}
                searchMatches = []
                for (key in json.results) {
                    searchMatches.push(key);
                }
                if (searchMatches.length > 0) {
                    searchMap = json.results;
                    process(searchMatches);
                }
            }
            }); 
    },
    updater: function (item) {
        coords = searchMap[item];
        searchPt = new L.LatLng(coords[1],coords[0]);
        map.fireEvent('contextmenu', {latlng: searchPt});
        map.panTo(searchPt);
    },
    matcher: function (item) {
        return true;
    },
    sorter: function (items) {
        return items;
    },
    highlighter: function (item) {
        return item;
    }
    
});
