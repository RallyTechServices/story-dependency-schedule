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
            var result;
            // Now get the sub-data so the default renderer can work
            var subRecord = record;
            var subDataIndex = column.__subDataIndex;
            if (subDataIndex) {
                subRecord = record.get(subDataIndex);
            }
            if (subRecord) {
                result = renderer(value, metaData, subRecord, rowIndex, colIndex, store, view);
            }
            else {
                result = '';
            }

            // After the default renderer has run, update the tdCls (it overwrite the tdCls value)
            Renderers.alternateRowModifier(metaData, record, rowIndex, store, subDataIndex);
            return result;
        }
    }
});
