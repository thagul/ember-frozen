!function() {
    var RESTAdapter = Frzn.UrlMappingAdapter.extend({
        urlMapping: {
            find: {
                url: ':resourceURI/:id',
                dataType: 'json',
                type: 'GET'
            },
            findAll: {
                url: ':resourceURI/',
                dataType: 'json',
                type: 'GET'
            },
            findQuery: {
                url: ':resourceURI/',
                dataType: 'json',
                type: 'GET'
            },
            findIds: {
                url: ':resourceURI/?ids=:ids',
                dataType: 'json',
                type: 'GET'
            },
            createRecord: {
                url: ':resourceURI/',
                dataType: 'json',
                type: 'PUT'
            },
            updateRecord: {
                url: ':resourceURI/:id',
                dataType: 'json',
                type: 'POST'
            },
            deleteRecord: {
                url: ':resourceURI/:id',
                dataType: 'json',
                type: 'DELETE'
            }
        }
    });

    Frzn.RESTAdapter = RESTAdapter;
}();