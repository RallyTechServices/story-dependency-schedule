/* global Ext _ Constants */
(function() {
    Ext.define('LegendGridboardPlugin', {
        alias: 'plugin.tslegendgridboardplugin',
        extend: 'Ext.AbstractPlugin',
        mixins: [
            'Rally.ui.gridboard.plugin.GridBoardControlShowable'
        ],

        init: function(cmp) {
            this.callParent(arguments);
            this.showControl();
        },

        getControlCmpConfig: function() {
            return {
                xtype: 'tslegend'
            }
        }
    });
})();
