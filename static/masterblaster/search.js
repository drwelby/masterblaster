var searchMap, searchMatches

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

                for (key in data.results) {
                    matches.push(key);
                });
                return typeof json.options == 'undefined' ? false : process(json.options);
                                                           }
        });
 
    process(matches);
    },
    updater: function (item) {
        // implementation
    },
    matcher: function (item) {
        // implementation
    },
    sorter: function (items) {
        // implementation
    },
    highlighter: function (item) {
       // implementation
    },
});
