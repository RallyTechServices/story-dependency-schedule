/* global Ext _ Constants */
(function() {
    Ext.define('Legend', {
        alias: 'widget.tslegend',
        extend: 'Ext.Component',

        constructor: function(config) {
            var colors = _.map(Constants.STATUS_LABEL_ORDER, function(color) {
                var colorClass = color.label.toLowerCase().replace(" ", "-");
                return '<div class="status-color ' + colorClass + '">' + color.label + '</div>';
            });
            var template = '<div class="legend">' + colors.join('') + '</div>'
            this.renderTpl = new Ext.Template(template);
            this.callParent([this.config]);
        }
    });
})();
