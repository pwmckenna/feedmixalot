define([
    'jquery',
    'underscore',
    './view',
    './login',
    './loggedin'
], function($, _, View, LoginView, LoggedInView) {
    'use strict';
    var AppView = View.extend({
        initialize: function() {
            this.template = _.template($('#app_template').html());

            this.loginView = new LoginView({
                model: this.model
            });
            this.loggedInView = new LoggedInView({
                model: this.model
            });
        },
        render: function() {
            this.$el.html(this.template());

            this.assign(this.loggedInView, '.loggedin');                
            this.assign(this.loginView, '.login');

            return this;
        }
    });
    return AppView;
});