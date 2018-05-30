/* global Ext MetricsManager Constants Rally _ */
Ext.define("CArABU.app.TSApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    defaults: { margin: 10 },
    defaultSettings: {
        DEPENDENCY_TYPE: Constants.SETTING.STORY
    },
    layout: {
        type: 'vbox',
        align: 'stretch',
    },
    items: [
        { xtype: 'container', itemId: 'controlsArea' },
        { xtype: 'container', itemId: 'filtersArea' },
    ],
    integrationHeaders: {
        name: "CArABU.app.TSApp"
    },

    onTimeboxScopeChange: function(newTimeboxScope) {
        this.callParent(arguments);
        // TODO (tj) Ideally, we would just refresh the grid, but it is not clear to me how
        // to do that with a rallygridboard and preserve the timebox filter AND any existing
        // advanced filters from the filter plugin. Instead, if the page level timebox changes, just
        // relaunch the app.
        this.loadPrimaryStories(this.modelName);
    },

    initLowestPortfolioItemTypeName: function() {
        return Ext.create('Rally.data.wsapi.Store', {
            model: Ext.identityFn('TypeDefinition'),
            fetch: ['Name', 'Ordinal', 'TypePath'],
            sorters: {
                property: 'Ordinal',
                direction: 'ASC'
            },
            filters: [{
                    property: 'Creatable',
                    operator: '=',
                    value: 'true'
                },
                {
                    property: 'Parent.Name',
                    operator: '=',
                    value: 'Portfolio Item'
                }
            ]
        }).load().then({
            scope: this,
            success: function(results) {
                return results[0].get('Name');
            }
        });
    },

    showFeatureDependencies: function() {
        return this.getSetting(Constants.SETTING.DEPENDENCY_TYPE) != Constants.SETTING.STORY;
    },

    getLowestPortfolioItemTypeName: function() {
        return this.lowestPortfolioItemTypeName || 'Feature'
    },

    launch: function() {
        this.initLowestPortfolioItemTypeName().then({
            scope: this,
            success: function(name) {
                this.lowestPortfolioItemTypeName = name;
                this.modelName = 'hierarchicalrequirement';
                if (this.showFeatureDependencies()) {
                    this.modelName = 'portfolioitem/' + this.getLowestPortfolioItemTypeName();
                }
            }
        }).then({
            scope: this,
            success: function() {
                return this.loadModel(this.modelName);
            }
        }).then({
            scope: this,
            success: function(model) {
                this.model = model;
                this.addFilters(this.modelName);
                this.loadPrimaryStories(this.modelName);
            }
        })
    },

    loadPrimaryStories: function(modelName) {
        this.setLoading('Loading...');
        this.artifactFetchFields = this.getFieldNames().concat(Constants.ARTIFACT_FETCH_FIELDS);

        var filters = [];

        var timeboxScope = this.getContext().getTimeboxScope();
        if (timeboxScope) {
            filters.push(timeboxScope.getQueryFilter());
        }

        var advancedFilters = this.getFiltersFromButton();
        if (advancedFilters) {
            filters.push(advancedFilters);
        }

        Ext.create('Rally.data.wsapi.Store', {
            model: modelName,
            autoLoad: true,
            filters: filters,
            limit: Infinity,
            listeners: {
                scope: this,
                load: function(store, records) {
                    MetricsManager.createDependencyStore(records)
                        .then({
                            scope: this,
                            success: function(store) {
                                this.addGrid(store)
                                this.setLoading(false);
                            }
                        })
                }
            },
            fetch: this.artifactFetchFields
        });
    },

    addFilters: function(modelName) {
        var controlsArea = this.down('#controlsArea');
        controlsArea.add({
            xtype: 'rallyinlinefilterbutton',
            modelNames: [modelName],
            context: this.getContext(),
            stateful: true,
            stateId: 'grid-filters-1',
            listeners: {
                inlinefilterready: this.addInlineFilterPanel,
                inlinefilterchange: function() {
                    this.loadPrimaryStories(this.modelName);
                },
                scope: this
            }
        });
        var alwaysSelectedColumns = ['FormattedID', 'Name'];
        if (this.showFeatureDependencies()) {
            alwaysSelectedColumns.push('Release')
        }
        else {
            alwaysSelectedColumns.push('Iteration');
        }
        controlsArea.add({
            xtype: 'tsfieldpickerbutton',
            modelNames: [modelName],
            context: this.getContext(),
            stateful: true,
            stateId: 'creator-grid-columns-1',
            alwaysSelectedValues: alwaysSelectedColumns,
            listeners: {
                fieldsupdated: function(fields) {
                    this.loadPrimaryStories(this.modelName);
                },
                scope: this
            }
        });

    },

    addInlineFilterPanel: function(panel) {
        this.down('#filtersArea').add(panel);
    },

    getFiltersFromButton: function() {
        var filterButton = this.down('rallyinlinefilterbutton');
        if (filterButton && filterButton.inlineFilterPanel && filterButton.getWsapiFilter()) {
            return filterButton.getWsapiFilter();
        }

        return null;
    },

    addGrid: function(store) {
        var grid = this.down('#grid');
        if (grid) {
            this.remove(grid);
        }

        this.add({
            xtype: 'rallygrid',
            itemId: 'grid',
            width: this.getWidth(),
            showRowActionsColumn: false,
            store: store,
            columnCfgs: this.getColumns(),
            listeners: {
                scope: this,
                itemclick: function(grid, record, item, index) {
                    console.log(record);
                }
            }
        })
    },

    getFieldNames: function() {
        try {
            var result = this.down('tsfieldpickerbutton').getFields() || Constants.DEFAULT_COLUMNS;
        }
        catch (ex) {
            result = Constants.DEFAULT_COLUMNS
        }
        return result;
    },

    getColumns: function() {
        return [{
                xtype: 'gridcolumn',
                text: this.showFeatureDependencies() ? this.getLowestPortfolioItemTypeName() : 'Story',
                columns: this.getSubColumns(Constants.ID.STORY)
            },
            {
                xtype: 'gridcolumn',
                text: 'Predecessor',
                columns: this.getSubColumns(Constants.ID.PREDECESSOR)
            },
            {
                xtype: 'gridcolumn',
                text: 'Successor',
                columns: this.getSubColumns(Constants.ID.SUCCESSOR)
            }
        ]
    },
    getSubColumns: function(dataIndex) {
        var selectedFieldNames = this.getFieldNames();
        var columnCfgs = [];
        _.forEach(selectedFieldNames, function(selectedFieldName) {
            var cfg = this.getColumnConfigFromModel(selectedFieldName);
            // Filter out columns that con't apply in case app was changed from story to feature view
            if (cfg) {
                columnCfgs.push(cfg);
            }
        }, this);
        var columns = _.map(columnCfgs, function(columnCfg) {
            var column;
            if (columnCfg.dataIndex === 'Release' || columnCfg.dataIndex === 'Iteration') {
                column = {
                    xtype: 'gridcolumn',
                    text: columnCfg.text,
                    scope: this,
                    renderer: function(value, meta, record) {
                        var result;
                        try {
                            switch (dataIndex) {
                                case Constants.ID.PREDECESSOR:
                                    result = this.predecessorIterationRenderer(record, columnCfg.dataIndex);
                                    break;
                                case Constants.ID.SUCCESSOR:
                                    result = this.successorIterationRenderer(record, columnCfg.dataIndex);
                                    break;
                                default:
                                    result = this.primaryIterationRenderer(record, columnCfg.dataIndex);
                                    break;
                            }
                        }
                        catch (ex) {
                            result = '';
                        }
                        return result;
                    }
                }
            }
            else {
                column = {
                    xtype: 'gridcolumn',
                    text: columnCfg.text,
                    scope: this,
                    renderer: function(value, meta, record) {
                        try {
                            var result = record.get(dataIndex).get(columnCfg.dataIndex) || '';
                            if (Ext.isObject(result)) {
                                result = result.Name || result._refObjectName || '';
                            }
                        }
                        catch (ex) {
                            result = '';
                        }
                        return result;
                    }
                }
            }

            return column;
        }, this);

        return columns;
    },

    loadModel: function(modelName) {
        var deferred = new Deft.promise.Deferred;
        Rally.data.wsapi.ModelFactory.getModel({
            type: modelName,
            context: this.getContext(),
            success: function(model) {
                deferred.resolve(model);
            }
        });
        return deferred.getPromise();
    },

    getColumnConfigFromModel: function(fieldName) {
        var field = this.model.getField(fieldName);
        if (_.isUndefined(field)) {
            return null;
        }
        var builtConfig = Rally.ui.grid.FieldColumnFactory.getColumnConfigFromField(field, this.model);
        return builtConfig;
    },

    getStartDateField: function(timeboxField) {
        return timeboxField === 'Release' ? 'ReleaseStartDate' : 'StartDate';
    },

    primaryIterationRenderer: function(row, timeboxField) {
        var colorClass = Constants.CLASS.OK;
        try {
            var primaryIterationName = row.get(Constants.ID.STORY).get(timeboxField).Name;
        }
        catch (ex) {
            primaryIterationName = Constants.LABEL.UNSCHEDULED;
            colorClass = Constants.CLASS.UNKNOWN;
        }

        return this.colorsRenderer(primaryIterationName, colorClass);
    },

    predecessorIterationRenderer: function(row, timeboxField) {
        var result;
        var startDateField = this.getStartDateField(timeboxField)
        var primaryStory = row.get(Constants.ID.STORY);
        var predecessor = row.get(Constants.ID.PREDECESSOR);

        if (predecessor) {
            var colorClass = Constants.CLASS.OK;
            var primaryIteration = primaryStory.get(timeboxField);
            var predecessorIteration = predecessor.get(timeboxField);

            var predecessorIterationName;

            if (predecessorIteration && primaryIteration) {
                predecessorIterationName = predecessorIteration.Name;
                var primaryStartDate = primaryIteration[startDateField];
                var predecessorStartDate = predecessorIteration[startDateField];

                if (predecessorStartDate < primaryStartDate) {
                    // Predecessor scheduled before primary. OK
                }
                else if (predecessorStartDate == primaryStartDate) {
                    // Predecessor scheduled in same iteration as primary. Warn
                    colorClass = Constants.CLASS.WARNING;
                }
                else {
                    // Predecessor scheduled after primary (or not scheduled). Error
                    colorClass = Constants.CLASS.ERROR;
                }
            }
            else if (!predecessorIteration && primaryIteration) {
                // No predecessor iteration when there is a primary. Highlight as error
                predecessorIterationName = Constants.LABEL.UNSCHEDULED;
                colorClass = Constants.CLASS.ERROR;
            }
            else if (predecessorIteration && !primaryIteration) {
                // Predecessor but no primary, don't highlight the iteration name
                predecessorIterationName = predecessorIteration.Name;
            }
            else if (!predecessorIteration && !primaryIteration) {
                // display nothing
                predecessorIterationName = '';
            }

            result = this.colorsRenderer(predecessorIterationName, colorClass);
        }

        return result;
    },

    successorIterationRenderer: function(row, timeboxField) {
        var result;
        var startDateField = this.getStartDateField(timeboxField);
        var primaryStory = row.get(Constants.ID.STORY);
        var dependency = row.get(Constants.ID.SUCCESSOR);

        if (dependency) {
            var colorClass = Constants.CLASS.OK;
            var primaryIteration = primaryStory.get(timeboxField);
            var dependencyIteration = dependency.get(timeboxField);

            var dependencyIterationName;

            if (dependencyIteration && primaryIteration) {
                dependencyIterationName = dependencyIteration.Name;
                var primaryStartDate = primaryIteration[startDateField];
                var dependencyStartDate = dependencyIteration[startDateField];

                if (dependencyStartDate > primaryStartDate) {
                    // dependency scheduled before primary. OK
                }
                else if (dependencyStartDate == primaryStartDate) {
                    // dependency scheduled in same iteration as primary. Warn
                    colorClass = Constants.CLASS.WARNING;
                }
                else {
                    // dependency scheduled after primary (or not scheduled). Error
                    colorClass = Constants.CLASS.ERROR;
                }
            }
            else if (!dependencyIteration && primaryIteration) {
                // No dependency iteration when there is a primary. Highlight as error
                dependencyIterationName = Constants.LABEL.UNSCHEDULED;
                colorClass = Constants.CLASS.UNKNOWN;
            }
            else if (dependencyIteration && !primaryIteration) {
                // dependency but no primary, don't highlight the iteration name
                dependencyIterationName = dependencyIteration.Name;
            }
            else if (!dependencyIteration && !primaryIteration) {
                // display nothing
                dependencyIterationName = '';
            }

            result = this.colorsRenderer(dependencyIterationName, colorClass);
        }

        return result;
    },

    /**
     * value: String to display
     * cls: Extra class to add to the cell
     */
    colorsRenderer: function(value, cls) {
        return '<div class="status-color ' + cls + '">' + value + '</div>';
    },

    getSettingsFields: function() {
        var store = Ext.create('Rally.data.custom.Store', {
            data: [{
                Name: 'User Story',
                Value: Constants.SETTING.STORY,
            }, {
                Name: this.getLowestPortfolioItemTypeName(),
                Value: this.getLowestPortfolioItemTypeName()
            }]
        });
        return [{
            xtype: 'rallycombobox',
            name: Constants.SETTING.DEPENDENCY_TYPE,
            label: Constants.LABEL.DEPENDENCY_TYPE,
            displayField: 'Name',
            valueField: 'Value',
            store: store
        }];
    }
});
