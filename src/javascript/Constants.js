/* global Ext */
Ext.define('Constants', function(Constants) {
    return {
        statics: {
            PORTFOLIO_ITEM_FETCH_FIELDS: ['Predecessors', 'Successors'],
            CLASS: {
                PREDECESSORS: 'predecessors',
                SUCCESSORS: 'successors',
                STATUS_COLORS: 'status-colors',
                PERCENT_DONE_BY_STORY_COUNT: 'percent-done-by-story-count',
                PERCENT_DONE_BY_STORY_PLAN_ESTIMATE: 'percent-done-by-story-plan-estimate',
                HIDDEN: 'hidden'
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
            }
        }
    }
});
