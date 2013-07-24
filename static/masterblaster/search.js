var searchMap, searchMatches

$(document).on('mousedown', 'ul.typeahead', function(e) {
        e.preventDefault();
});

$("form.navbar-search").bind('submit',function(){
    console.log("eating form submit")
    return false;
});

$('#search').typeahead({
    minLength: 3,
    items: 20,
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
        map.setView(searchPt, 17, true);
    },
    matcher: function (item) {
        return true;
    },
    sorter: function (items) {
        return items;
    },
    highlighter: function (item) {
        var regex = new RegExp( '(' + this.query + ')', 'gi' );
        return item.replace( regex, "<strong>$1</strong>" );
        //return item;
    }
    
});
