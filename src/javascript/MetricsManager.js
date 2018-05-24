/* global Ext _ Rally Constants */
Ext.define('MetricsManager', function(MetricsManager) {
    return {
        statics: {
            addMetrics: addMetrics
        }
    }

    function addMetrics(records) {
        _.forEach(records, function(record) {
            var predecessorsRef = record.get('Predecessors');
            var successorsRef = record.get('Successors');
            if (predecessorsRef.Count > 0) {
                record
                    .getCollection('Predecessors')
                    .load()
                    .then(function(predecessors) {
                        record.set('PredecessorCount', predecessors.length);
                        var storyCountColors = {};
                        var planEstimateColors = {};
                        _.forEach(predecessors, function(item) {
                            var color;
                            color = Ext.Object.merge({}, Rally.util.HealthColorCalculator.calculateHealthColorForPortfolioItemData(item.data, 'PercentDoneByStoryCount'));
                            var colorKey = color.label;
                            if (!storyCountColors[color.label]) {
                                color.count = 1;
                                // Must use merge because HealthColorCalculator returns status objects
                                storyCountColors[color.label] = Ext.Object.merge({}, color);
                            }
                            else {
                                storyCountColors[color.label].count += 1;
                            }
                        });
                        splitColors(record, storyCountColors, 'Predecessors', 'StoryCount');
                    });
            }
            else {
                splitColors(record, null, 'Predecessors', 'StoryCount');
            }

            if (successorsRef.Count > 0) {
                record
                    .getCollection('Successors')
                    .load()
                    .then(function(successors) {
                        record.set('SuccessorCount', successors.length);
                        var storyCountColors = {};
                        var planEstimateColors = {};
                        _.forEach(successors, function(item) {
                            var color;
                            color = Rally.util.HealthColorCalculator.calculateHealthColorForPortfolioItemData(item.data, 'PercentDoneByStoryCount');
                            var colorKey = color.label;
                            if (!storyCountColors[colorKey]) {
                                color.count = 1;
                                storyCountColors[colorKey] = Ext.Object.merge({}, color);
                            }
                            else {
                                storyCountColors[colorKey].count += 1;
                            }
                        });
                        splitColors(record, storyCountColors, 'Successors', 'StoryCount');
                    });
            }
            else {
                splitColors(record, null, 'Successors', 'StoryCount');
            }
        });
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
