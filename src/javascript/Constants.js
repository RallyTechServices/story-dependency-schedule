/* global Ext */
Ext.define('Constants', function(Constants) {
    return {
        statics: {
            STORY_FETCH_FIELDS: ['Predecessors', 'Successors', 'FormattedID', 'Name', 'Project', 'Iteration', 'StartDate'],
            CLASS: {
                OK: 'ok',
                WARNING: 'warning',
                ERROR: 'error',
            },
            ID: {
                STORY: 'STORY',
                PREDECESSOR: 'PREDECESSOR',
                SUCCESSOR: 'SUCCESSOR'
            },
            STATUS_LABEL_ORDER: [{
                    label: 'Late',
                    hex: '#F66349',
                    count: 0
                },
                {
                    label: 'At Risk',
                    hex: '#FAD200',
                    count: 0
                },
                {
                    label: 'Not Started',
                    hex: '#E0E0E0',
                    count: 0
                },
                {
                    label: 'On Track',
                    hex: '#8DC63F',
                    count: 0
                },
                {
                    label: 'Complete',
                    hex: '#D1D1D1',
                    count: 0
                }
            ],
            SETTINGS: {
                PORTFOLIO_ITEM_TYPE_NAME: 'portfolioItemTypeName'
            },
            LABEL: {
                UNSCHEDULED: 'Unscheduled'
            }
        }
    }
});
