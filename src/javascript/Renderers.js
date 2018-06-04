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

    },

    /**
     * When the Feature has been renamed, the default renderers don't create the linked
     * ID. Pull the appropriate "feature-level" portfolio item from the records and
     * use the DetailLink component to generate a link.
     */
    featureRenderer: function(metaData, record, rowIndex, store, subDataIndex, columnCfg) {
        try {
            var feature = record.get(subDataIndex).get(columnCfg.dataIndex)
            var result = Rally.nav.DetailLink.getLink({
                record: feature,
                text: feature.FormattedID
            }) + ': ' + feature._refObjectName;
        }
        catch (ex) {
            result = '';
        }
        Renderers.alternateRowModifier(metaData, record, rowIndex, store, subDataIndex);
        return result;
    }
});
