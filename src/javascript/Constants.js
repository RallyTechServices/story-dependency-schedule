/* global Ext */
Ext.define('Constants', function(Constants) {
    return {
        statics: {
            STORY_FETCH_FIELDS: ['Predecessors', 'Successors', 'FormattedID', 'Name', 'Project', 'Iteration', 'StartDate'],
            FEATURE_FETCH_FIELDS: ['Predecessors', 'Successors', 'FormattedID', 'Name', 'Project', 'Release', 'ReleaseStartDate'],
            CLASS: {
                OK: 'ok',
                WARNING: 'warning',
                ERROR: 'error',
                UNKNOWN: 'unknown'
            },
            ID: {
                STORY: 'STORY',
                PREDECESSOR: 'PREDECESSOR',
                SUCCESSOR: 'SUCCESSOR'
            },
            LABEL: {
                UNSCHEDULED: 'Unscheduled',
                DEPENDENCY_TYPE: 'Dependency Type',
            },
            SETTING: {
                DEPENDENCY_TYPE: 'DEPENDENCY_TYPE',
                STORY: 'STORY'
            }
        }
    }
});
