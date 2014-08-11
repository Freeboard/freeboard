// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
/* jshint camelcase: false */
var ko = require('knockout');
var _ = require('underscore');

var FreeboardModel = require('./FreeboardModel');
var $root;

var $root = new freeboardModel();
var currentStyle = {
  values: {
    'font-family': '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif',
    'color'      : '#d3d4d4',
    'font-weight': 100
  }
};

// PUBLIC FUNCTIONS
module.exports = {
  initialize: function(editable, callback) {
    $root = new FreeboardModel(editable, callback);
    ko.applyBindings($root);
  },
  newDashboard        : function() {
    $root.loadDashboard({allow_edit: true});
  },
  loadDashboard       : function(configuration, callback) {
    $root.loadDashboard(configuration, callback);
  },
  serialize           : function() {
    return $root.serialize();
  },
  setEditing          : function(editing, animate) {
    $root.setEditing(editing, animate);
  },
  isEditing           : function() {
    return $root.isEditing();
  },
  loadDatasourcePlugin: function(plugin) {
    $root.addDatasourcePlugin(plugin);
  },
  loadWidgetPlugin    : function(plugin) {
    $root.addWidgetPlugin(plugin);
  },
  addStyle            : function(selector, rules) {
    var context = document, stylesheet;

    if(typeof context.styleSheets === 'object') {
      if(context.styleSheets.length) {
        stylesheet = context.styleSheets[context.styleSheets.length - 1];
      }
      if(context.styleSheets.length) {
        if(context.createStyleSheet) {
          stylesheet = context.createStyleSheet();
        }
        else {
          context.getElementsByTagName('head')[0].appendChild(context.createElement('style'));
          stylesheet = context.styleSheets[context.styleSheets.length - 1];
        }
      }
      if(stylesheet.addRule) {
        stylesheet.addRule(selector, rules);
      }
      else {
        stylesheet.insertRule(selector + '{' + rules + '}', stylesheet.cssRules.length);
      }
    }
  },
  showDialog          : function(contentElement, title, okTitle, cancelTitle, okCallback) {
    createDialogBox(contentElement, title, okTitle, cancelTitle, okCallback);
  },
  getDatasourceSettings : function(datasourceName) {
    var datasources = $root.datasources();

    // Find the datasource with the name specified
    var datasource = _.find(datasources, function(datasourceModel){
      return (datasourceModel.name() === datasourceName);
    });

    if(datasource) {
      return datasource.settings();
    }
    else {
      return null;
    }
  },
  setDatasourceSettings : function(datasourceName, settings) {
    var datasources = $root.datasources();

    // Find the datasource with the name specified
    var datasource = _.find(datasources, function(datasourceModel){
      return (datasourceModel.name() === datasourceName);
    });

    if(!datasource) {
      console.log('Datasource not found');
      return;
    }

    var combinedSettings = _.defaults(settings, datasource.settings());
    datasource.settings(combinedSettings);
  },
  getStyleString      : function(name) {
    var returnString = '';

    _.each(currentStyle[name], function(value, name) {
      returnString = returnString + name + ':' + value + ';';
    });

    return returnString;
  },
  getStyleObject      : function(name) {
    return currentStyle[name];
  }
};

$.extend(freeboard, jQuery.eventEmitter);
