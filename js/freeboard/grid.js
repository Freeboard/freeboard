var $ = require('jquery');
var ko = require('ko');
module.exports = function () {
  ko.bindingHandlers.grid = {
    init: function(element/*, valueAccessor, allBindingsAccessor, viewModel, bindingContext*/) {
      // Initialize our grid
      var grid = $(element).gridster({
        widget_margins        : [10, 10],
        widget_base_dimensions: [300, 300]
      }).data('gridster');

      $('.gridster').css('width', grid.cols * 300 + (grid.cols * 20));

      grid.disable();
    }
  };
};
