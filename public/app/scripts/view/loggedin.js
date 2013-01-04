define([
    'jquery',
    'underscore',
    './view',
    './feed'
], function($, _, View, FeedView) {
    'use strict';
    var LoggedInView = View.extend({
        events: {
            'click .addFeed': 'onAddFeed'
        },
        initialize: function() {
            _.bindAll(this, 'onFeedAdded', 'onFeedRemoved');
            this.template = _.template($('#logged_in_template').html());
            this.model.on('change:status', this.render, this);
            this.views = [];
            this.model.feeds.on('child_added', this.onFeedAdded);
            this.model.feeds.on('child_removed', this.onFeedRemoved)
        },
        onFeedAdded: function(feedChildSnapshot) {
            var view = new FeedView({
                model: feedChildSnapshot
            });
            this.views[feedChildSnapshot.name()] = view;
            this.$('.feeds').append(view.render().el);
        },
        onFeedRemoved: function(feedChildSnapshot) {
            this.views[feedChildSnapshot.name()].remove();
            delete this.views[feedChildSnapshot.name()];
        },
        onAddFeed: function(ev) {
            this.model.feeds.push({
                name: 'new feed',
                facebook_id: this.model.get('userID')
            });
        },
        render: function() {
            this.$el.html(this.template());
            var status = this.model.get('status');
            if(_.isString(status) && status === 'connected') {
                this.$el.show();
            } else {
                this.$el.hide();
            }            
            return this;
        }
    });
    return LoggedInView;
});