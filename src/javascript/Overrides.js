/**
 * Allows us to use the default field renderers returned by
 * Rally.ui.grid.FieldColumnFactory.getColumnConfigFromField() by wrapping
 * that renderer in a function that knows how to get to the Story, Predecessor
 * and Successor objects in our custom model.
 */
Ext.override(Rally.ui.grid.CellRendererFactory, {
    createRendererFunction: function(column) {
        var renderer = this.callParent(arguments);
        return function(value, metaData, record, rowIndex, colIndex, store, view) {

            var subRecord = record;
            if (column.initialConfig.isContained) {
                var subDataIndex = column.initialConfig.isContained.__subDataIndex;
                subRecord = record.get(subDataIndex);
            }
            if (subRecord) {
                return renderer(value, metaData, subRecord, rowIndex, colIndex, store, view);
            }
            else {
                return '';
            }
        }
    }
});
