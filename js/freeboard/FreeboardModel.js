/* jshint camelcase: false */

var _ = require('underscore');
var ko = require('knockout');
var $ = require('jquery');

var DatasourceModel = require('./DatasourceModel');
var PaneModel = require('./PanelModel');

module.exports = function FreeboardModel(editable, callback) {

  var widgetPlugins = {};
  var datasourcePlugins = {};

  var self = this;

  this.isEditing = ko.observable(false);
  this.allow_edit = ko.observable(editable);
  this.allow_edit.subscribe(function(newValue) {
    if(newValue) {
      $('#main-header').show();
    }
    else {
      $('#main-header').hide();
    }
  });

  this.header_image = ko.observable();
  this.plugins = ko.observableArray();
  this.datasources = ko.observableArray();
  this.panes = ko.observableArray();
  this.datasourceData = {};
  this.processDatasourceUpdate = function(datasourceModel, newData) {
    var datasourceName = datasourceModel.name();

    self.datasourceData[datasourceName] = newData;

    _.each(self.panes(), function(pane) {
      _.each(pane.widgets(), function(widget) {
        widget.processDatasourceUpdate(datasourceName);
      });
    });
  };

  this.datasourceTypes = ko.computed({
    read: function() {
      var returnTypes = [];

      _.each(datasourcePlugins, function(datasourcePluginType) {
        var typeName = datasourcePluginType.type_name;
        var displayName = typeName;

        if(!_.isUndefined(datasourcePluginType.display_name)) {
          displayName = datasourcePluginType.display_name;
        }

        returnTypes.push({
          name        : typeName,
          display_name: displayName
        });
      });

      return returnTypes;
    }
  });

  this.widgetTypes = ko.computed({
    read: function() {

      var returnTypes = [];

      _.each(widgetPlugins, function(widgetPluginType) {
        var typeName = widgetPluginType.type_name;
        var displayName = typeName;

        if(!_.isUndefined(widgetPluginType.display_name)) {
          displayName = widgetPluginType.display_name;
        }

        returnTypes.push({
          name        : typeName,
          display_name: displayName
        });
      });

      return returnTypes;
    }
  });

  this.addDatasourcePlugin = function (plugin) {
    
    if(_.isUndefined(plugin.display_name)) {
      plugin.display_name = plugin.type_name;
    }

    datasourcePlugins[plugin.type_name] = plugin;
    this.datasourceTypes.valueHasMutated();
  };

  this.addWidgetPlugin = function (plugin) {
    
    if(_.isUndefined(plugin.display_name)) {
      plugin.display_name = plugin.type_name;
    }

    widgetPlugins[plugin.type_name] = plugin;
    this.widgetTypes.valueHasMutated();
  };


  this.serialize = function() {
    var panes = [];

    _.each(self.panes(), function(pane) {
      panes.push(pane.serialize());
    });

    var datasources = [];

    _.each(self.datasources(), function(datasource) {
      datasources.push(datasource.serialize());
    });

    return {
      header_image: self.header_image(),
      allow_edit  : self.allow_edit(),
      plugins     : self.plugins(),
      panes       : panes,
      datasources : datasources
    };
  };

  this.deserialize = function(object, finishedCallback) {
    self.clearDashboard();

    function finishLoad() {
      if(!_.isUndefined(object.allow_edit)) {
        self.allow_edit(object.allow_edit);
      }
      else {
        self.allow_edit(true);
      }

      self.header_image(object.header_image);

      _.each(object.datasources, function(datasourceConfig) {
        var datasource = new DatasourceModel();
        datasource.deserialize(datasourceConfig);
        self.addDatasource(datasource);
      });

      var sortedPanes = _.sortBy(object.panes, function(pane){

        return getPositionForScreenSize(pane).row;

      });

      _.each(sortedPanes, function(paneConfig) {
        var pane = new PaneModel();
        pane.deserialize(paneConfig);
        self.panes.push(pane);
      });

      if(self.allow_edit() && self.panes().length === 0) {
        self.setEditing(true);
      }

      if(_.isFunction(finishedCallback)) {
        finishedCallback();
      }
    }

    // This could have been self.plugins(object.plugins), but for some weird reason head.js was causing a function to be added to the list of plugins.
    _.each(object.plugins, function(plugin) {
      self.addPluginSource(plugin);
    });

    finishLoad();
  };

  this.clearDashboard = function() {
    grid.remove_all_widgets();

    _.each(self.datasources(), function(datasource) {
      datasource.dispose();
    });

    _.each(self.panes(), function(pane) {
      pane.dispose();
    });

    self.plugins.removeAll();
    self.datasources.removeAll();
    self.panes.removeAll();
  };

  this.loadDashboard = function(dashboardData, callback) {
    self.deserialize(dashboardData, function() {
      if(_.isFunction(callback)) {
        callback();
      }
    });
  };

  this.loadDashboardFromLocalFile = function() {
    // Check for the various File API support.
    if(window.File && window.FileReader && window.FileList && window.Blob) {
      var input = document.createElement('input');
      input.type = 'file';
      $(input).on('change', function(event) {
        var files = event.target.files;

        if(files && files.length > 0) {
          var file = files[0];
          var reader = new FileReader();

          reader.addEventListener('load', function(fileReaderEvent) {

            var textFile = fileReaderEvent.target;
            var jsonObject = JSON.parse(textFile.result);


            self.loadDashboard(jsonObject);
            self.setEditing(false);
          });

          reader.readAsText(file);
        }

      });
      $(input).trigger('click');
    }
    else {
      alert('Unable to load a file in this browser.');
    }
  };

  this.saveDashboard = function() {
    var contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([JSON.stringify(self.serialize())], {'type': contentType});
    document.body.appendChild(a);
    a.href = window.URL.createObjectURL(blob);
    a.download = 'dashboard.json';
    a.target='_self';
    a.click();
  };

  this.addDatasource = function(datasource) {
    self.datasources.push(datasource);
  };

  this.deleteDatasource = function(datasource) {
    delete self.datasourceData[datasource.name()];
    datasource.dispose();
    self.datasources.remove(datasource);
  };

  this.createPane = function() {
    var newPane = new PaneModel();
    self.addPane(newPane);
  };

  this.addPane = function(pane) {
    self.panes.push(pane);
  };

  this.deletePane = function(pane) {
    pane.dispose();
    self.panes.remove(pane);
  };

  this.deleteWidget = function(widget) {
    ko.utils.arrayForEach(self.panes(), function(pane) {
      pane.widgets.remove(widget);
    });

    widget.dispose();
  };

  this.setEditing = function(editing, animate) {
    // Don't allow editing if it's not allowed
    if(!self.allow_edit() && editing) {
      return;
    }

    self.isEditing(editing);

    if(_.isUndefined(animate)) {
      animate = true;
    }

    var animateLength = (animate) ? 250 : 0;
    var barHeight = $('#admin-bar').outerHeight();

    if(!editing) {
      $('#toggle-header-icon').addClass('icon-wrench').removeClass('icon-chevron-up');
      $('.gridster .gs_w').css({cursor: 'default'});
      $('#main-header').animate({'top': '-' + barHeight + 'px'}, animateLength);
      $('#board-content').animate({'top': '20'}, animateLength);
      $('#main-header').data().shown = false;
      $('.sub-section').unbind();
      grid.disable();
    }
    else {
      $('#toggle-header-icon').addClass('icon-chevron-up').removeClass('icon-wrench');
      $('.gridster .gs_w').css({cursor: 'pointer'});
      $('#main-header').animate({'top': '0px'}, animateLength);
      $('#board-content').animate({'top': (barHeight + 20) + 'px'}, animateLength);
      $('#main-header').data().shown = true;
      attachWidgetEditIcons($('.sub-section'));
      grid.enable();
    }

  };

  this.toggleEditing = function() {
    var editing = !self.isEditing();
    self.setEditing(editing);
  };

  this.setEditing(editable);

  if (_.isFunction(callback)) {
    callback();
  }

};
