define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    'use strict';
    var AuthenticationModel = Backbone.Model.extend({
        initialize: function() {
            this.feeds = new Firebase('https://feedmixalot.firebaseIO.com/feeds');
            this.auth = new FirebaseAuthClient(this.feeds);
            this.getLoginStatus();
        },
        getLoginStatus: function() {
            FB.getLoginStatus(_.bind(this.onLoginStatus, this));
        },
        onLoginStatus: function(response) {
            this.set('status', response.status);
            this.set(response.authResponse);
        },
        login: function() {
            this.auth.login('facebook', _.bind(this.getLoginStatus, this));
        }
    });
    return AuthenticationModel;
});