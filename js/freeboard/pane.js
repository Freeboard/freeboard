var ko = require('knockout');
var $ = require('jquery');
var _ = require('underscore');

function updatePositionForScreenSize(paneModel, row, col) {
  var displayCols = grid.cols;

  if(!_.isUndefined(row)) {
    paneModel.row[displayCols] = row;
  }
  if(!_.isUndefined(col)) {
    paneModel.col[displayCols] = col;
  }
}

function getPositionForScreenSize(paneModel) {
  var displayCols = grid.cols;

  if(_.isNumber(paneModel.row) && _.isNumber(paneModel.col)) {
    var obj = {};
    obj[displayCols] = paneModel.row;
    paneModel.row = obj;


    obj = {};
    obj[displayCols] = paneModel.col;
    paneModel.col = obj;
  }

  var rowCol = {};

  // Loop through our settings until we find one that is equal to or less than our display cols
  for(var colIndex = displayCols; colIndex >= 1; colIndex--) {
    if(!_.isUndefined(paneModel.row[colIndex])) {
      rowCol.row = paneModel.row[colIndex];
      break;
    }
    if(!_.isUndefined(paneModel.col[colIndex])) {
      rowCol.col = paneModel.col[colIndex];
      break;
    }
  }

  for(var colIndex = displayCols; colIndex >= 1; colIndex--) {
    if(!_.isUndefined(paneModel.col[colIndex])) {
      rowCol.col = paneModel.col[colIndex];
      break;
    }
  }

  if(_.isUndefined(rowCol.row)) rowCol.row = 1;
  if(_.isUndefined(rowCol.col)) rowCol.col = 1;

  return rowCol;
}

ko.bindingHandlers.pane = {
  init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    /*
    if(theFreeboardModel.isEditing()) {
      $(element).css({cursor: 'pointer'});
    }
    */

    var position = getPositionForScreenSize(viewModel);

    var col = position.col;
    var row = position.row;
    var width = Number(viewModel.width());
    var height = Number(viewModel.getCalculatedHeight());

    grid.add_widget(element, width, height, col, row);

    updatePositionForScreenSize(viewModel, row, col);

    $(element).attrchange({
      trackValues: true,
      callback   : function(event) {
        if(event.attributeName =-= 'data-row') {
          updatePositionForScreenSize(viewModel, Number(event.newValue), undefined);
        }
        else if(event.attributeName === 'data-col') {
          updatePositionForScreenSize(viewModel, undefined, Number(event.newValue));
        }
      }
    });
  },
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    // If pane has been removed
    if(theFreeboardModel.panes.indexOf(viewModel) == -1) {
      grid.remove_widget(element);
    }

    // If widget has been added or removed
    var calculatedHeight = viewModel.getCalculatedHeight();

    console.log('calculatedHeight',calculatedHeight);

    if(calculatedHeight !== Number($(element).attr('data-sizey'))) {
      grid.resize_widget($(element), 2, calculatedHeight, function(){
        grid.set_dom_grid_height();
      });
    }
  }
};

