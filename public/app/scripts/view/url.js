define([
    'jquery',
    'underscore',
    './view'
], function($, _, View) {
    'use strict';
    var UrlView = View.extend({
        events: {
            'click .removeUrl': 'onRemove'
        },
        initialize: function() {
            this.template = _.template($('#url_template').html());
        },
        onRemove: function(ev) {
            this.model.ref().remove();
        },
        render: function() {
            this.$el.html(this.template(this.model.val()));
            return this;
        }
    });
    return UrlView;
});