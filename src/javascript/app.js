/* global Ext MetricsManager Constants Rally _ */
Ext.define("CArABU.app.TSApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    defaults: { margin: 10 },
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    items: [{
        xtype: 'container',
        layout: 'hbox',
        items: [{
            xtype: 'container',
            flex: 1
        }]
    }],
    integrationHeaders: {
        name: "CArABU.app.TSApp"
    },
    piTypePath: undefined,

    onTimeboxScopeChange: function(newTimeboxScope) {
        this.callParent(arguments);
        // TODO (tj) Ideally, we would just refresh the grid, but it is not clear to me how
        // to do that with a rallygridboard and preserve the timebox filter AND any existing
        // advanced filters from the filter plugin. Instead, if the page level timebox changes, just
        // relaunch the app.
        this.launch();
    },

    launch: function() {
        this.loadPrimaryStories();
    },

    loadPrimaryStories: function() {
        var modelNames = ['hierarchicalrequirement'];
        var pageFilters = [];
        var timeboxScope = this.getContext().getTimeboxScope();
        if (timeboxScope) {
            pageFilters.push(timeboxScope.getQueryFilter());
        }
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: modelNames,
            autoLoad: true,
            enableHierarchy: false,
            filters: pageFilters,
            listeners: {
                scope: this,
                load: function(store, node, records) {
                    this.loadStoryDependencies(records)
                }
            },
            fetch: Constants.STORY_FETCH_FIELDS
        }).then({
            scope: this,
            success: function(store) {
                store.load();
            }
        })
    },

    loadStoryDependencies: function(stories) {
        MetricsManager.createDependencyStore(stories)
            .then({
                scope: this,
                success: function(store) {
                    this.addGrid(store)
                }
            })
    },

    addGrid: function(store) {
        var grid = this.down('rallygrid');
        if (grid) {
            this.remove(grid);
        }

        this.add({
            xtype: 'rallygrid',
            store: store,
            columns: this.getColumns()
        })
    },

    /*
        addGrid: function(store) {
            var gridboard = this.down('rallygridboard');
            if (gridboard) {
                this.remove(gridboard);
            }

            var modelNames = ['hierarchicalrequirement'];
            var context = this.getContext();

            var pageFilters = [];
            var timeboxScope = this.getContext().getTimeboxScope();
            if (timeboxScope) {
                pageFilters.push(timeboxScope.getQueryFilter());
            }

            Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
                models: modelNames,
                autoLoad: false,
                enableHierarchy: false,
                filters: pageFilters,
                listeners: {
                    scope: this,
                    load: function(store, node, records) {
                        MetricsManager.addMetrics(records);
                    }
                },
                fetch: Constants.PORTFOLIO_ITEM_FETCH_FIELDS
            }).then({
                success: function(store) {
                    var me = this;
                    this.add({
                        xtype: 'rallygridboard',
                        context: this.getContext(),
                        modelNames: modelNames,
                        toggleState: 'grid',
                        plugins: [{
                                ptype: 'rallygridboardinlinefiltercontrol',
                                inlineFilterButtonConfig: {
                                    stateful: false,
                                    stateId: context.getScopedStateId('feature-filters'),
                                    modelNames: modelNames,
                                    inlineFilterPanelConfig: {
                                        quickFilterPanelConfig: {
                                            // TODO (tj) tags
                                            defaultFields: [
                                                'ArtifactSearch',
                                                'Owner',
                                                'ScheduleState'
                                            ]
                                        }
                                    }
                                }
                            },
                            {
                                ptype: 'rallygridboardfieldpicker',
                                headerPosition: 'left',
                                modelNames: modelNames,
                                stateful: true,
                                stateId: context.getScopedStateId('feature-columns')
                            },
                            {
                                ptype: 'tslegendgridboardplugin',
                                headerPosition: 'right',
                                showInGridMode: true
                            }
                        ],
                        gridConfig: {
                            store: store,
                            storeConfig: {
                                // page-level filters must be set in the store config to allow them to merge with
                                // any changes made in the `rallygridboardinlinefiltercontrol`
                                filters: pageFilters
                            },
                            enabledEditing: true,
                            shouldShowRowActionsColumn: true,
                            enableRanking: false,
                            enableBulkEdit: false,
                            alwaysShowDefaultColumns: false, // Otherwise you get 2 copies of the `derived` columns
                            stateful: false,
                            stateId: context.getScopedStateId('grid-state'),
                            listeners: {
                                scope: this,
                                cellclick: function(grid, td, cellIndex, record, tr, rowIndex, event) {
                                    // If this is a status color cell, show the dependencies popover
                                    // TODO (tj) not a big fan of using CSS classes to determine column, but didn't
                                    // see another way to get column from cellclick event?
                                    if (Ext.query('.' + Constants.CLASS.STATUS_COLORS, td).length > 0) {
                                        // TODO (tj) Any per row data?
                                    }
                                }
                            },
                            columnCfgs: this.getColumns(),
                            derivedColumns: this.getDerivedColumns()
                        },
                        height: this.getHeight()
                    });
                },
                scope: this
            });
        },
        */

    getColumns: function() {
        // TODO (tj) are derived columns needed in getColumns...or perhaps override can detect
        // a derived column in the normal column list
        return [

        ].concat(this.getDerivedColumns());
    },
    getDerivedColumns: function() {
        // TODO (tj) predecessor and successor columns
        /*
        return [{
            dataIndex: 'PredecessorsStoryCountColorSortKey',
            text: 'Predecessors By Story Count',
            //width: 100,
            //tpl: '<span><tpl for="PredecessorsStoryCountColors"><span class="{[ values.label.toLowerCase().replace(" ","-") ]}">{count}</span></tpl></span>',
            scope: this,
            renderer: function(value, meta, record, row, col, store) {
                return this.colorsRenderer(record.get('PredecessorsStoryCountColors'), Constants.CLASS.PERCENT_DONE_BY_STORY_COUNT);
            },
            sortable: true,
            tdCls: Constants.CLASS.PREDECESSORS + ' ' + Constants.CLASS.PERCENT_DONE_BY_STORY_COUNT
        }];
        */
        return [{
                xtype: 'gridcolumn',
                text: 'User Stories',
                columns: this.getSubColumns()
            },
            {
                xtype: 'gridcolumn',
                text: 'Predecessors',
                columns: this.getSubColumns()
            },
            {
                xtype: 'gridcolumn',
                text: 'Successors',
                columns: this.getSubColumns()
            }
        ]
    },
    getSubColumns: function() {
        return [{
                xtype: 'gridcolumn',
                dataIndex: 'FormattedID',
                text: 'ID'
            },
            {
                xtype: 'gridcolumn',
                dataIndex: 'Name',
                text: 'Name'
            },
            {
                xtype: 'gridcolumn',
                dataIndex: 'Project',
                text: 'Project'
            },
            {
                xtype: 'gridcolumn',
                dataIndex: 'Iteration',
                text: 'Iteration'
            },
            {
                xtype: 'gridcolumn',
                dataIndex: 'Epic',
                text: 'Epic'
            }
        ]
    },

    /**
     * sortedColors: Array of counts
     * cls: Extra class to add to the cell
     */
    colorsRenderer: function(sortedColors, cls) {
        var result;
        if (_.isUndefined(sortedColors)) {
            result = 'Loading...';
        }
        else {
            var colors = _.map(sortedColors, function(color) {
                var colorClass = color.label.toLowerCase().replace(" ", "-");
                var hiddenClass = '';
                if (color.count == 0) {
                    hiddenClass = Constants.CLASS.HIDDEN;
                }
                return '<div class="status-color ' + colorClass + ' ' + hiddenClass + '">' + color.count + '</div>'
            });
            result = '<div class="status-colors">' + colors.join('') + '</div>'
        }
        return result;
    }
});
