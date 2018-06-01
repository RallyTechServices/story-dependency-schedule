Ext.define('Renderers', {

    singleton: true,

    alternateRowModifier: function(metaData, record, rowIndex, store, subDataIndex) {
        // Determine the row color so that row colors alternate anytime the primary
        // artifact changes.
        var extraCls = [subDataIndex.toLowerCase()];
        var rowItemId = record.get(Constants.ID.STORY).id;
        if (rowIndex == 0) {
            record.alternateRow = false;
        }
        else {
            var priorRowItem = store.getAt(rowIndex - 1);
            if (rowItemId != priorRowItem.get(Constants.ID.STORY).id) {
                record.alternateRow = !priorRowItem.alternateRow;
                extraCls.push(Constants.CLASS.FIRST_IN_GROUP);
            }
            else {
                record.alternateRow = priorRowItem.alternateRow;
                if (subDataIndex === Constants.ID.STORY) {
                    extraCls.push(Constants.CLASS.HIDDEN);
                }
            }
        }

        if (record.alternateRow) {
            extraCls.push(Constants.CLASS.ALTERNATE_ROW);
        }

        metaData.tdCls = metaData.tdCls + ' ' + extraCls.join(' ');

    }
});
