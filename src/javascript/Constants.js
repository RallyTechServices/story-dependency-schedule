/* global Ext */
Ext.define('Constants', function(Constants) {
    return {
        statics: {
            DEFAULT_COLUMNS: ['FormattedID', 'Name', 'Project'],
            ARTIFACT_FETCH_FIELDS: ['Predecessors', 'Successors', 'Release', 'ReleaseStartDate', 'Iteration', 'StartDate', 'Name'],
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
