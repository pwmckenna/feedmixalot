define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    'use strict';
    var View = Backbone.View.extend({
        assign : function (view, selector) {
            view.setElement(this.$(selector)).render();
        }
    });
    return View;
});