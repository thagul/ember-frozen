!function() {
    var AbstractAdapter = Ember.Object.extend({
        extractMeta: null,

        discardOnFail: true,

        extractData: function(data, record) {
            return record.constructor.rootProperty ? data[record.constructor.rootProperty] : data;
        },

        /**
         * After load hook
         * @param data
         * @param record
         * @private
         */
        _didLoad: function(data, record) {
            var json = this.extractData(data, record);
            record.load(json);
            record.set('isLoaded', true);
            record.trigger('didLoad', record);
            record.resolve(record);
        },

        /**
         * After load hook
         * @param data
         * @param record
         * @private
         */
        _didLoadMany: function(data, records) {
            var objs = records.type.rootCollectionProperty ? data[records.type.rootCollectionProperty] : data;
            records.load(objs);
            if(this.extractMeta && typeof this.extractMeta === 'function') {
                this.extractMeta(data, records);
            }
            records.forEach(function(record) {
                record.resolve(record);
            });
            records.resolve(records);
        },

        /**
         * After create hook
         * @param data
         * @param record
         * @private
         */
        _didCreate: function(data, record) {
            var json = this.extractData(data, record);
            record.load(json);
            record.set('isSaved', true);
            record.set('isLoaded', true);
            record.trigger('didSave', record);
            record.resolve(record);
        },

        /**
         * After update hook
         * @param data
         * @param record
         * @private
         */
        _didUpdate: function(data, record) {
            var json = this.extractData(data, record);
            record.load(json);
            record.set('isSaved', true);
            record.set('isLoaded', true);
            record.trigger('didSave', record);
            record.resolve(record);
        },

        /**
         * After delete hook
         * @param data
         * @param record
         * @private
         */
        _didDelete: function(data, record) {
            var json = this.extractData(data, record);
            record.load(json);
            record.set('isDeleted', true);
            record.trigger('didDelete', record);
            record.resolve(record);
        },

        /**
         * After update fail hook
         * @param data
         * @param record
         * @private
         */
        _didFailUpdate: function(record) {
            if(this.discardOnFail) {
                record.discard();
            }
        },

        /**
         * Find an instance of the record given a specified id
         * @param modelClass {object} - the class type of the record
         * @param record {Frzn.Model} - an instance of the record that will be used to fulfill the request
         * @param id {object} - the id of the object to find
         * @return {object} - a model instance, that is promise too
         */
        find: function(modelClass, record, id) {
            Ember.assert("You must provide a valid find function for your adapter", false);
        },

        /**
         * Find all objects of a given type
         * @param modelClass {object} - the class type of the record
         * @param records {Frzn.RecordArray} - the provided record array that will be used to fulfill the request
         * @return {object} - a model instance, that is promise too
         */
        findAll: function(modelClass, records) {
            Ember.assert("You must provide a valid findAll function for your adapter", false);
        },

        findQuery: function() {
            Ember.assert("You must provide a valid findQuery function for your adapter", false);
        },

        findIds: function() {
            Ember.assert("You must provide a valid findIds function for your adapter", false);
        },

        createRecord: function() {
            Ember.assert("You must provide a valid createRecord function for your adapter", false);
        },

        updateRecord: function() {
            Ember.assert("You must provide a valid updateRecord function for your adapter", false);
        },

        reloadRecord: function() {
            Ember.assert("You must provide a valid reloadRecord function for your adapter", false);
        },

        deleteRecord: function() {
            Ember.assert("You must provide a valid delete function for your adapter", false);
        }
    });

    var RecordArray = Ember.ArrayProxy.extend(Ember.DeferredMixin, {
        init: function() {
            this._super();
            this.set('meta', Em.Object.create({}));
            Ember.assert("You must specify a type for a record array", this.type != undefined);
        },

        load: function(data) {
            this.set('content', Em.A([]));
            if(data instanceof Array) {
                for(var i = 0; i < data.length; i++) {
                    var o = this.type.create(data[i]);
                    o.set('isLoaded', true);
                    this.pushObject(o);
                }
            }
            return this;
        },

        resetPromise: function() {
            this.set('_deferred', Ember.RSVP.defer());
            return this;
        }
    });

    var InMemoryAdapter = AbstractAdapter.extend({
        store: null,

        initCollection: function(name) {
            if(!this.store[name]) {
                this.store[name] = Em.A();
            }
            return this;
        },

        find: function(modelClass, record, id) {
            var name = modelClass.getName();
            this.initCollection(name);
            var data = this.store[name].findBy(modelClass.idProperty, id);
            if(data) {
                this._didLoad(data, record);
            } else {
                record.reject({
                    errorCode: 404,
                    type: 'error',
                    message: 'Object not found'
                });
            }
            return record;
        },

        findAll: function(modelClass, records) {
            var name = modelClass.getName();
            this.initCollection(name);
            if(this.store[name]) {
                var data = this.store[name];
                this._didLoadMany(data, records);
            } else {
                records.reject({
                    errorCode: 404,
                    type: 'error',
                    message: 'Object not found'
                });
            }
            return records;
        },

        findQuery: function(modelClass, records, params) {
            var name = modelClass.getName();
            this.initCollection(name);
            if(this.store[name]) {
                var data = this.store[name];
                for(var prop in params) {
                    data = data.filterBy(prop, params[prop]);
                }
                this._didLoadMany(data, records);
            } else {
                records.reject({
                    errorCode: 404,
                    type: 'error',
                    message: 'Object not found'
                });
            }
            return records;
        },

        findIds: function(modelClass, records, ids) {
            var name = modelClass.getName();
            this.initCollection(name);
            if(this.store[name]) {
                var data = Em.A([]);
                for(var index = 0; index < ids.length; index++) {
                    var rec = this.store[name].findBy('id', ids[index]);
                    data.push(rec);
                }
                this._didLoadMany(data, records);
            } else {
                records.reject({
                    errorCode: 404,
                    type: 'error',
                    message: 'Object not found'
                });
            }
            return records;
        },

        createRecord: function(modelClass, record) {
            var name = modelClass.getName();
            this.initCollection(name);
            if(this.store[name]) {
                record.set('id', this.store[name].length);
                this.store[name].push(record);
                this._didCreate(record.toJSON(), record);
            }
            return record;
        },

        reloadRecord: function(modelClass, record) {

        },

        updateRecord: function(modelClass, record) {
            Ember.assert("You must provide a valid updateRecord function for your adapter", false);
        },

        deleteRecord: function(modelClass, record) {
            Ember.assert("You must provide a valid delete function for your adapter", false);
        }
    });

    InMemoryAdapter.reopenClass({
        createWithData: function(data) {
            return InMemoryAdapter.create({
                store: data
            });
        }
    })

    Frzn.AbstractAdapter = AbstractAdapter;
    Frzn.RecordArray = RecordArray;
    Frzn.InMemoryAdapter = InMemoryAdapter;
}();