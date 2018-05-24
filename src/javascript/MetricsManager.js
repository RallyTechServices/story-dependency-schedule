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
        var storeData = [];
        var dependentPromises = _.map(records, function(record) {
            var predecessorsRef = record.get('Predecessors');
            var successorsRef = record.get('Successors');
            var predecessors = [];
            if (predecessorsRef.Count > 0) {
                predecessors = record
                    .getCollection('Predecessors')
                    .load()
                    .then(function(predecessors) {
                        record.set('__Predecessors', predecessors);
                        _.forEach(predecessors, function(item) {
                            item.set('__PrimaryStory', record);
                            storeData.push(item);
                        });
                    });
            }
            var successors = [];
            if (successorsRef.Count > 0) {
                successors = record
                    .getCollection('Successors')
                    .load()
                    .then(function(successors) {
                        record.set('__Successors', predecessors);
                        _.forEach(successors, function(item) {
                            item.set('__PrimaryStory', record);
                            storeData.push(item);
                        });
                    });
            }
            return Deft.promise.Promise
                .all([predecessors, successors])
                .then({
                    success: function(dependencies) {
                        return storeData;
                    }
                })
        });
        return Deft.promise.Promise.all(dependentPromises);
    }

    function splitColors(record, colors, relation, metric) {
        if (colors) {
            var sortedColors = [];
            _.forEach(Constants.STATUS_LABEL_ORDER, function(statusLabel) {
                sortedColors.push(colors[statusLabel.label] ? colors[statusLabel.label] : statusLabel);
            });
            record.set(relation + metric + 'Colors', sortedColors);
            record.set(relation + metric + 'ColorSortKey', _.pluck(sortedColors, 'count').join('+'));
        }
        else {
            record.set(relation + metric + 'Colors', []);
            record.set(relation + metric + 'ColorSortKey', '');
        }
    }
});
