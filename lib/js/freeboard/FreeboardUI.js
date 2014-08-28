function FreeboardUI()
{
	var PANE_MARGIN = 10;
	var PANE_WIDTH = 300;

	var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
	var grid;

	function processResize(layoutWidgets)
	{
		var repositionFunction = function(){};
		if(layoutWidgets)
		{
			repositionFunction = function(index){
				var paneElement = this;
				var viewModel = ko.dataFor(paneElement);

				var newPosition = getPositionForScreenSize(viewModel);
				$(paneElement).attr("data-row", newPosition.row)
					.attr("data-col", newPosition.col);
			}
		}
		repositionGrid(repositionFunction);
	}

	function repositionGrid(repositionFunction) {
		var rootElement = grid.$el;

		rootElement.find("> li").unbind().removeData();
		$(".gridster").css("width", "");
		grid.generate_grid_and_stylesheet();

		rootElement.find("> li").each(repositionFunction);

		grid.init();
		$(".gridster").css("width", grid.cols * PANE_WIDTH + (grid.cols * PANE_MARGIN * 2));

	}

	function addGridColumn(shift)
	{
		var col_width = PANE_MARGIN + PANE_WIDTH + PANE_MARGIN;
		var num_cols = grid.cols + 1;
		var new_width = col_width*num_cols;
		var available_width = $("#board-content").width();
		if(new_width > available_width)
		{
			return;
		}
		$(".gridster").css("max-width", new_width);

		repositionGrid(function() {
			var paneElement = this;
			var paneModel = ko.dataFor(paneElement);

			var prevColumnIndex = grid.cols > 1 ? grid.cols - 1 : 1;
			var prevCol = paneModel.col[prevColumnIndex];
			var prevRow = paneModel.row[prevColumnIndex];
			var newPosition;
			if(shift)
			{
				leftPreviewCol = true;
				var newCol = prevCol < grid.cols ? prevCol + 1 : grid.cols;
				newPosition = {row: prevRow, col: newCol};
			}
			else 
			{
				rightPreviewCol = true;
				newPosition = {row: prevRow, col: prevCol};
			}
			$(paneElement).attr("data-row", newPosition.row).attr("data-col", newPosition.col);
		});
	}

	function subtractGridColumn(shift)
	{
		var col_width = PANE_MARGIN + PANE_WIDTH + PANE_MARGIN;
		var num_cols = grid.cols - 1;
		var new_width = col_width*num_cols;
		if(num_cols < 1)
		{
			return;
		}
		$(".gridster").css("max-width", new_width);

		repositionGrid(function() {
			var paneElement = this;
			var paneModel = ko.dataFor(paneElement);

			var prevColumnIndex = grid.cols + 1;
			var prevCol = paneModel.col[prevColumnIndex];
			var prevRow = paneModel.row[prevColumnIndex];
			var newPosition;
			if(shift)
			{
				// This will cause problems if there are panes in column 1
				var newCol = prevCol > 1 ? prevCol - 1 : 1;
				newPosition = {row: prevRow, col: newCol};
			}
			else 
			{
				// This will cause problems if there are panes in the last column
				var newCol = prevCol <= grid.cols ? prevCol : grid.cols;
				newPosition = {row: prevRow, col: newCol};
			}
			$(paneElement).attr("data-row", newPosition.row).attr("data-col", newPosition.col);
		});
	}

	ko.bindingHandlers.grid = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			// Initialize our grid
			grid = $(element).gridster({
				widget_margins        : [PANE_MARGIN, PANE_MARGIN],
				widget_base_dimensions: [PANE_WIDTH, 10],
				resize: {
					enabled : false,
					axes : "x"
				}
			}).data("gridster");

			processResize(false)

			grid.disable();
		}
	}

	function addPane(element, viewModel, isEditing)
	{
		var position = getPositionForScreenSize(viewModel);
		var col = position.col;
		var row = position.row;
		var width = Number(viewModel.width());
		var height = Number(viewModel.getCalculatedHeight());

		grid.add_widget(element, width, height, col, row);

		if(isEditing)
		{
			showPaneEditIcons(true);
		}

		updatePositionForScreenSize(viewModel, row, col);

		$(element).attrchange({
			trackValues: true,
			callback   : function(event)
			{
				if(event.attributeName == "data-row")
				{
                    updatePositionForScreenSize(viewModel, Number(event.newValue), undefined);
				}
				else if(event.attributeName == "data-col")
				{
                    updatePositionForScreenSize(viewModel, undefined, Number(event.newValue));
				}
			}
		});
	}

	function updatePane(element, viewModel)
	{
		// If widget has been added or removed
		var calculatedHeight = viewModel.getCalculatedHeight();

		var elementHeight = Number($(element).attr("data-sizey"));
		var elementWidth = Number($(element).attr("data-sizex"));

		if(calculatedHeight != elementHeight || viewModel.col_width() !=  elementWidth)
		{
			grid.resize_widget($(element), viewModel.col_width(), calculatedHeight, function(){
				grid.set_dom_grid_height();
			});
		}
	}

	function updatePositionForScreenSize(paneModel, row, col)
	{
		var displayCols = grid.cols;

		if(!_.isUndefined(row)) paneModel.row[displayCols] = row;
		if(!_.isUndefined(col)) paneModel.col[displayCols] = col;
	}

	function showLoadingIndicator(show)
	{
		if(show)
		{
			loadingIndicator.fadeOut(0).appendTo("body").fadeIn(500);
		}
		else
		{
	    		loadingIndicator.fadeOut(500).remove();
		}
	}

	function showPaneEditIcons(show, animate)
	{
		if(_.isUndefined(animate))
		{
			animate = true;
		}

		var animateLength = (animate) ? 250 : 0;

		if(show)
		{
			$(".pane-tools").fadeIn(animateLength);//.css("display", "block").animate({opacity: 1.0}, animateLength);
		}
		else
		{
			$(".pane-tools").fadeOut(animateLength);//.animate({opacity: 0.0}, animateLength).css("display", "none");//, function()
			/*{
			 $(this).css("display", "none");
			 });*/
		}
	}

	function attachWidgetEditIcons(element)
	{
		$(element).hover(function()
		{
			showWidgetEditIcons(this, true);
		}, function()
		{
			showWidgetEditIcons(this, false);
		});
	}

	function showWidgetEditIcons(element, show)
	{
		if(show)
		{
			$(element).find(".sub-section-tools").fadeIn(250);
		}
		else
		{
			$(element).find(".sub-section-tools").fadeOut(250);
		}
	}

	function getPositionForScreenSize(paneModel)
	{
		var cols = grid.cols;

		if(_.isNumber(paneModel.row) && _.isNumber(paneModel.col)) // Support for legacy format
		{
			var obj = {};
			obj[cols] = paneModel.row;
			paneModel.row = obj;


			obj = {};
			obj[cols] = paneModel.col;
			paneModel.col = obj;
		}

		var newColumnIndex = 1;
		var columnDiff = 1000;

		for(var columnIndex in paneModel.col)
		{
			if(columnIndex == cols)	 // If we already have a position defined for this number of columns, return that position
			{
				return {row: paneModel.row[columnIndex], col: paneModel.col[columnIndex]};
			}
			else if(paneModel.col[columnIndex] > cols) // If it's greater than our display columns, put it in the last column
			{
				newColumnIndex = cols;
			}
			else // If it's less than, pick whichever one is closest
			{
				var delta = cols - columnIndex;

				if(delta < columnDiff)
				{
					newColumnIndex = columnIndex;
					columnDiff = delta;
				}
			}
		}

		if(newColumnIndex in paneModel.col && newColumnIndex in paneModel.row)
		{
			return {row: paneModel.row[newColumnIndex], col: paneModel.col[newColumnIndex]};
		}

		return {row:1,col:newColumnIndex};
	}


	// Public Functions
	return {
		showLoadingIndicator : function(show)
		{
			showLoadingIndicator(show);
		},
		showPaneEditIcons : function(show, animate)
		{
			showPaneEditIcons(show, animate);
		},
		attachWidgetEditIcons : function(element)
		{
			attachWidgetEditIcons(element);
		},
		getPositionForScreenSize : function(paneModel)
		{
			return getPositionForScreenSize(paneModel);
		},
		processResize : function(layoutWidgets)
		{
			processResize(layoutWidgets);
		},
		disableGrid : function()
		{
			grid.disable();
		},
		enableGrid : function()
		{
			grid.enable();
		},
		addPane : function(element, viewModel, isEditing)
		{
			addPane(element, viewModel, isEditing);
		},
		updatePane : function(element, viewModel)
		{
			updatePane(element, viewModel);
		},
		removePane : function(element)
		{
			grid.remove_widget(element);
		},
		removeAllPanes : function() {
			grid.remove_all_widgets();
		},
		addGridColumnLeft : function() {
			addGridColumn(true);
		},
		addGridColumnRight : function() {
			addGridColumn(false);
		},
		subGridColumnLeft : function() {
			subtractGridColumn(true);
		},
		subGridColumnRight : function() {
			subtractGridColumn(false);
		}
	}
}
