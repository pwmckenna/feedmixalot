require.config({
    shim: {
        "underscore": {
            exports: "_"
        },
        // Backbone
        "backbone": {

           // Depends on underscore/lodash and jQuery
           "deps": ["underscore", "jquery"],

          // Exports the global window.Backbone object
          "exports": "Backbone"

        },
    },

    paths: {
        hm: 'vendor/hm',
        esprima: 'vendor/esprima',
        jquery: 'vendor/jquery.min',
        underscore: 'components/underscore/underscore-min',
        backbone: 'components/backbone/backbone-min'
    }
});
 
require(['model/authentication', 'view/app'], function(AuthenticationModel, AppView) {
  window.authentication = new AuthenticationModel();
  var view = new AppView({
    model: authentication
  });
  $('body').append(view.render().el);
});