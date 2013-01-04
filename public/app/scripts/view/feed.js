define([
    'jquery',
    'underscore',
    './view',
    './url'
], function($, _, View, UrlView) {
    'use strict';
    var FeedView = View.extend({
        className: 'well',
        events: {
            'click .addUrl': 'onAddUrl',
            'click .removeFeed': 'onRemove',
            'keyup .name': 'onNameChange'
        },
        initialize: function() {
            _.bindAll(this, 'preview', 'onUrlAdded', 'onUrlRemoved', 'onNameChange', 'onPreviewAvailable');
            this.template = _.template($('#feed_template').html());
            this.render();
            this.views = [];
            var urlChildren = this.model.child('urls');
            urlChildren.ref().on('value', this.preview);
            urlChildren.ref().on('child_added', this.onUrlAdded);
            urlChildren.ref().on('child_removed', this.onUrlRemoved);
            this.itemCount = 0;
            this.preview = _.debounce(this.preview, 1000);
        },
        preview: function() {
            console.log('preview');
            var req = $.ajax({
                url: this.getShortUrl().replace('3501', '5000'),
                cache: false
            });
            req.then(this.onPreviewAvailable);
        },
        onPreviewAvailable: function(data) {
            this.itemCount = $(data).find('rss > channel > item').length;
            console.log('onPreviewAvailable', this.itemCount);
            this.render();
        },
        onNameChange: function(ev) {
            var elem = this.$('.name');
            this.model.ref().set({
                name: elem.val()
            });
        },
        onRemove: function(ev) {
            this.model.ref().remove();
        },
        onAddUrl: function(ev) {
            this.model.child('urls').ref().push({
                url: this.$('.input.url').val()
            });
            this.$('.input.url').val('');
            this.preview();
        },
        onUrlRemoved: function(urlChildSnapshot) {
            this.views[urlChildSnapshot.name()].remove();
            delete this.views[urlChildSnapshot.name()];
            console.log('onUrlRemoved');
            this.preview();
        },
        onUrlAdded: function(urlChildSnapshot) {
            var view = new UrlView({
                model: urlChildSnapshot
            });
            this.views[urlChildSnapshot.name()] = view;
            this.$('.urls').append(view.render().el);
            console.log('onUrlAdded');
        },
        getShortUrl: function() {
            return document.URL + this.model.name();
        },
        render: function() {
            var urls = this.$('.urls').children().detach();
            this.$el.html(this.template(_.extend(this.model.val(), {
                url: this.getShortUrl(),
                count: this.itemCount
            })));
            this.$('.urls').append(urls);
            return this;
        }
    });
    return FeedView;
});