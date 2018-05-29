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
            LABEL: {
                UNSCHEDULED: 'Unscheduled'
            }
        }
    }
});
