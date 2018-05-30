/* global Ext _ Rally Constants */
Ext.define('MetricsManager', function(MetricsManager) {
    return {
        statics: {
            createDependencyStore: createDependencyStore
        }
    }

    function createDependencyStore(records) {
        return _loadDependencies(records)
            .then({
                success: function(results) {
                    // Results is an array of all of the 
                    var store = Ext.create('Rally.data.custom.Store', {
                        data: results
                    });
                    return store;
                }
            });
    }

    /**
     * Returns a promise that resolves to an array of stories that are the
     * dependencies of the given stories. Each primary story has
     * has a __Predecessors and __Successors array set, and each dependency
     * has a __PrimaryStory reference set.
     */
    function _loadDependencies(records) {
        if (!records || records.length == 0) {
            return Deft.promise.Promise.when([]);
        }

        var dependentPromises = _.map(records, function(record) {
            var predecessorsRef = record.get('Predecessors');
            var successorsRef = record.get('Successors');
            var predecessors = [];
            if (predecessorsRef.Count > 0) {
                predecessors = record
                    .getCollection('Predecessors', {
                        limit: Infinity,
                        fetch: Rally.getApp().artifactFetchFields
                    })
                    .load().then(function(results) {
                        return results;
                    });
            }
            var successors = [];
            if (successorsRef.Count > 0) {
                successors = record
                    .getCollection('Successors', {
                        limit: Infinity,
                        fetch: Rally.getApp().artifactFetchFields
                    })
                    .load()
            }

            return Deft.promise.Promise.all([predecessors, successors])
                .then({
                    scope: this,
                    success: function(results) {
                        var rows = _.zip([record], results[0], results[1]);
                        return _.map(rows, function(row) {
                            var result = {};
                            result[Constants.ID.STORY] = record;
                            result[Constants.ID.PREDECESSOR] = row[1];
                            result[Constants.ID.SUCCESSOR] = row[2];
                            return result;
                        });
                    }
                })
        });

        // TODO (tj) sorting by primary story?
        return Deft.promise.Promise.all(dependentPromises).then({
            success: function(results) {
                return _.flatten(results);
            }
        })
    }
});
