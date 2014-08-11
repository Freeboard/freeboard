var ko = require('knockout');
var _ = require('underscore');

function PaneModel() {
  var self = this;

  this.title = ko.observable();
  this.width = ko.observable(1);
  this.row = {};
  this.col = {};
  this.widgets = ko.observableArray();

  this.addWidget = function(widget) {
    this.widgets.push(widget);
  }

  this.widgetCanMoveUp = function(widget) {
    return (self.widgets.indexOf(widget) >= 1);
  }

  this.widgetCanMoveDown = function(widget) {
    var i = self.widgets.indexOf(widget);

    return (i < self.widgets().length - 1);
  }

  this.moveWidgetUp = function(widget) {
    if(self.widgetCanMoveUp(widget)) {
      var i = self.widgets.indexOf(widget);
      var array = self.widgets();
      self.widgets.splice(i - 1, 2, array[i], array[i - 1]);
    }
  }

  this.moveWidgetDown = function(widget) {
    if(self.widgetCanMoveDown(widget)) {
      var i = self.widgets.indexOf(widget);
      var array = self.widgets();
      self.widgets.splice(i, 2, array[i + 1], array[i]);
    }
  }

  this.getCalculatedHeight = function() {

    var sumHeights = _.reduce(self.widgets(), function(memo, widget) {
      return memo + widget.height();
    }, 0);

    return Math.max(1, sumHeights);
  }

  this.serialize = function() {
    var widgets = [];

    _.each(self.widgets(), function(widget) {
      widgets.push(widget.serialize());
    });

    return {
      title  : self.title(),
      width  : self.width(),
      row    : self.row,
      col    : self.col,
      widgets: widgets
    };
  }

  this.deserialize = function(object) {
    self.title(object.title);
    self.width(object.width);

    self.row = object.row;
    self.col = object.col;

    _.each(object.widgets, function(widgetConfig) {
      var widget = new WidgetModel();
      widget.deserialize(widgetConfig);
      self.widgets.push(widget);
    });
  }

  this.dispose = function() {
    _.each(self.widgets(), function(widget) {
      widget.dispose();
    });
  }
}

