/* global Ext MetricsManager Constants Rally _ */
Ext.define("CArABU.app.TSApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            DEPENDENCY_TYPE: Constants.SETTING.STORY
        },
    },
    layout: {
        type: 'vbox',
        align: 'stretch',
    },
    items: [{
            xtype: 'container',
            layout: {
                type: 'hbox',
            },
            items: [
                { xtype: 'container', itemId: 'controlsArea' },
                { xtype: 'container', flex: 1 },
                { xtype: 'container', itemId: 'settingsArea' },
            ]
        },
        { xtype: 'container', itemId: 'filtersArea' },
    ],
    integrationHeaders: {
        name: "CArABU.app.TSApp"
    },
    showItemsWithoutDependencies: false,

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

    getViewType: function() {
        return this.getSetting(Constants.SETTING.DEPENDENCY_TYPE);
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
                this.addSettingsControls();
                // Initial load of stories triggered by change handler on the filter button
                //this.loadPrimaryStories(this.modelName);
            }
        })
    },

    loadPrimaryStories: function(modelName) {
        var grid = this.down('#grid');
        if (grid) {
            grid.setLoading('Loading...');
        }
        else {
            this.setLoading('Loading...');
        }
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

        // Add column picker first so we know what fields to fetch during artifact load
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
            stateId: this.getViewType() + 'fields', // columns specific to type of object
            alwaysSelectedValues: alwaysSelectedColumns,
            listeners: {
                fieldsupdated: function(fields) {
                    this.loadPrimaryStories(this.modelName);
                },
                scope: this
            }
        });

        // Add in-line filters
        controlsArea.add({
            xtype: 'rallyinlinefilterbutton',
            modelNames: [modelName],
            context: this.getContext(),
            stateful: true,
            stateId: this.getViewType() + 'filters', // filters specific to type of object
            listeners: {
                inlinefilterready: this.addInlineFilterPanel,
                inlinefilterchange: function(cmp) {
                    // This component fires change before it is fully added. Capture the
                    // reference to the filter button in the change handler so it can be used
                    // by loadPrimaryStories. Attempts to get to
                    // the button by using this.down('rallyinlinefilterbutton') will return null
                    // at this point.
                    this.filterButton = cmp;
                    this.loadPrimaryStories(this.modelName);
                },
                scope: this
            }
        });

    },

    addSettingsControls: function() {
        var settingsArea = this.down('#settingsArea');
        settingsArea.add({
            xtype: 'rallycheckboxfield',
            fieldLabel: Constants.LABEL.SHOW_ALL,
            labelWidth: 200,
            name: 'showItemsWithoutDependencies',
            value: this.showItemsWithoutDependencies,
            listeners: {
                scope: this,
                change: function(checkbox, newValue) {
                    this.showItemsWithoutDependencies = newValue;
                    this.loadPrimaryStories(this.modelName);
                }
            }
        });
    },

    addInlineFilterPanel: function(panel) {
        this.down('#filtersArea').add(panel);
    },

    getFiltersFromButton: function() {
        var filters = null;
        try {
            filters = this.filterButton.getWsapiFilter()
        }
        catch (ex) {
            // Ignore if filter button not yet available
        }

        return filters;
    },

    addGrid: function(store) {
        var grid = this.down('#grid');
        if (grid) {
            this.remove(grid);
        }

        this.add({
            xtype: 'rallygrid',
            itemId: 'grid',
            flex: 1,
            //width: this.getWidth(),
            showRowActionsColumn: false,
            enableColumnHide: false,
            sortableColumns: false,
            enableEditing: false,
            rowLines: false,
            store: store,
            columnCfgs: this.getColumns(),
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
                text: this.showFeatureDependencies() ? this.getLowestPortfolioItemTypeName() : Constants.LABEL.STORY,
                __subDataIndex: Constants.ID.STORY, // See Overrides.js
                columns: this.getSubColumns(Constants.ID.STORY)
            },
            {
                xtype: 'gridcolumn',
                tdCls: 'group-separator',
                width: 4,
            },
            {
                xtype: 'gridcolumn',
                text: Constants.LABEL.PREDECESSOR,
                __subDataIndex: Constants.ID.PREDECESSOR, // See Overrides.js
                columns: this.getSubColumns(Constants.ID.PREDECESSOR)
            },
            {
                xtype: 'gridcolumn',
                tdCls: 'group-separator',
                width: 4,
            },
            {
                xtype: 'gridcolumn',
                text: Constants.LABEL.SUCCESSOR,
                __subDataIndex: Constants.ID.SUCCESSOR, // See Overrides.js
                columns: this.getSubColumns(Constants.ID.SUCCESSOR)
            }
        ]
    },

    getSubColumns: function(subDataIndex) {
        var selectedFieldNames = this.getFieldNames();
        var columns = _.map(selectedFieldNames, function(selectedFieldName) {
            var column;
            var columnCfg = this.getColumnConfigFromModel(selectedFieldName);
            switch (columnCfg.dataIndex) {
                case this.getLowestPortfolioItemTypeName():
                    column = {
                        xtype: 'gridcolumn',
                        text: columnCfg.modelField.displayName,
                        scope: this,
                        renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
                            return Renderers.featureRenderer(metaData, record, rowIndex, store, subDataIndex, columnCfg);
                        }
                    }
                    break;
                case 'Release':
                case 'Iteration':
                    // Color code Release and Iteration values
                    column = {
                        xtype: 'gridcolumn',
                        text: columnCfg.text,
                        scope: this,
                        renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
                            var result;
                            try {
                                switch (subDataIndex) {
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
                            // Determine the row color so that row colors alternate anytime the primary
                            // artifact changes.
                            Renderers.alternateRowModifier(metaData, record, rowIndex, store, subDataIndex);
                            return result;
                        }
                    }
                    break;
                default:
                    // All other columns use the default rendering (see Overrides.js for getting to the sub-data)
                    column = columnCfg;
            }
            column.height = 30; // Needed when a column is picked that has a two row title
            column.__subDataIndex = subDataIndex;
            column.isCellEditable = false;
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
