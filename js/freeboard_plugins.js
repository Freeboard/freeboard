<<<<<<< HEAD
var allow = false;
var arr = window.location.pathname.split("/");
var fbname = arr[arr.length-1];
var api_url = "https://api.netpie.io/freeboard/"+fbname;
var access_mode = document.getElementById("am") ? document.getElementById("am").value : '';
var http = new XMLHttpRequest();
var tmp_datasource = '', cur_datasource = '{}';
var last_saved = new Date().getTime();
var save_mode = 'no';
var param;
var sid = document.getElementById("sid") ? document.getElementById("sid").value : '';

//check for save datasource
setInterval(function (datasave){ 
	if(save_mode == 'yes'){
		if(access_mode == 'web'){	
			param = {"sesid":sid, "datasource":{}};
			param.datasource = JSON.parse(tmp_datasource);
			save_mode = 'process';

			http.onreadystatechange = function() {
				if (http.readyState == 4 && http.status == 200) {
					console.log('save successfully : '+http.responseText);
					save_mode = 'no';
					cur_datasource = tmp_datasource;
					last_saved = new Date().getTime();
				}
				else if (http.readyState == 4 && http.status != 200) {
					save_mode = 'no';
					console.log('save failed : '+http.status);
=======
DatasourceModel = function(theFreeboardModel, datasourcePlugins) {
	var self = this;

	function disposeDatasourceInstance()
	{
		if(!_.isUndefined(self.datasourceInstance))
		{
			if(_.isFunction(self.datasourceInstance.onDispose))
			{
				self.datasourceInstance.onDispose();
			}

			self.datasourceInstance = undefined;
		}
	}

	this.name = ko.observable();
	this.latestData = ko.observable();
	this.settings = ko.observable({});
	this.settings.subscribe(function(newValue)
	{
		if(!_.isUndefined(self.datasourceInstance) && _.isFunction(self.datasourceInstance.onSettingsChanged))
		{
			self.datasourceInstance.onSettingsChanged(newValue);
		}
	});

	this.updateCallback = function(newData)
	{
		theFreeboardModel.processDatasourceUpdate(self, newData);

		self.latestData(newData);

		var now = new Date();
		self.last_updated(now.toLocaleTimeString());
	}

	this.type = ko.observable();
	this.type.subscribe(function(newValue)
	{
		disposeDatasourceInstance();

		if((newValue in datasourcePlugins) && _.isFunction(datasourcePlugins[newValue].newInstance))
		{
			var datasourceType = datasourcePlugins[newValue];

			function finishLoad()
			{
				datasourceType.newInstance(self.settings(), function(datasourceInstance)
				{

					self.datasourceInstance = datasourceInstance;
					datasourceInstance.updateNow();

				}, self.updateCallback);
			}

			// Do we need to load any external scripts?
			if(datasourceType.external_scripts)
			{
				head.js(datasourceType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
			}
			else
			{
				finishLoad();
			}
		}
	});

	this.last_updated = ko.observable("never");
	this.last_error = ko.observable();

	this.serialize = function()
	{
		return {
			name    : self.name(),
			type    : self.type(),
			settings: self.settings()
		};
	}

	this.deserialize = function(object)
	{
		self.settings(object.settings);
		self.name(object.name);
		self.type(object.type);
	}

	this.getDataRepresentation = function(dataPath)
	{
		var valueFunction = new Function("data", "return " + dataPath + ";");
		return valueFunction.call(undefined, self.latestData());
	}

	this.updateNow = function()
	{
		if(!_.isUndefined(self.datasourceInstance) && _.isFunction(self.datasourceInstance.updateNow))
		{
			self.datasourceInstance.updateNow();
		}
	}

	this.dispose = function()
	{
		disposeDatasourceInstance();
	}
}

DeveloperConsole = function(theFreeboardModel)
{
	function showDeveloperConsole()
	{
		var pluginScriptsInputs = [];
		var container = $('<div></div>');
		var addScript = $('<div class="table-operation text-button">ADD</div>');
		var table = $('<table class="table table-condensed sub-table"></table>');

		table.append($('<thead style=""><tr><th>Plugin Script URL</th></tr></thead>'));

		var tableBody = $("<tbody></tbody>");

		table.append(tableBody);

		container.append($("<p>Here you can add references to other scripts to load datasource or widget plugins.</p>"))
			.append(table)
			.append(addScript)
            .append('<p>To learn how to build plugins for freeboard, please visit <a target="_blank" href="http://freeboard.github.io/freeboard/docs/plugin_example.html">http://freeboard.github.io/freeboard/docs/plugin_example.html</a></p>');

		function refreshScript(scriptURL)
		{
			$('script[src="' + scriptURL + '"]').remove();
		}

		function addNewScriptRow(scriptURL)
		{
			var tableRow = $('<tr></tr>');
			var tableOperations = $('<ul class="board-toolbar"></ul>');
			var scriptInput = $('<input class="table-row-value" style="width:100%;" type="text">');
			var deleteOperation = $('<li><i class="icon-trash icon-white"></i></li>').click(function(e){
				pluginScriptsInputs = _.without(pluginScriptsInputs, scriptInput);
				tableRow.remove();
			});

			pluginScriptsInputs.push(scriptInput);

			if(scriptURL)
			{
				scriptInput.val(scriptURL);
			}

			tableOperations.append(deleteOperation);
			tableBody
				.append(tableRow
				.append($('<td></td>').append(scriptInput))
					.append($('<td class="table-row-operation">').append(tableOperations)));
		}

		_.each(theFreeboardModel.plugins(), function(pluginSource){

			addNewScriptRow(pluginSource);

		});

		addScript.click(function(e)
		{
			addNewScriptRow();
		});

		new DialogBox(container, "Developer Console", "OK", null, function(){

			// Unload our previous scripts
			_.each(theFreeboardModel.plugins(), function(pluginSource){

				$('script[src^="' + pluginSource + '"]').remove();

			});

			theFreeboardModel.plugins.removeAll();

			_.each(pluginScriptsInputs, function(scriptInput){

				var scriptURL = scriptInput.val();

				if(scriptURL && scriptURL.length > 0)
				{
					theFreeboardModel.addPluginSource(scriptURL);

					// Load the script with a cache buster
					head.js(scriptURL + "?" + Date.now());
				}
			});

		});
	}

	// Public API
	return {
		showDeveloperConsole : function()
		{
			showDeveloperConsole();
		}
	}
}

function DialogBox(contentElement, title, okTitle, cancelTitle, okCallback)
{
	var modal_width = 900;

	// Initialize our modal overlay
	var overlay = $('<div id="modal_overlay" style="display:none;"></div>');

	var modalDialog = $('<div class="modal"></div>');

	function closeModal()
	{
		overlay.fadeOut(200, function()
		{
			$(this).remove();
		});
	}

	// Create our header
	modalDialog.append('<header><h2 class="title">' + title + "</h2></header>");

	$('<section></section>').appendTo(modalDialog).append(contentElement);

	// Create our footer
	var footer = $('<footer></footer>').appendTo(modalDialog);

	if(okTitle)
	{
		$('<span id="dialog-ok" class="text-button">' + okTitle + '</span>').appendTo(footer).click(function()
		{
			var hold = false;

			if(_.isFunction(okCallback))
			{
				hold = okCallback();
			}

			if(!hold)
			{
				closeModal();
			}
		});
	}

	if(cancelTitle)
	{
		$('<span id="dialog-cancel" class="text-button">' + cancelTitle + '</span>').appendTo(footer).click(function()
		{
			closeModal();
		});
	}

	overlay.append(modalDialog);
	$("body").append(overlay);
	overlay.fadeIn(200);
}

function FreeboardModel(datasourcePlugins, widgetPlugins, freeboardUI)
{
	var self = this;

	var SERIALIZATION_VERSION = 1;

	this.version = 0;
	this.isEditing = ko.observable(false);
	this.allow_edit = ko.observable(false);
	this.allow_edit.subscribe(function(newValue)
	{
		if(newValue)
		{
			$("#main-header").show();
		}
		else
		{
			$("#main-header").hide();
		}
	});

	this.header_image = ko.observable();
	this.plugins = ko.observableArray();
	this.datasources = ko.observableArray();
	this.panes = ko.observableArray();
	this.datasourceData = {};
	this.processDatasourceUpdate = function(datasourceModel, newData)
	{
		var datasourceName = datasourceModel.name();

		self.datasourceData[datasourceName] = newData;

		_.each(self.panes(), function(pane)
		{
			_.each(pane.widgets(), function(widget)
			{
				widget.processDatasourceUpdate(datasourceName);
			});
		});
	}

	this._datasourceTypes = ko.observable();
	this.datasourceTypes = ko.computed({
		read: function()
		{
			self._datasourceTypes();

			var returnTypes = [];

			_.each(datasourcePlugins, function(datasourcePluginType)
			{
				var typeName = datasourcePluginType.type_name;
				var displayName = typeName;

				if(!_.isUndefined(datasourcePluginType.display_name))
				{
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

	this._widgetTypes = ko.observable();
	this.widgetTypes = ko.computed({
		read: function()
		{
			self._widgetTypes();

			var returnTypes = [];

			_.each(widgetPlugins, function(widgetPluginType)
			{
				var typeName = widgetPluginType.type_name;
				var displayName = typeName;

				if(!_.isUndefined(widgetPluginType.display_name))
				{
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

	this.addPluginSource = function(pluginSource)
	{
		if(pluginSource && self.plugins.indexOf(pluginSource) == -1)
		{
			self.plugins.push(pluginSource);
		}
	}

	this.serialize = function()
	{
		var panes = [];

		_.each(self.panes(), function(pane)
		{
			panes.push(pane.serialize());
		});

		var datasources = [];

		_.each(self.datasources(), function(datasource)
		{
			datasources.push(datasource.serialize());
		});

		return {
			version     : SERIALIZATION_VERSION,
			header_image: self.header_image(),
			allow_edit  : self.allow_edit(),
			plugins     : self.plugins(),
			panes       : panes,
			datasources : datasources,
			columns     : freeboardUI.getUserColumns()
		};
	}

	this.deserialize = function(object, finishedCallback)
	{
		self.clearDashboard();

		function finishLoad()
		{
			freeboardUI.setUserColumns(object.columns);

			if(!_.isUndefined(object.allow_edit))
			{
				self.allow_edit(object.allow_edit);
			}
			else
			{
				self.allow_edit(true);
			}
			self.version = object.version || 0;
			self.header_image(object.header_image);

			_.each(object.datasources, function(datasourceConfig)
			{
				var datasource = new DatasourceModel(self, datasourcePlugins);
				datasource.deserialize(datasourceConfig);
				self.addDatasource(datasource);
			});

			var sortedPanes = _.sortBy(object.panes, function(pane){
				return freeboardUI.getPositionForScreenSize(pane).row;
			});

			_.each(sortedPanes, function(paneConfig)
			{
				var pane = new PaneModel(self, widgetPlugins);
				pane.deserialize(paneConfig);
				self.panes.push(pane);
			});

			if(self.allow_edit() && self.panes().length == 0)
			{
				self.setEditing(true);
			}

			if(_.isFunction(finishedCallback))
			{
				finishedCallback();
			}

			freeboardUI.processResize(true);
		}

		// This could have been self.plugins(object.plugins), but for some weird reason head.js was causing a function to be added to the list of plugins.
		_.each(object.plugins, function(plugin)
		{
			self.addPluginSource(plugin);
		});

		// Load any plugins referenced in this definition
		if(_.isArray(object.plugins) && object.plugins.length > 0)
		{
			head.js(object.plugins, function()
			{
				finishLoad();
			});
		}
		else
		{
			finishLoad();
		}
	}

	/* netpie-freebaord edit : begin */
	this.clearFreeboard = function(){
		window.localStorage.removeItem("netpie.freeboard.dashboard");
		freeboardUI.clearDashboard();
	}
	/* netpie-freebaord edit end */

	this.clearDashboard = function()
	{
		freeboardUI.removeAllPanes();

		_.each(self.datasources(), function(datasource)
		{
			datasource.dispose();
		});

		_.each(self.panes(), function(pane)
		{
			pane.dispose();
		});

		self.plugins.removeAll();
		self.datasources.removeAll();
		self.panes.removeAll();
	}

	this.loadDashboard = function(dashboardData, callback)
	{
		freeboardUI.showLoadingIndicator(true);
		self.deserialize(dashboardData, function()
		{
			freeboardUI.showLoadingIndicator(false);

			if(_.isFunction(callback))
			{
				callback();
			}

        freeboard.emit("dashboard_loaded");
		});
	}

	this.loadDashboardFromLocalFile = function()
	{
		// Check for the various File API support.
		if(window.File && window.FileReader && window.FileList && window.Blob)
		{
			var input = document.createElement('input');
			input.type = "file";
			$(input).on("change", function(event)
			{
				var files = event.target.files;

				if(files && files.length > 0)
				{
					var file = files[0];
					var reader = new FileReader();

					reader.addEventListener("load", function(fileReaderEvent)
					{

						var textFile = fileReaderEvent.target;
						var jsonObject = JSON.parse(textFile.result);

						window.localStorage.setItem("netpie.freeboard.dashboard",JSON.stringify(jsonObject));
						freeboardUI.loadDashboard(jsonObject);
						freeboardUI.setEditing(!1);

						self.loadDashboard(jsonObject);
						self.setEditing(false);
					});

					reader.readAsText(file);
				}

			});
			$(input).trigger("click");
		}
		else
		{
			alert('Unable to load a file in this browser.');
		}
	}

	this.saveDashboardClicked = function(){
		var target = $(event.currentTarget);
		var siblingsShown = target.data('siblings-shown') || false;
		if(!siblingsShown){
			$(event.currentTarget).siblings('label').fadeIn('slow');
		}else{
			$(event.currentTarget).siblings('label').fadeOut('slow');
		}
		target.data('siblings-shown', !siblingsShown);
	}

	this.saveDashboard = function(_thisref, event)
	{
		var pretty = $(event.currentTarget).data('pretty');
		var contentType = 'application/octet-stream';
		var a = document.createElement('a');
		if(pretty){
			var blob = new Blob([JSON.stringify(self.serialize(), null, '\t')], {'type': contentType});
		}else{
			var blob = new Blob([JSON.stringify(self.serialize())], {'type': contentType});
		}
		document.body.appendChild(a);
		a.href = window.URL.createObjectURL(blob);
		a.download = "dashboard.json";
		a.target="_self";
		a.click();
	}

	this.addDatasource = function(datasource)
	{
		self.datasources.push(datasource);
	}

	this.deleteDatasource = function(datasource)
	{
		delete self.datasourceData[datasource.name()];
		datasource.dispose();
		self.datasources.remove(datasource);
	}

	this.createPane = function()
	{
		var newPane = new PaneModel(self, widgetPlugins);
		self.addPane(newPane);
	}

	this.addGridColumnLeft = function()
	{
		freeboardUI.addGridColumnLeft();
	}

	this.addGridColumnRight = function()
	{
		freeboardUI.addGridColumnRight();
	}

	this.subGridColumnLeft = function()
	{
		freeboardUI.subGridColumnLeft();
	}

	this.subGridColumnRight = function()
	{
		freeboardUI.subGridColumnRight();
	}

	this.addPane = function(pane)
	{
		self.panes.push(pane);
	}

	this.deletePane = function(pane)
	{
		pane.dispose();
		self.panes.remove(pane);
	}

	this.deleteWidget = function(widget)
	{
		ko.utils.arrayForEach(self.panes(), function(pane)
		{
			pane.widgets.remove(widget);
		});

		widget.dispose();
	}

	this.setEditing = function(editing, animate)
	{
		// Don't allow editing if it's not allowed
		if(!self.allow_edit() && editing)
		{
			return;
		}

		self.isEditing(editing);

		if(_.isUndefined(animate))
		{
			animate = true;
		}

		var animateLength = (animate) ? 250 : 0;
		var barHeight = $("#admin-bar").outerHeight();

		if(!editing)
		{
			$("#toggle-header-icon").addClass("icon-wrench").removeClass("icon-chevron-up");
			$(".gridster .gs_w").css({cursor: "default"});
			$("#main-header").animate({"top": "-" + barHeight + "px"}, animateLength);
			$("#board-content").animate({"top": "20"}, animateLength);
			$("#main-header").data().shown = false;
			$(".sub-section").unbind();
			freeboardUI.disableGrid();
		}
		else
		{
			$("#toggle-header-icon").addClass("icon-chevron-up").removeClass("icon-wrench");
			$(".gridster .gs_w").css({cursor: "pointer"});
			$("#main-header").animate({"top": "0px"}, animateLength);
			$("#board-content").animate({"top": (barHeight + 20) + "px"}, animateLength);
			$("#main-header").data().shown = true;
			freeboardUI.attachWidgetEditIcons($(".sub-section"));
			freeboardUI.enableGrid();
		}

		freeboardUI.showPaneEditIcons(editing, animate);
	}

	this.toggleEditing = function()
	{
		var editing = !self.isEditing();
		self.setEditing(editing);
	}
}

function FreeboardUI()
{
	var PANE_MARGIN = 10;
	var PANE_WIDTH = 300;
	var MIN_COLUMNS = 3;
	var COLUMN_WIDTH = PANE_MARGIN + PANE_WIDTH + PANE_MARGIN;

	var userColumns = MIN_COLUMNS;

	var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
	var grid;

	function processResize(layoutWidgets)
	{
		var maxDisplayableColumns = getMaxDisplayableColumnCount();
		var repositionFunction = function(){};
		if(layoutWidgets)
		{
			repositionFunction = function(index)
			{
				var paneElement = this;
				var paneModel = ko.dataFor(paneElement);

				var newPosition = getPositionForScreenSize(paneModel);
				$(paneElement).attr("data-sizex", Math.min(paneModel.col_width(),
					maxDisplayableColumns, grid.cols))
					.attr("data-row", newPosition.row)
					.attr("data-col", newPosition.col);

				paneModel.processSizeChange();
			}
		}

		updateGridWidth(Math.min(maxDisplayableColumns, userColumns));

		repositionGrid(repositionFunction);
		updateGridColumnControls();
	}

	function addGridColumn(shift)
	{
		var num_cols = grid.cols + 1;
		if(updateGridWidth(num_cols))
		{
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
				$(paneElement).attr("data-sizex", Math.min(paneModel.col_width(), grid.cols))
					.attr("data-row", newPosition.row)
					.attr("data-col", newPosition.col);
			});
		}
		updateGridColumnControls();
		userColumns = grid.cols;
	}

	function subtractGridColumn(shift)
	{
		var num_cols = grid.cols - 1;
		if(updateGridWidth(num_cols))
		{
			repositionGrid(function() {
				var paneElement = this;
				var paneModel = ko.dataFor(paneElement);

				var prevColumnIndex = grid.cols + 1;
				var prevCol = paneModel.col[prevColumnIndex];
				var prevRow = paneModel.row[prevColumnIndex];
				var newPosition;
				if(shift)
				{
					var newCol = prevCol > 1 ? prevCol - 1 : 1;
					newPosition = {row: prevRow, col: newCol};
				}
				else
				{
					var newCol = prevCol <= grid.cols ? prevCol : grid.cols;
					newPosition = {row: prevRow, col: newCol};
				}
				$(paneElement).attr("data-sizex", Math.min(paneModel.col_width(), grid.cols))
					.attr("data-row", newPosition.row)
					.attr("data-col", newPosition.col);
			});
		}
		updateGridColumnControls();
		userColumns = grid.cols;
	}

	function updateGridColumnControls()
	{
		var col_controls = $(".column-tool");
		var available_width = $("#board-content").width();
		var max_columns = Math.floor(available_width / COLUMN_WIDTH);

		if(grid.cols <= MIN_COLUMNS)
		{
			col_controls.addClass("min");
		}
		else
		{
			col_controls.removeClass("min");
		}

		if(grid.cols >= max_columns)
		{
			col_controls.addClass("max");
		}
		else
		{
			col_controls.removeClass("max");
		}
	}

	function getMaxDisplayableColumnCount()
	{
		var available_width = $("#board-content").width();
		return Math.floor(available_width / COLUMN_WIDTH);
	}

	function updateGridWidth(newCols)
	{
		if(newCols === undefined || newCols < MIN_COLUMNS)
		{
			newCols = MIN_COLUMNS;
		}

		var max_columns = getMaxDisplayableColumnCount();
		if(newCols > max_columns)
		{
			newCols = max_columns;
		}

		// +newCols to account for scaling on zoomed browsers
		var new_width = (COLUMN_WIDTH * newCols) + newCols;
		$(".responsive-column-width").css("max-width", new_width);

		if(newCols === grid.cols)
		{
			return false; 
		}
		else
		{
			return true;
		}
	}

	function repositionGrid(repositionFunction)
	{
		var rootElement = grid.$el;

		rootElement.find("> li").unbind().removeData();
		$(".responsive-column-width").css("width", "");
		grid.generate_grid_and_stylesheet();

		rootElement.find("> li").each(repositionFunction);

		grid.init();
		$(".responsive-column-width").css("width", grid.cols * PANE_WIDTH + (grid.cols * PANE_MARGIN * 2));
	}

	function getUserColumns()
	{
		return userColumns;
	}

	function setUserColumns(numCols)
	{
		userColumns = Math.max(MIN_COLUMNS, numCols);
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
			$("#column-tools").fadeIn(animateLength);
		}
		else
		{
			$(".pane-tools").fadeOut(animateLength);//.animate({opacity: 0.0}, animateLength).css("display", "none");//, function()
			$("#column-tools").fadeOut(animateLength);
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
		removeAllPanes : function()
		{
			grid.remove_all_widgets();
		},
		addGridColumnLeft : function()
		{
			addGridColumn(true);
		},
		addGridColumnRight : function()
		{
			addGridColumn(false);
		},
		subGridColumnLeft : function()
		{
			subtractGridColumn(true);
		},
		subGridColumnRight : function()
		{
			subtractGridColumn(false);
		},
		getUserColumns : function()
		{
			return getUserColumns();
		},
		setUserColumns : function(numCols)
		{
			setUserColumns(numCols);
		}
	}
}

JSEditor = function () {
	var assetRoot = ""

	function setAssetRoot(_assetRoot) {
		assetRoot = _assetRoot;
	}

	function displayJSEditor(value, callback) {

		var exampleText = "// Example: Convert temp from C to F and truncate to 2 decimal places.\n// return (datasources[\"MyDatasource\"].sensor.tempInF * 1.8 + 32).toFixed(2);";

		// If value is empty, go ahead and suggest something
		if (!value) {
			value = exampleText;
		}

		var codeWindow = $('<div class="code-window"></div>');
		var codeMirrorWrapper = $('<div class="code-mirror-wrapper"></div>');
		var codeWindowFooter = $('<div class="code-window-footer"></div>');
		var codeWindowHeader = $('<div class="code-window-header cm-s-ambiance">This javascript will be re-evaluated any time a datasource referenced here is updated, and the value you <code><span class="cm-keyword">return</span></code> will be displayed in the widget. You can assume this javascript is wrapped in a function of the form <code><span class="cm-keyword">function</span>(<span class="cm-def">datasources</span>)</code> where datasources is a collection of javascript objects (keyed by their name) corresponding to the most current data in a datasource.</div>');

		codeWindow.append([codeWindowHeader, codeMirrorWrapper, codeWindowFooter]);

		$("body").append(codeWindow);

		var codeMirrorEditor = CodeMirror(codeMirrorWrapper.get(0),
			{
				value: value,
				mode: "javascript",
				theme: "ambiance",
				indentUnit: 4,
				lineNumbers: true,
				matchBrackets: true,
				autoCloseBrackets: true
			}
		);

		var closeButton = $('<span id="dialog-cancel" class="text-button">Close</span>').click(function () {
			if (callback) {
				var newValue = codeMirrorEditor.getValue();

				if (newValue === exampleText) {
					newValue = "";
				}

				callback(newValue);
				codeWindow.remove();
			}
		});

		codeWindowFooter.append(closeButton);
	}

	// Public API
	return {
		displayJSEditor: function (value, callback) {
			displayJSEditor(value, callback);
		},
		setAssetRoot: function (assetRoot) {
			setAssetRoot(assetRoot)
		}
	}
}

function PaneModel(theFreeboardModel, widgetPlugins) {
	var self = this;

	this.title = ko.observable();
	this.width = ko.observable(1);
	this.row = {};
	this.col = {};

	this.col_width = ko.observable(1);
	this.col_width.subscribe(function(newValue)
	{
		self.processSizeChange();
	});

	this.widgets = ko.observableArray();

	this.addWidget = function (widget) {
		this.widgets.push(widget);
	}

	this.widgetCanMoveUp = function (widget) {
		return (self.widgets.indexOf(widget) >= 1);
	}

	this.widgetCanMoveDown = function (widget) {
		var i = self.widgets.indexOf(widget);

		return (i < self.widgets().length - 1);
	}

	this.moveWidgetUp = function (widget) {
		if (self.widgetCanMoveUp(widget)) {
			var i = self.widgets.indexOf(widget);
			var array = self.widgets();
			self.widgets.splice(i - 1, 2, array[i], array[i - 1]);
		}
	}

	this.moveWidgetDown = function (widget) {
		if (self.widgetCanMoveDown(widget)) {
			var i = self.widgets.indexOf(widget);
			var array = self.widgets();
			self.widgets.splice(i, 2, array[i + 1], array[i]);
		}
	}

	this.processSizeChange = function()
	{
		// Give the animation a moment to complete. Really hacky.
		// TODO: Make less hacky. Also, doesn't work when screen resizes.
		setTimeout(function(){
			_.each(self.widgets(), function (widget) {
				widget.processSizeChange();
			});
		}, 1000);
	}

	this.getCalculatedHeight = function () {
		var sumHeights = _.reduce(self.widgets(), function (memo, widget) {
			return memo + widget.height();
		}, 0);

		sumHeights *= 6;
		sumHeights += 3;

		sumHeights *= 10;

		var rows = Math.ceil((sumHeights + 20) / 30);

		return Math.max(4, rows);
	}

	this.serialize = function () {
		var widgets = [];

		_.each(self.widgets(), function (widget) {
			widgets.push(widget.serialize());
		});

		return {
			title: self.title(),
			width: self.width(),
			row: self.row,
			col: self.col,
			col_width: self.col_width(),
			widgets: widgets
		};
	}

	this.deserialize = function (object) {
		self.title(object.title);
		self.width(object.width);

		self.row = object.row;
		self.col = object.col;
		self.col_width(object.col_width || 1);

		_.each(object.widgets, function (widgetConfig) {
			var widget = new WidgetModel(theFreeboardModel, widgetPlugins);
			widget.deserialize(widgetConfig);
			self.widgets.push(widget);
		});
	}

	this.dispose = function () {
		_.each(self.widgets(), function (widget) {
			widget.dispose();
		});
	}
}

PluginEditor = function(jsEditor, valueEditor)
{
	function _displayValidationError(settingName, errorMessage)
	{
		var errorElement = $('<div class="validation-error"></div>').html(errorMessage);
		$("#setting-value-container-" + settingName).append(errorElement);
	}

	function _removeSettingsRows()
	{
		if($("#setting-row-instance-name").length)
		{
			$("#setting-row-instance-name").nextAll().remove();
		}
		else
		{
			$("#setting-row-plugin-types").nextAll().remove();
		}
	}

	function _isNumerical(n)
	{
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	function _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, includeRemove)
	{
		var input = $('<textarea></textarea>');

		if(settingDef.multi_input) {
			input.change(function() {
				var arrayInput = [];
				$(valueCell).find('textarea').each(function() {
					var thisVal = $(this).val();
					if(thisVal) {
						arrayInput = arrayInput.concat(thisVal);
					}
				});
				newSettings.settings[settingDef.name] = arrayInput;
			});
		} else {
			input.change(function() {
				newSettings.settings[settingDef.name] = $(this).val();
			});
		}

		if(currentValue) {
			input.val(currentValue);
		}

		valueEditor.createValueEditor(input);

		var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');
		var wrapperDiv = $('<div class="calculated-setting-row"></div>');
		wrapperDiv.append(input).append(datasourceToolbox);

		var datasourceTool = $('<li><i class="icon-plus icon-white"></i><label>DATASOURCE</label></li>')
			.mousedown(function(e) {
				e.preventDefault();
				$(input).val("").focus().insertAtCaret("datasources[\"").trigger("freeboard-eval");
			});
		datasourceToolbox.append(datasourceTool);

		var jsEditorTool = $('<li><i class="icon-fullscreen icon-white"></i><label>.JS EDITOR</label></li>')
			.mousedown(function(e) {
				e.preventDefault();
				jsEditor.displayJSEditor(input.val(), function(result) {
					input.val(result);
					input.change();
				});
			});
		datasourceToolbox.append(jsEditorTool);

		if(includeRemove) {
			var removeButton = $('<li class="remove-setting-row"><i class="icon-minus icon-white"></i><label></label></li>')
				.mousedown(function(e) {
					e.preventDefault();
					wrapperDiv.remove();
					$(valueCell).find('textarea:first').change();
				});
			datasourceToolbox.prepend(removeButton);
		}

		$(valueCell).append(wrapperDiv);
	}

	function createPluginEditor(title, pluginTypes, currentTypeName, currentSettingsValues, settingsSavedCallback)
	{
		var newSettings = {
			type    : currentTypeName,
			settings: {}
		};

		function createSettingRow(name, displayName)
		{
			var tr = $('<div id="setting-row-' + name + '" class="form-row"></div>').appendTo(form);

			tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
			return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);
		}

		var selectedType;
		var form = $('<div></div>');

		var pluginDescriptionElement = $('<div id="plugin-description"></div>').hide();
		form.append(pluginDescriptionElement);

		function createSettingsFromDefinition(settingsDefs, typeaheadSource, typeaheadDataSegment)
		{
			_.each(settingsDefs, function(settingDef)
			{
				// Set a default value if one doesn't exist
				if(!_.isUndefined(settingDef.default_value) && _.isUndefined(currentSettingsValues[settingDef.name]))
				{
					currentSettingsValues[settingDef.name] = settingDef.default_value;
				}

				var displayName = settingDef.name;

				if(!_.isUndefined(settingDef.display_name))
				{
					displayName = settingDef.display_name;
				}

				var valueCell = createSettingRow(settingDef.name, displayName);

				switch (settingDef.type)
				{
					case "array":
					{
						var subTableDiv = $('<div class="form-table-value-subtable"></div>').appendTo(valueCell);

						var subTable = $('<table class="table table-condensed sub-table"></table>').appendTo(subTableDiv);
						var subTableHead = $("<thead></thead>").hide().appendTo(subTable);
						var subTableHeadRow = $("<tr></tr>").appendTo(subTableHead);
						var subTableBody = $('<tbody></tbody>').appendTo(subTable);

						var currentSubSettingValues = [];

						// Create our headers
						_.each(settingDef.settings, function(subSettingDef)
						{
							var subsettingDisplayName = subSettingDef.name;

							if(!_.isUndefined(subSettingDef.display_name))
							{
								subsettingDisplayName = subSettingDef.display_name;
							}

							$('<th>' + subsettingDisplayName + '</th>').appendTo(subTableHeadRow);
						});

						if(settingDef.name in currentSettingsValues)
						{
							currentSubSettingValues = currentSettingsValues[settingDef.name];
						}

						function processHeaderVisibility()
						{
							if(newSettings.settings[settingDef.name].length > 0)
							{
								subTableHead.show();
							}
							else
							{
								subTableHead.hide();
							}
						}

						function createSubsettingRow(subsettingValue)
						{
							var subsettingRow = $('<tr></tr>').appendTo(subTableBody);

							var newSetting = {};

							if(!_.isArray(newSettings.settings[settingDef.name]))
							{
								newSettings.settings[settingDef.name] = [];
							}

							newSettings.settings[settingDef.name].push(newSetting);

							_.each(settingDef.settings, function(subSettingDef)
							{
								var subsettingCol = $('<td></td>').appendTo(subsettingRow);
								var subsettingValueString = "";

								if(!_.isUndefined(subsettingValue[subSettingDef.name]))
								{
									subsettingValueString = subsettingValue[subSettingDef.name];
								}

								newSetting[subSettingDef.name] = subsettingValueString;

								$('<input class="table-row-value" type="text">').appendTo(subsettingCol).val(subsettingValueString).change(function()
								{
									newSetting[subSettingDef.name] = $(this).val();
								});
							});

							subsettingRow.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($('<li></li>').append($('<i class="icon-trash icon-white"></i>').click(function()
							{
								var subSettingIndex = newSettings.settings[settingDef.name].indexOf(newSetting);

								if(subSettingIndex != -1)
								{
									newSettings.settings[settingDef.name].splice(subSettingIndex, 1);
									subsettingRow.remove();
									processHeaderVisibility();
								}
							})))));

							subTableDiv.scrollTop(subTableDiv[0].scrollHeight);

							processHeaderVisibility();
						}

						$('<div class="table-operation text-button">ADD</div>').appendTo(valueCell).click(function()
						{
							var newSubsettingValue = {};

							_.each(settingDef.settings, function(subSettingDef)
							{
								newSubsettingValue[subSettingDef.name] = "";
							});

							createSubsettingRow(newSubsettingValue);
						});

						// Create our rows
						_.each(currentSubSettingValues, function(currentSubSettingValue, subSettingIndex)
						{
							createSubsettingRow(currentSubSettingValue);
						});

						break;
					}
					case "boolean":
					{
						newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

						var onOffSwitch = $('<div class="onoffswitch"><label class="onoffswitch-label" for="' + settingDef.name + '-onoff"><div class="onoffswitch-inner"><span class="on">YES</span><span class="off">NO</span></div><div class="onoffswitch-switch"></div></label></div>').appendTo(valueCell);

						var input = $('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + settingDef.name + '-onoff">').prependTo(onOffSwitch).change(function()
						{
							newSettings.settings[settingDef.name] = this.checked;
						});

						if(settingDef.name in currentSettingsValues)
						{
							input.prop("checked", currentSettingsValues[settingDef.name]);
						}

						break;
					}
					case "option":
					{
						var defaultValue = currentSettingsValues[settingDef.name];

						var input = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(valueCell)).change(function()
						{
							newSettings.settings[settingDef.name] = $(this).val();
						});

						_.each(settingDef.options, function(option)
						{

							var optionName;
							var optionValue;

							if(_.isObject(option))
							{
								optionName = option.name;
								optionValue = option.value;
							}
							else
							{
								optionName = option;
							}

							if(_.isUndefined(optionValue))
							{
								optionValue = optionName;
							}

							if(_.isUndefined(defaultValue))
							{
								defaultValue = optionValue;
							}

							$("<option></option>").text(optionName).attr("value", optionValue).appendTo(input);
						});

						newSettings.settings[settingDef.name] = defaultValue;

						if(settingDef.name in currentSettingsValues)
						{
							input.val(currentSettingsValues[settingDef.name]);
						}

						break;
					}
					default:
					{
						newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

						if(settingDef.type == "calculated")
						{
							if(settingDef.name in currentSettingsValues) {
								var currentValue = currentSettingsValues[settingDef.name];
								if(settingDef.multi_input && _.isArray(currentValue)) {
									var includeRemove = false;
									for(var i=0; i<currentValue.length; i++) {
										_appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue[i], includeRemove);
										includeRemove = true;
									}
								} else {
									_appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, false);
								}
							} else {
								_appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, false);
							}

							if(settingDef.multi_input) {
								var inputAdder = $('<ul class="board-toolbar"><li class="add-setting-row"><i class="icon-plus icon-white"></i><label>ADD</label></li></ul>')
									.mousedown(function(e) {
										e.preventDefault();
										_appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, true);
									});
								$(valueCell).siblings('.form-label').append(inputAdder);
							}
						}
						else
						{
							var input = $('<input type="text">').appendTo(valueCell).change(function()
							{
								if(settingDef.type == "number")
								{
									newSettings.settings[settingDef.name] = Number($(this).val());
								}
								else
								{
									newSettings.settings[settingDef.name] = $(this).val();
								}
							});

							if(settingDef.name in currentSettingsValues)
							{
								input.val(currentSettingsValues[settingDef.name]);
							}

							if(typeaheadSource && settingDef.typeahead_data_field){
								input.addClass('typeahead_data_field-' + settingDef.typeahead_data_field);
							}

							if(typeaheadSource && settingDef.typeahead_field){
								var typeaheadValues = [];

								input.keyup(function(event){
									if(event.which >= 65 && event.which <= 91) {
										input.trigger('change');
									}
								});

								$(input).autocomplete({
									source: typeaheadValues,
									select: function(event, ui){
										input.val(ui.item.value);
										input.trigger('change');
									}
								});

								input.change(function(event){
									var value = input.val();
									var source = _.template(typeaheadSource)({input: value});
									$.get(source, function(data){
										if(typeaheadDataSegment){
											data = data[typeaheadDataSegment];
										}
										data  = _.select(data, function(elm){
											return elm[settingDef.typeahead_field][0] == value[0];
										});

										typeaheadValues = _.map(data, function(elm){
											return elm[settingDef.typeahead_field];
										});
										$(input).autocomplete("option", "source", typeaheadValues);

										if(data.length == 1){
											data = data[0];
											//we found the one. let's use it to populate the other info
											for(var field in data){
												if(data.hasOwnProperty(field)){
													var otherInput = $(_.template('input.typeahead_data_field-<%= field %>')({field: field}));
													if(otherInput){
														otherInput.val(data[field]);
														if(otherInput.val() != input.val()) {
															otherInput.trigger('change');
														}
													}
												}
											}
										}
									});
								});
							}
						}

						break;
					}
				}

				if(!_.isUndefined(settingDef.suffix))
				{
					valueCell.append($('<div class="input-suffix">' + settingDef.suffix + '</div>'));
				}

				if(!_.isUndefined(settingDef.description))
				{
					valueCell.append($('<div class="setting-description">' + settingDef.description + '</div>'));
				}
			});
		}


		new DialogBox(form, title, "Save", "Cancel", function()
		{
			$(".validation-error").remove();

			// Loop through each setting and validate it
			for(var index = 0; index < selectedType.settings.length; index++)
			{
				var settingDef = selectedType.settings[index];

				if(settingDef.required && (_.isUndefined(newSettings.settings[settingDef.name]) || newSettings.settings[settingDef.name] == ""))
				{
					_displayValidationError(settingDef.name, "This is required.");
					return true;
				}
				else if(settingDef.type == "integer" && (newSettings.settings[settingDef.name] % 1 !== 0))
				{
					_displayValidationError(settingDef.name, "Must be a whole number.");
					return true;
				}
				else if(settingDef.type == "number" && !_isNumerical(newSettings.settings[settingDef.name]))
				{
					_displayValidationError(settingDef.name, "Must be a number.");
					return true;
				}
			}

			if(_.isFunction(settingsSavedCallback))
			{
				settingsSavedCallback(newSettings);
			}
		});

		// Create our body
		var pluginTypeNames = _.keys(pluginTypes);
		var typeSelect;

		if(pluginTypeNames.length > 1)
		{
			var typeRow = createSettingRow("plugin-types", "Type");
			typeSelect = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(typeRow));

			typeSelect.append($("<option>Select a type...</option>").attr("value", "undefined"));

			_.each(pluginTypes, function(pluginType)
			{
				typeSelect.append($("<option></option>").text(pluginType.display_name).attr("value", pluginType.type_name));
			});

			typeSelect.change(function()
			{
				newSettings.type = $(this).val();
				newSettings.settings = {};

				// Remove all the previous settings
				_removeSettingsRows();

				selectedType = pluginTypes[typeSelect.val()];

				if(_.isUndefined(selectedType))
				{
					$("#setting-row-instance-name").hide();
					$("#dialog-ok").hide();
				}
				else
				{
					$("#setting-row-instance-name").show();

					if(selectedType.description && selectedType.description.length > 0)
					{
						pluginDescriptionElement.html(selectedType.description).show();
					}
					else
					{
						pluginDescriptionElement.hide();
					}

					$("#dialog-ok").show();
					createSettingsFromDefinition(selectedType.settings, selectedType.typeahead_source, selectedType.typeahead_data_segment);
				}
			});
		}
		else if(pluginTypeNames.length == 1)
		{
			selectedType = pluginTypes[pluginTypeNames[0]];
			newSettings.type = selectedType.type_name;
			newSettings.settings = {};
			createSettingsFromDefinition(selectedType.settings);
		}

		if(typeSelect)
		{
			if(_.isUndefined(currentTypeName))
			{
				$("#setting-row-instance-name").hide();
				$("#dialog-ok").hide();
			}
			else
			{
				$("#dialog-ok").show();
				typeSelect.val(currentTypeName).trigger("change");
			}
		}
	}

	// Public API
	return {
		createPluginEditor : function(
			title,
			pluginTypes,
			currentInstanceName,
			currentTypeName,
			currentSettingsValues,
			settingsSavedCallback)
		{
			createPluginEditor(title, pluginTypes, currentInstanceName, currentTypeName, currentSettingsValues, settingsSavedCallback);
		}
	}
}

ValueEditor = function(theFreeboardModel)
{
	var _veDatasourceRegex = new RegExp(".*datasources\\[\"([^\"]*)(\"\\])?(.*)$");

	var dropdown = null;
	var selectedOptionIndex = 0;
	var _autocompleteOptions = [];
	var currentValue = null;

	var EXPECTED_TYPE = {
		ANY : "any",
		ARRAY : "array",
		OBJECT : "object",
		STRING : "string",
		NUMBER : "number",
		BOOLEAN : "boolean"
	};

	function _isPotentialTypeMatch(value, expectsType)
	{
		if(_.isArray(value) || _.isObject(value))
		{
			return true;
		}
		return _isTypeMatch(value, expectsType);
	}

	function _isTypeMatch(value, expectsType) {
		switch(expectsType)
		{
		case EXPECTED_TYPE.ANY: return true;
		case EXPECTED_TYPE.ARRAY: return _.isArray(value);
		case EXPECTED_TYPE.OBJECT: return _.isObject(value);
		case EXPECTED_TYPE.STRING: return _.isString(value);
		case EXPECTED_TYPE.NUMBER: return _.isNumber(value);
		case EXPECTED_TYPE.BOOLEAN: return _.isBoolean(value);
		}
	}

	function _checkCurrentValueType(element, expectsType) {
		$(element).parent().find(".validation-error").remove();
		if(!_isTypeMatch(currentValue, expectsType)) {
			$(element).parent().append("<div class='validation-error'>" +
				"This field expects an expression that evaluates to type " +
				expectsType + ".</div>");
		}
	}

	function _resizeValueEditor(element)
	{
		var lineBreakCount = ($(element).val().match(/\n/g) || []).length;

		var newHeight = Math.min(200, 20 * (lineBreakCount + 1));

		$(element).css({height: newHeight + "px"});
	}

	function _autocompleteFromDatasource(inputString, datasources, expectsType)
	{
		var match = _veDatasourceRegex.exec(inputString);

		var options = [];

		if(match)
		{
			// Editor value is: datasources["; List all datasources
			if(match[1] == "")
			{
				_.each(datasources, function(datasource)
				{
					options.push({value: datasource.name(), entity: undefined,
						precede_char: "", follow_char: "\"]"});
				});
			}
			// Editor value is a partial match for a datasource; list matching datasources
			else if(match[1] != "" && _.isUndefined(match[2]))
			{
				var replacementString = match[1];

				_.each(datasources, function(datasource)
				{
					var dsName = datasource.name();

					if(dsName != replacementString && dsName.indexOf(replacementString) == 0)
					{
						options.push({value: dsName, entity: undefined,
							precede_char: "", follow_char: "\"]"});
					}
				});
			}
			// Editor value matches a datasources; parse JSON in order to populate list
			else
			{
				// We already have a datasource selected; find it
				var datasource = _.find(datasources, function(datasource)
				{
					return (datasource.name() === match[1]);
				});

				if(!_.isUndefined(datasource))
				{
					var dataPath = "data";
					var remainder = "";

					// Parse the partial JSON selectors
					if(!_.isUndefined(match[2]))
					{
						// Strip any incomplete field values, and store the remainder
						var remainderIndex = match[3].lastIndexOf("]") + 1;
						dataPath = dataPath + match[3].substring(0, remainderIndex);
						remainder = match[3].substring(remainderIndex, match[3].length);
						remainder = remainder.replace(/^[\[\"]*/, "");
						remainder = remainder.replace(/[\"\]]*$/, "");
					}

					// Get the data for the last complete JSON field
					var dataValue = datasource.getDataRepresentation(dataPath);
					currentValue = dataValue;

					// For arrays, list out the indices
					if(_.isArray(dataValue))
					{
						for(var index = 0; index < dataValue.length; index++)
						{
							if(index.toString().indexOf(remainder) == 0)
							{
								var value = dataValue[index];
								if(_isPotentialTypeMatch(value, expectsType))
								{
									options.push({value: index, entity: value,
										precede_char: "[", follow_char: "]",
										preview: value.toString()});
								}
							}
						}
					}
					// For objects, list out the keys
					else if(_.isObject(dataValue))
					{
						_.each(dataValue, function(value, name)
						{
							if(name.indexOf(remainder) == 0)
							{
								if(_isPotentialTypeMatch(value, expectsType))
								{
									options.push({value: name, entity: value,
										precede_char: "[\"", follow_char: "\"]"});
								}
							}
						});
					}
					// For everything else, do nothing (no further selection possible)
					else
					{
						// no-op
					}
				}
			}
		}
		_autocompleteOptions = options;
	}

	function _renderAutocompleteDropdown(element, expectsType)
	{
		var inputString = $(element).val().substring(0, $(element).getCaretPosition());

		// Weird issue where the textarea box was putting in ASCII (nbsp) for spaces.
		inputString = inputString.replace(String.fromCharCode(160), " ");

		_autocompleteFromDatasource(inputString, theFreeboardModel.datasources(), expectsType);

		if(_autocompleteOptions.length > 0)
		{
			if(!dropdown)
			{
				dropdown = $('<ul id="value-selector" class="value-dropdown"></ul>')
					.insertAfter(element)
					.width($(element).outerWidth() - 2)
					.css("left", $(element).position().left)
					.css("top", $(element).position().top + $(element).outerHeight() - 1);
			}

			dropdown.empty();
			dropdown.scrollTop(0);

			var selected = true;
			selectedOptionIndex = 0;

			_.each(_autocompleteOptions, function(option, index)
			{
				var li = _renderAutocompleteDropdownOption(element, inputString, option, index);
				if(selected)
				{
					$(li).addClass("selected");
					selected = false;
				}
			});
		}
		else
		{
			_checkCurrentValueType(element, expectsType);
			$(element).next("ul#value-selector").remove();
			dropdown = null;
			selectedOptionIndex = -1;
		}
	}

	function _renderAutocompleteDropdownOption(element, inputString, option, currentIndex)
	{
		var optionLabel = option.value;
		if(option.preview)
		{
			optionLabel = optionLabel + "<span class='preview'>" + option.preview + "</span>";
		}
		var li = $('<li>' + optionLabel + '</li>').appendTo(dropdown)
			.mouseenter(function()
			{
				$(this).trigger("freeboard-select");
			})
			.mousedown(function(event)
			{
				$(this).trigger("freeboard-insertValue");
				event.preventDefault();
			})
			.data("freeboard-optionIndex", currentIndex)
			.data("freeboard-optionValue", option.value)
			.bind("freeboard-insertValue", function()
			{
				var optionValue = option.value;
				optionValue = option.precede_char + optionValue + option.follow_char;

				var replacementIndex = inputString.lastIndexOf("]");
				if(replacementIndex != -1)
				{
					$(element).replaceTextAt(replacementIndex+1, $(element).val().length,
						optionValue);
				}
				else
				{
					$(element).insertAtCaret(optionValue);
				}

				currentValue = option.entity;
				$(element).triggerHandler("mouseup");
			})
			.bind("freeboard-select", function()
			{
				$(this).parent().find("li.selected").removeClass("selected");
				$(this).addClass("selected");
				selectedOptionIndex = $(this).data("freeboard-optionIndex");
			});
		return li;
	}

	function createValueEditor(element, expectsType)
	{
		$(element).addClass("calculated-value-input")
			.bind("keyup mouseup freeboard-eval", function(event) {
				// Ignore arrow keys and enter keys
				if(dropdown && event.type == "keyup"
					&& (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13))
				{
					event.preventDefault();
					return;
				}
				_renderAutocompleteDropdown(element, expectsType);
			})
			.focus(function()
			{
				$(element).css({"z-index" : 3001});
				_resizeValueEditor(element);
			})
			.focusout(function()
			{
				_checkCurrentValueType(element, expectsType);
				$(element).css({
					"height": "",
					"z-index" : 3000
				});
				$(element).next("ul#value-selector").remove();
				dropdown = null;
				selectedOptionIndex = -1;
			})
			.bind("keydown", function(event)
			{

				if(dropdown)
				{
					if(event.keyCode == 38 || event.keyCode == 40) // Handle Arrow keys
					{
						event.preventDefault();

						var optionItems = $(dropdown).find("li");

						if(event.keyCode == 38) // Up Arrow
						{
							selectedOptionIndex--;
						}
						else if(event.keyCode == 40) // Down Arrow
						{
							selectedOptionIndex++;
						}

						if(selectedOptionIndex < 0)
						{
							selectedOptionIndex = optionItems.size() - 1;
						}
						else if(selectedOptionIndex >= optionItems.size())
						{
							selectedOptionIndex = 0;
						}

						var optionElement = $(optionItems).eq(selectedOptionIndex);

						optionElement.trigger("freeboard-select");
						$(dropdown).scrollTop($(optionElement).position().top);
					}
					else if(event.keyCode == 13) // Handle enter key
					{
						event.preventDefault();

						if(selectedOptionIndex != -1)
						{
							$(dropdown).find("li").eq(selectedOptionIndex)
								.trigger("freeboard-insertValue");
						}
					}
				}
			});
	}

	// Public API
	return {
		createValueEditor : function(element, expectsType)
		{
			if(expectsType)
			{
				createValueEditor(element, expectsType);
			}
			else {
				createValueEditor(element, EXPECTED_TYPE.ANY);
			}
		},
		EXPECTED_TYPE : EXPECTED_TYPE
	}
}

function WidgetModel(theFreeboardModel, widgetPlugins) {
	function disposeWidgetInstance() {
		if (!_.isUndefined(self.widgetInstance)) {
			if (_.isFunction(self.widgetInstance.onDispose)) {
				self.widgetInstance.onDispose();
			}

			self.widgetInstance = undefined;
		}
	}

	var self = this;

	this.datasourceRefreshNotifications = {};
	this.calculatedSettingScripts = {};

	this.title = ko.observable();
	this.fillSize = ko.observable(false);

	this.type = ko.observable();
	this.type.subscribe(function (newValue) {
		disposeWidgetInstance();

		if ((newValue in widgetPlugins) && _.isFunction(widgetPlugins[newValue].newInstance)) {
			var widgetType = widgetPlugins[newValue];

			function finishLoad() {
				widgetType.newInstance(self.settings(), function (widgetInstance) {

					self.fillSize((widgetType.fill_size === true));
					self.widgetInstance = widgetInstance;
					self.shouldRender(true);
					self._heightUpdate.valueHasMutated();

				});
			}

			// Do we need to load any external scripts?
			if (widgetType.external_scripts) {
				head.js(widgetType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
			}
			else {
				finishLoad();
			}
		}
	});

	this.settings = ko.observable({});
	this.settings.subscribe(function (newValue) {
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSettingsChanged)) {
			self.widgetInstance.onSettingsChanged(newValue);
		}

		self.updateCalculatedSettings();
		self._heightUpdate.valueHasMutated();
	});

	this.processDatasourceUpdate = function (datasourceName) {
		var refreshSettingNames = self.datasourceRefreshNotifications[datasourceName];

		if (_.isArray(refreshSettingNames)) {
			_.each(refreshSettingNames, function (settingName) {
				self.processCalculatedSetting(settingName);
			});
		}
	}

	this.callValueFunction = function (theFunction) {
		return theFunction.call(undefined, theFreeboardModel.datasourceData);
	}

	this.processSizeChange = function () {
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSizeChanged)) {
			self.widgetInstance.onSizeChanged();
		}
	}

	this.processCalculatedSetting = function (settingName) {
		if (_.isFunction(self.calculatedSettingScripts[settingName])) {
			var returnValue = undefined;

			try {
				returnValue = self.callValueFunction(self.calculatedSettingScripts[settingName]);
			}
			catch (e) {
				var rawValue = self.settings()[settingName];

				// If there is a reference error and the value just contains letters and numbers, then
				if (e instanceof ReferenceError && (/^\w+$/).test(rawValue)) {
					returnValue = rawValue;
				}
			}

			if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onCalculatedValueChanged) && !_.isUndefined(returnValue)) {
				try {
					self.widgetInstance.onCalculatedValueChanged(settingName, returnValue);
				}
				catch (e) {
					console.log(e.toString());
				}
			}
		}
	}

	this.updateCalculatedSettings = function () {
		self.datasourceRefreshNotifications = {};
		self.calculatedSettingScripts = {};

		if (_.isUndefined(self.type())) {
			return;
		}

		// Check for any calculated settings
		var settingsDefs = widgetPlugins[self.type()].settings;
		var datasourceRegex = new RegExp("datasources.([\\w_-]+)|datasources\\[['\"]([^'\"]+)", "g");
		var currentSettings = self.settings();

		_.each(settingsDefs, function (settingDef) {
			if (settingDef.type == "calculated") {
				var script = currentSettings[settingDef.name];

				if (!_.isUndefined(script)) {

					if(_.isArray(script)) {
						script = "[" + script.join(",") + "]";
					}

					// If there is no return, add one
					if ((script.match(/;/g) || []).length <= 1 && script.indexOf("return") == -1) {
						script = "return " + script;
					}

					var valueFunction;

 					try {
						valueFunction = new Function("datasources", script);
					}
					catch (e) {
						var literalText = currentSettings[settingDef.name].replace(/"/g, '\\"').replace(/[\r\n]/g, ' \\\n');

						// If the value function cannot be created, then go ahead and treat it as literal text
						valueFunction = new Function("datasources", "return \"" + literalText + "\";");
					}

					self.calculatedSettingScripts[settingDef.name] = valueFunction;
					self.processCalculatedSetting(settingDef.name);

					// Are there any datasources we need to be subscribed to?
					var matches;

					while (matches = datasourceRegex.exec(script)) {
						var dsName = (matches[1] || matches[2]);
						var refreshSettingNames = self.datasourceRefreshNotifications[dsName];

						if (_.isUndefined(refreshSettingNames)) {
							refreshSettingNames = [];
							self.datasourceRefreshNotifications[dsName] = refreshSettingNames;
						}

						if(_.indexOf(refreshSettingNames, settingDef.name) == -1) // Only subscribe to this notification once.
						{
							refreshSettingNames.push(settingDef.name);
						}
					}
				}
			}
		});
	}

	this._heightUpdate = ko.observable();
	this.height = ko.computed({
		read: function () {
			self._heightUpdate();

			if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.getHeight)) {
				return self.widgetInstance.getHeight();
			}

			return 1;
		}
	});

	this.shouldRender = ko.observable(false);
	this.render = function (element) {
		self.shouldRender(false);
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.render)) {
			self.widgetInstance.render(element);
			self.updateCalculatedSettings();
		}
	}

	this.dispose = function () {

	}

	this.serialize = function () {
		return {
			title: self.title(),
			type: self.type(),
			settings: self.settings()
		};
	}

	this.deserialize = function (object) {
		self.title(object.title);
		self.settings(object.settings);
		self.type(object.type);
	}
}

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// Jquery plugin to watch for attribute changes
(function($)
{
	function isDOMAttrModifiedSupported()
	{
		var p = document.createElement('p');
		var flag = false;

		if(p.addEventListener)
		{
			p.addEventListener('DOMAttrModified', function()
			{
				flag = true
			}, false);
		}
		else if(p.attachEvent)
		{
			p.attachEvent('onDOMAttrModified', function()
			{
				flag = true
			});
		}
		else
		{
			return false;
		}

		p.setAttribute('id', 'target');

		return flag;
	}

	function checkAttributes(chkAttr, e)
	{
		if(chkAttr)
		{
			var attributes = this.data('attr-old-value');

			if(e.attributeName.indexOf('style') >= 0)
			{
				if(!attributes['style'])
				{
					attributes['style'] = {};
				} //initialize
				var keys = e.attributeName.split('.');
				e.attributeName = keys[0];
				e.oldValue = attributes['style'][keys[1]]; //old value
				e.newValue = keys[1] + ':' + this.prop("style")[$.camelCase(keys[1])]; //new value
				attributes['style'][keys[1]] = e.newValue;
			}
			else
			{
				e.oldValue = attributes[e.attributeName];
				e.newValue = this.attr(e.attributeName);
				attributes[e.attributeName] = e.newValue;
			}

			this.data('attr-old-value', attributes); //update the old value object
		}
	}

	//initialize Mutation Observer
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	$.fn.attrchange = function(o)
	{

		var cfg = {
			trackValues: false,
			callback   : $.noop
		};

		//for backward compatibility
		if(typeof o === "function")
		{
			cfg.callback = o;
		}
		else
		{
			$.extend(cfg, o);
		}

		if(cfg.trackValues)
		{ //get attributes old value
			$(this).each(function(i, el)
			{
				var attributes = {};
				for(var attr, i = 0, attrs = el.attributes, l = attrs.length; i < l; i++)
				{
					attr = attrs.item(i);
					attributes[attr.nodeName] = attr.value;
				}

				$(this).data('attr-old-value', attributes);
			});
		}

		if(MutationObserver)
		{ //Modern Browsers supporting MutationObserver
			/*
			 Mutation Observer is still new and not supported by all browsers.
			 http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1622.html
			 */
			var mOptions = {
				subtree          : false,
				attributes       : true,
				attributeOldValue: cfg.trackValues
			};

			var observer = new MutationObserver(function(mutations)
			{
				mutations.forEach(function(e)
				{
					var _this = e.target;

					//get new value if trackValues is true
					if(cfg.trackValues)
					{
						/**
						 * @KNOWN_ISSUE: The new value is buggy for STYLE attribute as we don't have
						 * any additional information on which style is getting updated.
						 * */
						e.newValue = $(_this).attr(e.attributeName);
					}

					cfg.callback.call(_this, e);
				});
			});

			return this.each(function()
			{
				observer.observe(this, mOptions);
			});
		}
		else if(isDOMAttrModifiedSupported())
		{ //Opera
			//Good old Mutation Events but the performance is no good
			//http://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
			return this.on('DOMAttrModified', function(event)
			{
				if(event.originalEvent)
				{
					event = event.originalEvent;
				} //jQuery normalization is not required for us
				event.attributeName = event.attrName; //property names to be consistent with MutationObserver
				event.oldValue = event.prevValue; //property names to be consistent with MutationObserver
				cfg.callback.call(this, event);
			});
		}
		else if('onpropertychange' in document.body)
		{ //works only in IE
			return this.on('propertychange', function(e)
			{
				e.attributeName = window.event.propertyName;
				//to set the attr old value
				checkAttributes.call($(this), cfg.trackValues, e);
				cfg.callback.call(this, e);
			});
		}

		return this;
	}
})(jQuery);

(function(jQuery) {

    jQuery.eventEmitter = {
        _JQInit: function() {
            this._JQ = jQuery(this);
        },
        emit: function(evt, data) {
            !this._JQ && this._JQInit();
            this._JQ.trigger(evt, data);
        },
        once: function(evt, handler) {
            !this._JQ && this._JQInit();
            this._JQ.one(evt, handler);
        },
        on: function(evt, handler) {
            !this._JQ && this._JQInit();
            this._JQ.bind(evt, handler);
        },
        off: function(evt, handler) {
            !this._JQ && this._JQInit();
            this._JQ.unbind(evt, handler);
        }
    };

}(jQuery));

var freeboard = (function()
{
	var datasourcePlugins = {};
	var widgetPlugins = {};

	var freeboardUI = new FreeboardUI();
	var theFreeboardModel = new FreeboardModel(datasourcePlugins, widgetPlugins, freeboardUI);

	var jsEditor = new JSEditor();
	var valueEditor = new ValueEditor(theFreeboardModel);
	var pluginEditor = new PluginEditor(jsEditor, valueEditor);

	var developerConsole = new DeveloperConsole(theFreeboardModel);

	var currentStyle = {
		values: {
			"font-family": '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif',
			"color"      : "#d3d4d4",
			"font-weight": 100
		}
	};

	ko.bindingHandlers.pluginEditor = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			var options = ko.unwrap(valueAccessor());

			var types = {};
			var settings = undefined;
			var title = "";

			if(options.type == 'datasource')
			{
				types = datasourcePlugins;
				title = "Datasource";
			}
			else if(options.type == 'widget')
			{
				types = widgetPlugins;
				title = "Widget";
			}
			else if(options.type == 'pane')
			{
				title = "Pane";
			}

			$(element).click(function(event)
			{
				if(options.operation == 'delete')
				{
					var phraseElement = $('<p>Are you sure you want to delete this ' + title + '?</p>');
					new DialogBox(phraseElement, "Confirm Delete", "Yes", "No", function()
					{

						if(options.type == 'datasource')
						{
							theFreeboardModel.deleteDatasource(viewModel);
						}
						else if(options.type == 'widget')
						{
							theFreeboardModel.deleteWidget(viewModel);
						}
						else if(options.type == 'pane')
						{
							theFreeboardModel.deletePane(viewModel);
						}

					});
				}
				else
				{
					var instanceType = undefined;

					if(options.type == 'datasource')
					{
						if(options.operation == 'add')
						{
							settings = {};
						}
						else
						{
							instanceType = viewModel.type();
							settings = viewModel.settings();
							settings.name = viewModel.name();
						}
					}
					else if(options.type == 'widget')
					{
						if(options.operation == 'add')
						{
							settings = {};
						}
						else
						{
							instanceType = viewModel.type();
							settings = viewModel.settings();
						}
					}
					else if(options.type == 'pane')
					{
						settings = {};

						if(options.operation == 'edit')
						{
							settings.title = viewModel.title();
							settings.col_width = viewModel.col_width();
						}

						types = {
							settings: {
								settings: [
									{
										name        : "title",
										display_name: "Title",
										type        : "text"
									},
									{
										name : "col_width",
										display_name : "Columns",
										type : "integer",
										default_value : 1,
										required : true
									}
								]
							}
						}
					}

					pluginEditor.createPluginEditor(title, types, instanceType, settings, function(newSettings)
					{
						if(options.operation == 'add')
						{
							if(options.type == 'datasource')
							{
								var newViewModel = new DatasourceModel(theFreeboardModel, datasourcePlugins);
								theFreeboardModel.addDatasource(newViewModel);

								newViewModel.name(newSettings.settings.name);
/* netpie-freeboard edit begin */
//								delete newSettings.settings.name;
/* netpie-freeboard edit end */

								newViewModel.settings(newSettings.settings);
								newViewModel.type(newSettings.type);
							}
							else if(options.type == 'widget')
							{
								var newViewModel = new WidgetModel(theFreeboardModel, widgetPlugins);
								newViewModel.settings(newSettings.settings);
								newViewModel.type(newSettings.type);

								viewModel.widgets.push(newViewModel);

								freeboardUI.attachWidgetEditIcons(element);
							}
						}
						else if(options.operation == 'edit')
						{
							if(options.type == 'pane')
							{
								viewModel.title(newSettings.settings.title);
								viewModel.col_width(newSettings.settings.col_width);
								freeboardUI.processResize(false);
							}
							else
							{
								if(options.type == 'datasource')
								{
									viewModel.name(newSettings.settings.name);
/* netpie-freeboard edit begin */
									//delete newSettings.settings.name;
/* netpie-freeboard edit end */
								}

								viewModel.type(newSettings.type);
								viewModel.settings(newSettings.settings);
							}
						}
					});
				}
			});
		}
	}

	ko.virtualElements.allowedBindings.datasourceTypeSettings = true;
	ko.bindingHandlers.datasourceTypeSettings = {
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			processPluginSettings(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
		}
	}

	ko.bindingHandlers.pane = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(theFreeboardModel.isEditing())
			{
				$(element).css({cursor: "pointer"});
			}

			freeboardUI.addPane(element, viewModel, bindingContext.$root.isEditing());
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			// If pane has been removed
			if(theFreeboardModel.panes.indexOf(viewModel) == -1)
			{
				freeboardUI.removePane(element);
			}
			freeboardUI.updatePane(element, viewModel);
		}
	}

	ko.bindingHandlers.widget = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(theFreeboardModel.isEditing())
			{
				freeboardUI.attachWidgetEditIcons($(element).parent());
			}
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(viewModel.shouldRender())
			{
				$(element).empty();
				viewModel.render(element);
			}
		}
	}

	function getParameterByName(name)
	{
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	$(function()
	{ //DOM Ready
		// Show the loading indicator when we first load
		freeboardUI.showLoadingIndicator(true);

        var resizeTimer;

        function resizeEnd()
        {
            freeboardUI.processResize(true);
        }

        $(window).resize(function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeEnd, 500);
        });

	});

	// PUBLIC FUNCTIONS
	return {
		initialize          : function(allowEdit, finishedCallback)
		{
			ko.applyBindings(theFreeboardModel);

			// Check to see if we have a query param called load. If so, we should load that dashboard initially
			var freeboardLocation = getParameterByName("load");

			if(freeboardLocation != "")
			{
				$.ajax({
					url    : freeboardLocation,
					success: function(data)
					{
						theFreeboardModel.loadDashboard(data);

						if(_.isFunction(finishedCallback))
						{
							finishedCallback();
						}
					}
				});
			}
			else
			{
				theFreeboardModel.allow_edit(allowEdit);
				theFreeboardModel.setEditing(allowEdit);

				freeboardUI.showLoadingIndicator(false);
				if(_.isFunction(finishedCallback))
				{
					finishedCallback();
				}

                freeboard.emit("initialized");
			}
		},
		newDashboard        : function()
		{
			theFreeboardModel.loadDashboard({allow_edit: true});
		},
		loadDashboard       : function(configuration, callback)
		{
			theFreeboardModel.loadDashboard(configuration, callback);
		},
		serialize           : function()
		{
			return theFreeboardModel.serialize();
		},
		setEditing          : function(editing, animate)
		{
			theFreeboardModel.setEditing(editing, animate);
		},
		isEditing           : function()
		{
			return theFreeboardModel.isEditing();
		},
		loadDatasourcePlugin: function(plugin)
		{
			if(_.isUndefined(plugin.display_name))
			{
				plugin.display_name = plugin.type_name;
			}

            // Add a required setting called name to the beginning
            plugin.settings.unshift({
                name : "name",
                display_name : "Name",
                type : "text",
                required : true
            });


			theFreeboardModel.addPluginSource(plugin.source);
			datasourcePlugins[plugin.type_name] = plugin;
			theFreeboardModel._datasourceTypes.valueHasMutated();
		},
        resize : function()
        {
            freeboardUI.processResize(true);
        },
		loadWidgetPlugin    : function(plugin)
		{
			if(_.isUndefined(plugin.display_name))
			{
				plugin.display_name = plugin.type_name;
			}

			theFreeboardModel.addPluginSource(plugin.source);
			widgetPlugins[plugin.type_name] = plugin;
			theFreeboardModel._widgetTypes.valueHasMutated();
		},
		// To be used if freeboard is going to load dynamic assets from a different root URL
		setAssetRoot        : function(assetRoot)
		{
			jsEditor.setAssetRoot(assetRoot);
		},
		addStyle            : function(selector, rules)
		{
			var styleString = selector + "{" + rules + "}";

			var styleElement = $("style#fb-styles");

			if(styleElement.length == 0)
			{
				styleElement = $('<style id="fb-styles" type="text/css"></style>');
				$("head").append(styleElement);
			}

			if(styleElement[0].styleSheet)
			{
				styleElement[0].styleSheet.cssText += styleString;
			}
			else
			{
				styleElement.text(styleElement.text() + styleString);
			}
		},
		showLoadingIndicator: function(show)
		{
			freeboardUI.showLoadingIndicator(show);
		},
		showDialog          : function(contentElement, title, okTitle, cancelTitle, okCallback)
		{
			new DialogBox(contentElement, title, okTitle, cancelTitle, okCallback);
		},
        getDatasourceSettings : function(datasourceName)
        {
            var datasources = theFreeboardModel.datasources();

            // Find the datasource with the name specified
            var datasource = _.find(datasources, function(datasourceModel){
                return (datasourceModel.name() === datasourceName);
            });

            if(datasource)
            {
                return datasource.settings();
            }
            else
            {
                return null;
            }
        },
        setDatasourceSettings : function(datasourceName, settings)
        {
            var datasources = theFreeboardModel.datasources();

            // Find the datasource with the name specified
            var datasource = _.find(datasources, function(datasourceModel){
                return (datasourceModel.name() === datasourceName);
            });

            if(!datasource)
            {
                console.log("Datasource not found");
                return;
            }

            var combinedSettings = _.defaults(settings, datasource.settings());
            datasource.settings(combinedSettings);
        },
		getStyleString      : function(name)
		{
			var returnString = "";

			_.each(currentStyle[name], function(value, name)
			{
				returnString = returnString + name + ":" + value + ";";
			});

			return returnString;
		},
		getStyleObject      : function(name)
		{
			return currentStyle[name];
		},
		showDeveloperConsole : function()
		{
			developerConsole.showDeveloperConsole();
		}
	};
}());

$.extend(freeboard, jQuery.eventEmitter);

// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
	var jsonDatasource = function (settings, updateCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;
		var errorStage = 0; 	// 0 = try standard request
		// 1 = try JSONP
		// 2 = try thingproxy.freeboard.io
		var lockErrorStage = false;

		function updateRefresh(refreshTime) {
			if (updateTimer) {
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function () {
				self.updateNow();
			}, refreshTime);
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function () {
			if ((errorStage > 1 && !currentSettings.use_thingproxy) || errorStage > 2) // We've tried everything, let's quit
			{
				return; // TODO: Report an error
			}

			var requestURL = currentSettings.url;

			if (errorStage == 2 && currentSettings.use_thingproxy) {
				requestURL = (location.protocol == "https:" ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(currentSettings.url);
			}

			var body = currentSettings.body;

			// Can the body be converted to JSON?
			if (body) {
				try {
					body = JSON.parse(body);
				}
				catch (e) {
				}
			}

			$.ajax({
				url: requestURL,
				dataType: (errorStage == 1) ? "JSONP" : "JSON",
				type: currentSettings.method || "GET",
				data: body,
				beforeSend: function (xhr) {
					try {
						_.each(currentSettings.headers, function (header) {
							var name = header.name;
							var value = header.value;

							if (!_.isUndefined(name) && !_.isUndefined(value)) {
								xhr.setRequestHeader(name, value);
							}
						});
					}
					catch (e) {
					}
				},
				success: function (data) {
					lockErrorStage = true;
					updateCallback(data);
				},
				error: function (xhr, status, error) {
					if (!lockErrorStage) {
						// TODO: Figure out a way to intercept CORS errors only. The error message for CORS errors seems to be a standard 404.
						errorStage++;
						self.updateNow();
					}
				}
			});
		}

		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			lockErrorStage = false;
			errorStage = 0;

			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
			self.updateNow();
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name: "JSON",
		settings: [
			{
				name: "url",
				display_name: "URL",
				type: "text"
			},
			{
				name: "use_thingproxy",
				display_name: "Try thingproxy",
				description: 'A direct JSON connection will be tried first, if that fails, a JSONP connection will be tried. If that fails, you can use thingproxy, which can solve many connection problems to APIs. <a href="https://github.com/Freeboard/thingproxy" target="_blank">More information</a>.',
				type: "boolean",
				default_value: true
			},
			{
				name: "refresh",
				display_name: "Refresh Every",
				type: "number",
				suffix: "seconds",
				default_value: 5
			},
			{
				name: "method",
				display_name: "Method",
				type: "option",
				options: [
					{
						name: "GET",
						value: "GET"
					},
					{
						name: "POST",
						value: "POST"
					},
					{
						name: "PUT",
						value: "PUT"
					},
					{
						name: "DELETE",
						value: "DELETE"
					}
				]
			},
			{
				name: "body",
				display_name: "Body",
				type: "text",
				description: "The body of the request. Normally only used if method is POST"
			},
			{
				name: "headers",
				display_name: "Headers",
				type: "array",
				settings: [
					{
						name: "name",
						display_name: "Name",
						type: "text"
					},
					{
						name: "value",
						display_name: "Value",
						type: "text"
					}
				]
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new jsonDatasource(settings, updateCallback));
		}
	});

	var openWeatherMapDatasource = function (settings, updateCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;

		function updateRefresh(refreshTime) {
			if (updateTimer) {
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function () {
				self.updateNow();
			}, refreshTime);
		}

		function toTitleCase(str) {
			return str.replace(/\w\S*/g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function () {
			$.ajax({
				url: "http://api.openweathermap.org/data/2.5/weather?APPID="+currentSettings.api_key+"&q=" + encodeURIComponent(currentSettings.location) + "&units=" + currentSettings.units,
				dataType: "JSONP",
				success: function (data) {
					// Rejigger our data into something easier to understand
					var newData = {
						place_name: data.name,
						sunrise: (new Date(data.sys.sunrise * 1000)).toLocaleTimeString(),
						sunset: (new Date(data.sys.sunset * 1000)).toLocaleTimeString(),
						conditions: toTitleCase(data.weather[0].description),
						current_temp: data.main.temp,
						high_temp: data.main.temp_max,
						low_temp: data.main.temp_min,
						pressure: data.main.pressure,
						humidity: data.main.humidity,
						wind_speed: data.wind.speed,
						wind_direction: data.wind.deg
					};

					updateCallback(newData);
				},
				error: function (xhr, status, error) {
				}
			});
		}

		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			self.updateNow();
			updateRefresh(currentSettings.refresh * 1000);
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name: "openweathermap",
		display_name: "Open Weather Map API",
		settings: [
			{
				name: "api_key",
				display_name: "API Key",
				type: "text",
				description: "Your personal API Key from Open Weather Map"
			},
            {
				name: "location",
				display_name: "Location",
				type: "text",
				description: "Example: London, UK"
			},
			{
				name: "units",
				display_name: "Units",
				type: "option",
				default: "imperial",
				options: [
					{
						name: "Imperial",
						value: "imperial"
					},
					{
						name: "Metric",
						value: "metric"
					}
				]
			},
			{
				name: "refresh",
				display_name: "Refresh Every",
				type: "number",
				suffix: "seconds",
				default_value: 5
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new openWeatherMapDatasource(settings, updateCallback));
		}
	});

	var dweetioDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;

		function onNewDweet(dweet) {
			updateCallback(dweet);
		}

		this.updateNow = function () {
			dweetio.get_latest_dweet_for(currentSettings.thing_id, function (err, dweet) {
				if (err) {
					//onNewDweet({});
				}
				else {
					onNewDweet(dweet[0].content);
				}
			});
		}

		this.onDispose = function () {

		}

		this.onSettingsChanged = function (newSettings) {
			dweetio.stop_listening_for(currentSettings.thing_id);

			currentSettings = newSettings;

			dweetio.listen_for(currentSettings.thing_id, function (dweet) {
				onNewDweet(dweet.content);
			});
		}

		self.onSettingsChanged(settings);
	};

	freeboard.loadDatasourcePlugin({
		"type_name": "dweet_io",
		"display_name": "Dweet.io",
		"external_scripts": [
			"http://dweet.io/client/dweet.io.min.js"
		],
		"settings": [
			{
				name: "thing_id",
				display_name: "Thing Name",
				"description": "Example: salty-dog-1",
				type: "text"
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new dweetioDatasource(settings, updateCallback));
		}
	});

	var playbackDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;
		var currentDataset = [];
		var currentIndex = 0;
		var currentTimeout;

		function moveNext() {
			if (currentDataset.length > 0) {
				if (currentIndex < currentDataset.length) {
					updateCallback(currentDataset[currentIndex]);
					currentIndex++;
				}

				if (currentIndex >= currentDataset.length && currentSettings.loop) {
					currentIndex = 0;
				}

				if (currentIndex < currentDataset.length) {
					currentTimeout = setTimeout(moveNext, currentSettings.refresh * 1000);
				}
			}
			else {
				updateCallback({});
			}
		}

		function stopTimeout() {
			currentDataset = [];
			currentIndex = 0;

			if (currentTimeout) {
				clearTimeout(currentTimeout);
				currentTimeout = null;
			}
		}

		this.updateNow = function () {
			stopTimeout();

			$.ajax({
				url: currentSettings.datafile,
				dataType: (currentSettings.is_jsonp) ? "JSONP" : "JSON",
				success: function (data) {
					if (_.isArray(data)) {
						currentDataset = data;
					}
					else {
						currentDataset = [];
					}

					currentIndex = 0;

					moveNext();
				},
				error: function (xhr, status, error) {
>>>>>>> 7e654fc75ebcdc780db2850eabcb9cfd9eb1edd2
				}
			};
			
			http.open("POST", api_url, true);
			http.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
			http.send(JSON.stringify(param));
		}
		else{
			window.localStorage.setItem("netpie.freeboard.dashboard", tmp_datasource);
			save_mode = 'no';
			last_saved = new Date().getTime();
		}
	}
}, 1000);

function DialogBox(a, b, c, d, e) {
    function f() {
        g.fadeOut(200, function() {
            $(this).remove()
        })
    }
    var g = $('<div id="modal_overlay" style="display:none;"></div>'),
        h = $('<div class="modal"></div>');
    h.append('<header><h2 class="title">' + b + "</h2></header>"), $("<section></section>").appendTo(h).append(a);
    var i = $("<footer></footer>").appendTo(h);
    c && $('<span id="dialog-ok" class="text-button">' + c + "</span>").appendTo(i).click(function() {
        var a = !1;
        _.isFunction(e) && (a = e()), a || f()
    }), d && $('<span id="dialog-cancel" class="text-button">' + d + "</span>").appendTo(i).click(function() {
        f()
    }), g.append(h), $("body").append(g), g.fadeIn(200)
}

function FreeboardModel(a, b, c) {
    var d = this,
        e = 1;
    this.version = 0, this.isEditing = ko.observable(!1), this.allow_edit = ko.observable(!1), this.allow_edit.subscribe(function(a) {
        a ? $("#main-header").show() : $("#main-header").hide()
    }), this.header_image = ko.observable(), this.plugins = ko.observableArray(), this.datasources = ko.observableArray(), this.panes = ko.observableArray(), this.datasourceData = {}, this.processDatasourceUpdate = function(a, b) {
        var c = a.name();
        d.datasourceData[c] = b, _.each(d.panes(), function(a) {
            _.each(a.widgets(), function(a) {
                a.processDatasourceUpdate(c)
            })
        }), this.saveLocalstorage()
    }, this._datasourceTypes = ko.observable(), this.datasourceTypes = ko.computed({
        read: function() {
            d._datasourceTypes()
            var b = [];
            return _.each(a, function(a) {
                var c = a.type_name,
                    d = c;
                _.isUndefined(a.display_name) || (d = a.display_name), b.push({
                    name: c,
                    display_name: d
                })
            }), b
        }
    }), this._widgetTypes = ko.observable(), this.widgetTypes = ko.computed({
        read: function() {
            d._widgetTypes()
            var a = [];
            return _.each(b, function(b) {
                var c = b.type_name,
                    d = c;
                _.isUndefined(b.display_name) || (d = b.display_name), a.push({
                    name: c,
                    display_name: d
                })
            }), a
        }
    }), this.addPluginSource = function(a) {
        a && -1 == d.plugins.indexOf(a) && d.plugins.push(a)
    }, this.serialize = function() {
        var a = [];
        _.each(d.panes(), function(b) {
            a.push(b.serialize())
        });
        var b = [];
        return _.each(d.datasources(), function(a) {
            b.push(a.serialize())
        }), {
            version: e,
            header_image: d.header_image(),
            allow_edit: d.allow_edit(),
            plugins: d.plugins(),
            panes: a,
            datasources: b,
            columns: c.getUserColumns()
        }
    }, this.deserialize = function(e, f) {
        function g() {
            c.setUserColumns(e.columns), _.isUndefined(e.allow_edit) ? d.allow_edit(!0) : d.allow_edit(e.allow_edit), d.version = e.version || 0, d.header_image(e.header_image), _.each(e.datasources, function(b) {
                var c = new DatasourceModel(d, a);
                c.deserialize(b), d.addDatasource(c)
            });
            var g = _.sortBy(e.panes, function(a) {
                return c.getPositionForScreenSize(a).row
            });
            _.each(g, function(a) {
                var c = new PaneModel(d, b);
                c.deserialize(a), d.panes.push(c)
            }), d.allow_edit() && 0 == d.panes().length && d.setEditing(!0), _.isFunction(f) && f(), c.processResize(!0)
        }
        d.clearDashboard(), _.each(e.plugins, function(a) {
            d.addPluginSource(a)
        }), _.isArray(e.plugins) && e.plugins.length > 0 ? head.js(e.plugins, function() {
            g()
        }) : g()
    }, this.clearFreeboard = function() {
        window.localStorage.removeItem("netpie.freeboard.dashboard");
        d.clearDashboard();
    }, this.clearDashboard = function() {
        c.removeAllPanes(), _.each(d.datasources(), function(a) {
            a.dispose()
        }), _.each(d.panes(), function(a) {
            a.dispose()
        }), d.plugins.removeAll(), d.datasources.removeAll(), d.panes.removeAll()
    }, this.loadDashboard = function(a, b) {
        c.showLoadingIndicator(!0), d.deserialize(a, function() {
            c.showLoadingIndicator(!1), _.isFunction(b) && b(), freeboard.emit("dashboard_loaded")
        })
    }, this.loadDashboardFromLocalFile = function() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var a = document.createElement("input");
            a.type = "file", $(a).on("change", function(a) {
                var b = a.target.files;
                if (b && b.length > 0) {
                    var c = b[0],
                        e = new FileReader;
                    e.addEventListener("load", function(a) {
                        var b = a.target,
                            c = JSON.parse(b.result);
                        
                        //update flags for save datasource
                        if(JSON.stringify(c) != cur_datasource){
                        	tmp_datasource = JSON.stringify(c);

                        	save_mode = save_mode == 'no' ? 'yes' : save_mode;
                        	
                       	}
                       	
                        d.loadDashboard(c), d.setEditing(!1)
                    }), e.readAsText(c)
                }
            }), $(a).trigger("click")
        } else
            alert("Unable to load a file in this browser.")
    }, this.saveDashboardClicked = function() {
        var a = $(event.currentTarget),
            b = a.data("siblings-shown") || !1;
        b ? $(event.currentTarget).siblings("label").fadeOut("slow") : $(event.currentTarget).siblings("label").fadeIn("slow"), a.data("siblings-shown", !b)
    }, this.saveDashboard = function(a, b) {
        var c = $(b.currentTarget).data("pretty"),
            e = "application/octet-stream",
            f = document.createElement("a");
        var g = new Blob([JSON.stringify(d.serialize())], {
            type: e
        });
        document.body.appendChild(f), f.href = window.URL.createObjectURL(g);
        $.get(f.href, function(data) {
            
            //update flags for save datasource
		      	if(data != cur_datasource){
		          tmp_datasource = data;

		          save_mode = save_mode == 'no' ? 'yes' : save_mode;
		     
		        }
        });
        if (c) {
            var g = new Blob([JSON.stringify(d.serialize(), null, " ")], {
                type: e
            });
            f.href = window.URL.createObjectURL(g);
            f.download = "dashboard.json", f.target = "_self", f.click();
        }
    }, this.saveDashboardOnly = function(a, b) {
        var c = $(b.currentTarget).data("pretty"),
            e = "application/octet-stream",
            f = document.createElement("a");
        var g = new Blob([JSON.stringify(d.serialize())], {
            type: e
        });
        document.body.appendChild(f), f.href = window.URL.createObjectURL(g);
        $.get(f.href, function(data) {
            
          //update flags for save datasource
          if(data != cur_datasource){
            tmp_datasource = data;
            
            save_mode = save_mode == 'no' ? 'yes' : save_mode;
            
          }
        });
    }, this.saveLocalstorage = function() {
        e = "application/octet-stream", f = document.createElement("a");
        var g = new Blob([JSON.stringify(d.serialize())], {
            type: e
        });
        document.body.appendChild(f), f.href = window.URL.createObjectURL(g);
        $.get(f.href, function(data) {
            //update flags for save datasource
		      	if(data != cur_datasource){
		          tmp_datasource = data;
		          
		          save_mode = save_mode == 'no' ? 'yes' : save_mode;
		          
		        }
        });
    }, this.addDatasource = function(a) {
        d.datasources.push(a)
    }, this.deleteDatasource = function(a) {
        delete d.datasourceData[a.name()], a.dispose(), d.datasources.remove(a), this.saveLocalstorage()
    }, this.createPane = function() {
        var a = new PaneModel(d, b);
        d.addPane(a)
    }, this.addGridColumnLeft = function() {
        c.addGridColumnLeft()
    }, this.addGridColumnRight = function() {
        c.addGridColumnRight()
    }, this.subGridColumnLeft = function() {
        c.subGridColumnLeft()
    }, this.subGridColumnRight = function() {
        c.subGridColumnRight()
    }, this.addPane = function(a) {
        d.panes.push(a)
    }, this.deletePane = function(a) {
        a.dispose(), d.panes.remove(a)
    }, this.deleteWidget = function(a) {
        ko.utils.arrayForEach(d.panes(), function(b) {
            b.widgets.remove(a)
        }), a.dispose()
    }, this.setEditing = function(a, b) {
        if (d.allow_edit() || !a) {
            d.isEditing(a), _.isUndefined(b) && (b = !0);
            var e = b ? 250 : 0,
                f = $("#admin-bar").outerHeight();
            a ? ($("#toggle-header-icon").addClass("icon-chevron-up").removeClass("icon-wrench"), $(".gridster .gs_w").css({
                cursor: "pointer"
            }), $("#main-header").animate({
                top: "0px"
            }, e), $("#board-content").animate({
                top: f + 20 + "px"
            }, e), $("#main-header").data().shown = !0, c.attachWidgetEditIcons($(".sub-section")), c.enableGrid()) : ($("#toggle-header-icon").addClass("icon-wrench").removeClass("icon-chevron-up"), $(".gridster .gs_w").css({
                cursor: "default"
            }), $("#main-header").animate({
                top: "-" + f + "px"
            }, e), $("#board-content").animate({
                top: "20"
            }, e), $("#main-header").data().shown = !1, $(".sub-section").unbind(), c.disableGrid()), c.showPaneEditIcons(a, b)
        }
    }, this.toggleEditing = function() {
        var a = !d.isEditing();
        d.setEditing(a);
    }
}

function FreeboardUI() {
    function a(a) {
        var b = e(),
            c = function() {};
        a && (c = function(a) {
            var c = this,
                d = ko.dataFor(c),
                e = q(d);
            $(c).attr("data-sizex", Math.min(d.col_width(), b, r.cols)).attr("data-row", e.row).attr("data-col", e.col), d.processSizeChange()
        }), f(Math.min(b, w)), g(c), d()
    }

    function b(a) {
        var b = r.cols + 1;
        f(b) && g(function() {
            var b, c = this,
                d = ko.dataFor(c),
                e = r.cols > 1 ? r.cols - 1 : 1,
                f = d.col[e],
                g = d.row[e];
            if (a) {
                leftPreviewCol = !0;
                var h = f < r.cols ? f + 1 : r.cols;
                b = {
                    row: g,
                    col: h
                }
            } else
                rightPreviewCol = !0, b = {
                    row: g,
                    col: f
                };
            $(c).attr("data-sizex", Math.min(d.col_width(), r.cols)).attr("data-row", b.row).attr("data-col", b.col)
        }), d(), w = r.cols
    }

    function c(a) {
        var b = r.cols - 1;
        f(b) && g(function() {
            var b, c = this,
                d = ko.dataFor(c),
                e = r.cols + 1,
                f = d.col[e],
                g = d.row[e];
            if (a) {
                var h = f > 1 ? f - 1 : 1;
                b = {
                    row: g,
                    col: h
                }
            } else {
                var h = f <= r.cols ? f : r.cols;
                b = {
                    row: g,
                    col: h
                }
            }
            $(c).attr("data-sizex", Math.min(d.col_width(), r.cols)).attr("data-row", b.row).attr("data-col", b.col)
        }), d(), w = r.cols
    }

    function d() {
        var a = $(".column-tool"),
            b = $("#board-content").width(),
            c = Math.floor(b / v);
        r.cols <= u ? a.addClass("min") : a.removeClass("min"), r.cols >= c ? a.addClass("max") : a.removeClass("max")
    }

    function e() {
        var a = $("#board-content").width()
        return Math.floor(a / v)
    }

    function f(a) {
        (void 0 === a || u > a) && (a = u);
        var b = e();
        a > b && (a = b);
        var c = v * a + a;
        return $(".responsive-column-width").css("max-width", c), a === r.cols ? !1 : !0
    }

    function g(a) {
        var b = r.$el;
        b.find("> li").unbind().removeData(), $(".responsive-column-width").css("width", ""), r.generate_grid_and_stylesheet(), b.find("> li").each(a), r.init(), $(".responsive-column-width").css("width", r.cols * t + r.cols * s * 2)
    }

    function h() {
        return w
    }

    function i(a) {
        w = Math.max(u, a)
    }

    function j(a, b, c) {
        var d = q(b),
            e = d.col,
            f = d.row,
            g = Number(b.width()),
            h = Number(b.getCalculatedHeight());
        r.add_widget(a, g, h, e, f), c && n(!0), l(b, f, e), $(a).attrchange({
            trackValues: !0,
            callback: function(a) {
                "data-row" == a.attributeName ? l(b, Number(a.newValue), void 0) : "data-col" == a.attributeName && l(b, void 0, Number(a.newValue))
            }
        })
    }

    function k(a, b) {
        var c = b.getCalculatedHeight(),
            d = Number($(a).attr("data-sizey")),
            e = Number($(a).attr("data-sizex"));
        (c != d || b.col_width() != e) && r.resize_widget($(a), b.col_width(), c, function() {
            r.set_dom_grid_height()
        })
    }

    function l(a, b, c) {
        var d = r.cols;
        _.isUndefined(b) || (a.row[d] = b), _.isUndefined(c) || (a.col[d] = c);
    }

    function m(a) {
        a ? x.fadeOut(0).appendTo("body").fadeIn(500) : x.fadeOut(500).remove()
    }

    function n(a, b) {
        _.isUndefined(b) && (b = !0);
        var c = b ? 250 : 0;
        a ? ($(".pane-tools").fadeIn(c), $("#column-tools").fadeIn(c)) : ($(".pane-tools").fadeOut(c), $("#column-tools").fadeOut(c))
    }

    function o(a) {
        $(a).hover(function() {
            p(this, !0)
        }, function() {
            p(this, !1)
        })
    }

    function p(a, b) {
        b ? $(a).find(".sub-section-tools").fadeIn(250) : $(a).find(".sub-section-tools").fadeOut(250)
    }

    function q(a) {
        var b = r.cols;
        if (_.isNumber(a.row) && _.isNumber(a.col)) {
            var c = {};
            c[b] = a.row, a.row = c, c = {}, c[b] = a.col, a.col = c
        }
        var d = 1,
            e = 1e3;
        for (var f in a.col) {
            if (f == b)
                return {
                    row: a.row[f],
                    col: a.col[f]
                };
            if (a.col[f] > b)
                d = b;
            else {
                var g = b - f;
                e > g && (d = f, e = g)
            }
        }
        return d in a.col && d in a.row ? {
            row: a.row[d],
            col: a.col[d]
        } : {
            row: 1,
            col: d
        }
    }
    var r, s = 10,
        t = 300,
        u = 3,
        v = s + t + s,
        w = u,
        x = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
    return ko.bindingHandlers.grid = {
        init: function(b, c, d, e, f) {
            r = $(b).gridster({
                widget_margins: [s, s],
                widget_base_dimensions: [t, 10],
                resize: {
                    enabled: !1,
                    axes: "x"
                }
            }).data("gridster"), a(!1), r.disable()
        }
    }, {
        showLoadingIndicator: function(a) {
            m(a)
        },
        showPaneEditIcons: function(a, b) {
            n(a, b)
        },
        attachWidgetEditIcons: function(a) {
            o(a)
        },
        getPositionForScreenSize: function(a) {
            return q(a)
        },
        processResize: function(b) {
            a(b)
        },
        disableGrid: function() {
            r.disable()
        },
        enableGrid: function() {
            r.enable()
        },
        addPane: function(a, b, c) {
            j(a, b, c)
        },
        updatePane: function(a, b) {
            k(a, b)
        },
        removePane: function(a) {
            r.remove_widget(a)
        },
        removeAllPanes: function() {
            r.remove_all_widgets()
        },
        addGridColumnLeft: function() {
            b(!0)
        },
        addGridColumnRight: function() {
            b(!1)
        },
        subGridColumnLeft: function() {
            c(!0)
        },
        subGridColumnRight: function() {
            c(!1)
        },
        getUserColumns: function() {
            return h()
        },
        setUserColumns: function(a) {
            i(a)
        }
    }
}

function PaneModel(a, b) {
    var c = this;
    this.title = ko.observable(), this.width = ko.observable(1), this.row = {}, this.col = {}, this.col_width = ko.observable(1), this.col_width.subscribe(function(a) {
        c.processSizeChange()
    }), this.widgets = ko.observableArray(), this.addWidget = function(a) {
        this.widgets.push(a)
    }, this.widgetCanMoveUp = function(a) {
        return c.widgets.indexOf(a) >= 1
    }, this.widgetCanMoveDown = function(a) {
        var b = c.widgets.indexOf(a);
        return b < c.widgets().length - 1
    }, this.moveWidgetUp = function(a) {
        if (c.widgetCanMoveUp(a)) {
            var b = c.widgets.indexOf(a),
                d = c.widgets();
            c.widgets.splice(b - 1, 2, d[b], d[b - 1])
        }
    }, this.moveWidgetDown = function(a) {
        if (c.widgetCanMoveDown(a)) {
            var b = c.widgets.indexOf(a),
                d = c.widgets();
            c.widgets.splice(b, 2, d[b + 1], d[b])
        }
    }, this.processSizeChange = function() {
        setTimeout(function() {
            _.each(c.widgets(), function(a) {
                a.processSizeChange()
            })
        }, 1e3)
    }, this.getCalculatedHeight = function() {
        var a = _.reduce(c.widgets(), function(a, b) {
            return a + b.height()
        }, 0);
        a *= 6, a += 3, a *= 10;
        var b = Math.ceil((a + 20) / 30);
        return Math.max(4, b)
    }, this.serialize = function() {
        var a = [];
        return _.each(c.widgets(), function(b) {
            a.push(b.serialize())
        }), {
            title: c.title(),
            width: c.width(),
            row: c.row,
            col: c.col,
            col_width: c.col_width(),
            widgets: a
        }
    }, this.deserialize = function(d) {
        c.title(d.title), c.width(d.width), c.row = d.row, c.col = d.col, c.col_width(d.col_width || 1), _.each(d.widgets, function(d) {
            var e = new WidgetModel(a, b);
            e.deserialize(d), c.widgets.push(e)
        })
    }, this.dispose = function() {
        _.each(c.widgets(), function(a) {
            a.dispose()
        })
    }
}

function WidgetModel(a, b) {
    function c() {
        _.isUndefined(d.widgetInstance) || (_.isFunction(d.widgetInstance.onDispose) && d.widgetInstance.onDispose(), d.widgetInstance = void 0)
    }
    var d = this;
    this.datasourceRefreshNotifications = {}, this.calculatedSettingScripts = {}, this.title = ko.observable(), this.fillSize = ko.observable(!1), this.type = ko.observable(), this.type.subscribe(function(a) {
        function e() {
            f.newInstance(d.settings(), function(a) {
                d.fillSize(f.fill_size === !0), d.widgetInstance = a, d.shouldRender(!0), d._heightUpdate.valueHasMutated()
            })
        }
        if (c(), a in b && _.isFunction(b[a].newInstance)) {
            var f = b[a];
            f.external_scripts ? head.js(f.external_scripts.slice(0), e) : e()
        }
    }), this.settings = ko.observable({}), this.settings.subscribe(function(a) {
        !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.onSettingsChanged) && d.widgetInstance.onSettingsChanged(a), d.updateCalculatedSettings(), d._heightUpdate.valueHasMutated()
    }), this.processDatasourceUpdate = function(a) {
        var b = d.datasourceRefreshNotifications[a];
        _.isArray(b) && _.each(b, function(a) {
            d.processCalculatedSetting(a)
        })
    }, this.callValueFunction = function(b) {
        return b.call(void 0, a.datasourceData)
    }, this.processSizeChange = function() {
        !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.onSizeChanged) && d.widgetInstance.onSizeChanged()
    }, this.processCalculatedSetting = function(a) {
        if (_.isFunction(d.calculatedSettingScripts[a])) {
            var b = void 0;
            try {
                b = d.callValueFunction(d.calculatedSettingScripts[a])
            } catch (c) {
                var e = d.settings()[a];
                c instanceof ReferenceError && /^\w+$/.test(e) && (b = e)
            }
            if (!_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.onCalculatedValueChanged) && !_.isUndefined(b))
                try {
                    d.widgetInstance.onCalculatedValueChanged(a, b)
                } catch (c) {
                    console.log(c.toString())
                }
        }
    }, this.updateCalculatedSettings = function() {
        if (d.datasourceRefreshNotifications = {}, d.calculatedSettingScripts = {}, !_.isUndefined(d.type())) {
            var a = b[d.type()].settings,
                c = new RegExp("datasources.([\\w_-]+)|datasources\\[['\"]([^'\"]+)", "g"),
                e = d.settings();
            _.each(a, function(a) {
                if ("calculated" == a.type) {
                    var b = e[a.name];
                    if (!_.isUndefined(b)) {
                        _.isArray(b) && (b = "[" + b.join(",") + "]"), (b.match(/;/g) || []).length <= 1 && -1 == b.indexOf("return") && (b = "return " + b);
                        var f;
                        try {
                            f = new Function("datasources", b)
                        } catch (g) {
                            var h = e[a.name].replace(/"/g, '\\"').replace(/[\r\n]/g, " \\\n");
                            f = new Function("datasources", 'return "' + h + '";')
                        }
                        d.calculatedSettingScripts[a.name] = f, d.processCalculatedSetting(a.name);
                        for (var i; i = c.exec(b);) {
                            var j = i[1] || i[2],
                                k = d.datasourceRefreshNotifications[j];
                            _.isUndefined(k) && (k = [], d.datasourceRefreshNotifications[j] = k), -1 == _.indexOf(k, a.name) && k.push(a.name)
                        }
                    }
                }
            })
        }
    }, this._heightUpdate = ko.observable(), this.height = ko.computed({
        read: function() {
            return d._heightUpdate(), !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.getHeight) ? d.widgetInstance.getHeight() : 1
        }
    }), this.shouldRender = ko.observable(!1), this.render = function(a) {
        d.shouldRender(!1), !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.render) && (d.widgetInstance.render(a), d.updateCalculatedSettings())
    }, this.dispose = function() {}, this.serialize = function() {
        return {
            title: d.title(),
            type: d.type(),
            settings: d.settings()
        }
    }, this.deserialize = function(a) {
        d.title(a.title), d.settings(a.settings), d.type(a.type)
    }
}
DatasourceModel = function(a, b) {
        function c() {
            _.isUndefined(d.datasourceInstance) || (_.isFunction(d.datasourceInstance.onDispose) && d.datasourceInstance.onDispose(), d.datasourceInstance = void 0)
        }
        var d = this;
        this.name = ko.observable(), this.latestData = ko.observable(), this.settings = ko.observable({}), this.settings.subscribe(function(a) {
            !_.isUndefined(d.datasourceInstance) && _.isFunction(d.datasourceInstance.onSettingsChanged) && d.datasourceInstance.onSettingsChanged(a)
        }), this.updateCallback = function(b) {
            a.processDatasourceUpdate(d, b), d.latestData(b);
            var c = new Date;
            d.last_updated(c.toLocaleTimeString())
        }, this.type = ko.observable(), this.type.subscribe(function(a) {
            function e() {
                f.newInstance(d.settings(), function(a) {
                    d.datasourceInstance = a, a.updateNow()
                }, d.updateCallback)
            }
            if (c(), a in b && _.isFunction(b[a].newInstance)) {
                var f = b[a];
                f.external_scripts ? head.js(f.external_scripts.slice(0), e) : e()
            }
        }), this.last_updated = ko.observable("never"), this.last_error = ko.observable(), this.serialize = function() {
            return {
                name: d.name(),
                type: d.type(),
                settings: d.settings()
            }
        }, this.deserialize = function(a) {
            d.settings(a.settings), d.name(a.name), d.type(a.type)
        }, this.getDataRepresentation = function(a) {
            var b = new Function("data", "return " + a + ";");
            return b.call(void 0, d.latestData())
        }, this.updateNow = function() {
            !_.isUndefined(d.datasourceInstance) && _.isFunction(d.datasourceInstance.updateNow) && d.datasourceInstance.updateNow()
        }, this.dispose = function() {
            c()
        }
    }, DeveloperConsole = function(a) {
        function b() {
            function b(a) {
                var b = $("<tr></tr>"),
                    d = $('<ul class="board-toolbar"></ul>'),
                    e = $('<input class="table-row-value" style="width:100%;" type="text">'),
                    f = $('<li><i class="icon-trash icon-white"></i></li>').click(function(a) {
                        c = _.without(c, e), b.remove()
                    });
                c.push(e), a && e.val(a), d.append(f), g.append(b.append($("<td></td>").append(e)).append($('<td class="table-row-operation">').append(d)))
            }
            var c = [],
                d = $("<div></div>"),
                e = $('<div class="table-operation text-button">ADD</div>'),
                f = $('<table class="table table-condensed sub-table"></table>');
            f.append($('<thead style=""><tr><th>Plugin Script URL</th></tr></thead>'));
            var g = $("<tbody></tbody>");
            f.append(g), d.append($("<p>Here you can add references to other scripts to load datasource or widget plugins.</p>")).append(f).append(e).append('<p>To learn how to build plugins for freeboard, please visit <a target="_blank" href="http://freeboard.github.io/freeboard/docs/plugin_example.html">http://freeboard.github.io/freeboard/docs/plugin_example.html</a></p>'), _.each(a.plugins(), function(a) {
                b(a)
            }), e.click(function(a) {
                b()
            }), new DialogBox(d, "Developer Console", "OK", null, function() {
                _.each(a.plugins(), function(a) {
                    $('script[src^="' + a + '"]').remove()
                }), a.plugins.removeAll(), _.each(c, function(b) {
                    var c = b.val();
                    c && c.length > 0 && (a.addPluginSource(c), head.js(c + "?" + Date.now()))
                })
            })
        }
        return {
            showDeveloperConsole: function() {
                b()
            }
        }
    }, JSEditor = function() {
        function a(a) {
            c = a
        }

        function b(a, b) {
            var c = '// Example: Convert temp from C to F and truncate to 2 decimal places.\n// return (datasources["MyDatasource"].sensor.tempInF * 1.8 + 32).toFixed(2);';
            a || (a = c);
            var d = $('<div class="code-window"></div>'),
                e = $('<div class="code-mirror-wrapper"></div>'),
                f = $('<div class="code-window-footer"></div>'),
                g = $('<div class="code-window-header cm-s-ambiance">This javascript will be re-evaluated any time a datasource referenced here is updated, and the value you <code><span class="cm-keyword">return</span></code> will be displayed in the widget. You can assume this javascript is wrapped in a function of the form <code><span class="cm-keyword">function</span>(<span class="cm-def">datasources</span>)</code> where datasources is a collection of javascript objects (keyed by their name) corresponding to the most current data in a datasource.</div>');
            d.append([g, e, f]), $("body").append(d);
            var h = CodeMirror(e.get(0), {
                    value: a,
                    mode: "javascript",
                    theme: "ambiance",
                    indentUnit: 4,
                    lineNumbers: !0,
                    matchBrackets: !0,
                    autoCloseBrackets: !0
                }),
                i = $('<span id="dialog-cancel" class="text-button">Close</span>').click(function() {
                    if (b) {
                        var a = h.getValue();
                        a === c && (a = ""), b(a), d.remove()
                    }
                });
            f.append(i)
        }
        var c = "";
        return {
            displayJSEditor: function(a, c) {
                b(a, c)
            },
            setAssetRoot: function(b) {
                a(b)
            }
        }
    }, PluginEditor = function(a, b) {
        function c(a, b) {
            var c = $('<div class="validation-error"></div>').html(b);
            $("#setting-value-container-" + a).append(c)
        }

        function d() {
            $("#setting-row-instance-name").length ? $("#setting-row-instance-name").nextAll().remove() : $("#setting-row-plugin-types").nextAll().remove()
        }

        function e(a) {
            return !isNaN(parseFloat(a)) && isFinite(a)
        }

        function f(c, d, e, f, g) {
            var h = $("<textarea></textarea>");
            e.multi_input ? h.change(function() {
                var a = [];
                $(c).find("textarea").each(function() {
                    var b = $(this).val();
                    b && (a = a.concat(b))
                }), d.settings[e.name] = a
            }) : h.change(function() {
                d.settings[e.name] = $(this).val()
            }), f && h.val(f), b.createValueEditor(h);
            var i = $('<ul class="board-toolbar datasource-input-suffix"></ul>'),
                j = $('<div class="calculated-setting-row"></div>');
            j.append(h).append(i);
            var k = $('<li><i class="icon-plus icon-white"></i><label>DATASOURCE</label></li>').mousedown(function(a) {
                a.preventDefault(), $(h).val("").focus().insertAtCaret('datasources["').trigger("freeboard-eval")
            });
            i.append(k);
            var l = $('<li><i class="icon-fullscreen icon-white"></i><label>.JS EDITOR</label></li>').mousedown(function(b) {
                b.preventDefault(), a.displayJSEditor(h.val(), function(a) {
                    h.val(a), h.change()
                })
            });
            if (i.append(l), g) {
                var m = $('<li class="remove-setting-row"><i class="icon-minus icon-white"></i><label></label></li>').mousedown(function(a) {
                    a.preventDefault(), j.remove(), $(c).find("textarea:first").change()
                });
                i.prepend(m)
            }
            $(c).append(j)
        }

        function g(a, b, g, h, i) {
            function j(a, b) {
                var c = $('<div id="setting-row-' + a + '" class="form-row"></div>').appendTo(n);
                return c.append('<div class="form-label"><label class="control-label">' + b + "</label></div>"), $('<div id="setting-value-container-' + a + '" class="form-value"></div>').appendTo(c)
            }

            function k(a, b, c) {
                _.each(a, function(a) {
                    function d() {
                        m.settings[a.name].length > 0 ? n.show() : n.hide()
                    }

                    function e(b) {
                        var c = $("<tr></tr>").appendTo(p),
                            e = {};
                        _.isArray(m.settings[a.name]) || (m.settings[a.name] = []), m.settings[a.name].push(e), _.each(a.settings, function(a) {
                            var d = $("<td></td>").appendTo(c),
                                f = "";
                            _.isUndefined(b[a.name]) || (f = b[a.name]), e[a.name] = f, $('<input class="table-row-value" type="text">').appendTo(d).val(f).change(function() {
                                e[a.name] = $(this).val()
                            })
                        }), c.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($("<li></li>").append($('<i class="icon-trash icon-white"></i>').click(function() {
                            var b = m.settings[a.name].indexOf(e); - 1 != b && (m.settings[a.name].splice(b, 1), c.remove(), d())
                        }))))), k.scrollTop(k[0].scrollHeight), d()
                    }!_.isUndefined(a.default_value) && _.isUndefined(h[a.name]) && (h[a.name] = a.default_value);
                    var g = a.name;
                    _.isUndefined(a.display_name) || (g = a.display_name);
                    var i = j(a.name, g);
                    switch (a.type) {
                        case "array":
                            var k = $('<div class="form-table-value-subtable"></div>').appendTo(i),
                                l = $('<table class="table table-condensed sub-table"></table>').appendTo(k),
                                n = $("<thead></thead>").hide().appendTo(l),
                                o = $("<tr></tr>").appendTo(n),
                                p = $("<tbody></tbody>").appendTo(l),
                                q = [];
                            _.each(a.settings, function(a) {
                                var b = a.name;
                                _.isUndefined(a.display_name) || (b = a.display_name), $("<th>" + b + "</th>").appendTo(o)
                            }), a.name in h && (q = h[a.name]), $('<div class="table-operation text-button">ADD</div>').appendTo(i).click(function() {
                                var b = {};
                                _.each(a.settings, function(a) {
                                    b[a.name] = ""
                                }), e(b)
                            }), _.each(q, function(a, b) {
                                e(a)
                            });
                            break;
                        case "boolean":
                            m.settings[a.name] = h[a.name];
                            var r = $('<div class="onoffswitch"><label class="onoffswitch-label" for="' + a.name + '-onoff"><div class="onoffswitch-inner"><span class="on">YES</span><span class="off">NO</span></div><div class="onoffswitch-switch"></div></label></div>').appendTo(i),
                                s = $('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + a.name + '-onoff">').prependTo(r).change(function() {
                                    m.settings[a.name] = this.checked
                                });
                            a.name in h && s.prop("checked", h[a.name]);
                            break;
                        case "option":
                            var t = h[a.name],
                                s = $("<select></select>").appendTo($('<div class="styled-select"></div>').appendTo(i)).change(function() {
                                    m.settings[a.name] = $(this).val()
                                });
                            _.each(a.options, function(a) {
                                var b, c;
                                _.isObject(a) ? (b = a.name, c = a.value) : b = a, _.isUndefined(c) && (c = b), _.isUndefined(t) && (t = c), $("<option></option>").text(b).attr("value", c).appendTo(s)
                            }), m.settings[a.name] = t, a.name in h && s.val(h[a.name]);
                            break;
                        default:
                            if (m.settings[a.name] = h[a.name], "calculated" == a.type) {
                                if (a.name in h) {
                                    var u = h[a.name];
                                    if (a.multi_input && _.isArray(u))
                                        for (var v = !1, w = 0; w < u.length; w++)
                                            f(i, m, a, u[w], v), v = !0;
                                    else
                                        f(i, m, a, u, !1)
                                } else
                                    f(i, m, a, null, !1);
                                if (a.multi_input) {
                                    var x = $('<ul class="board-toolbar"><li class="add-setting-row"><i class="icon-plus icon-white"></i><label>ADD</label></li></ul>').mousedown(function(b) {
                                        b.preventDefault(), f(i, m, a, null, !0)
                                    });
                                    $(i).siblings(".form-label").append(x)
                                }
                            } else {
                                var s = $('<input type="text">').appendTo(i).change(function() {
                                    "number" == a.type ? m.settings[a.name] = Number($(this).val()) : m.settings[a.name] = $(this).val()
                                });
                                if (a.name in h && s.val(h[a.name]), b && a.typeahead_data_field && s.addClass("typeahead_data_field-" + a.typeahead_data_field), b && a.typeahead_field) {
                                    var y = [];
                                    s.keyup(function(a) {
                                        a.which >= 65 && a.which <= 91 && s.trigger("change")
                                    }), $(s).autocomplete({
                                        source: y,
                                        select: function(a, b) {
                                            s.val(b.item.value), s.trigger("change")
                                        }
                                    }), s.change(function(d) {
                                        var e = s.val(),
                                            f = _.template(b)({
                                                input: e
                                            });
                                        $.get(f, function(b) {
                                            if (c && (b = b[c]), b = _.select(b, function(b) {
                                                    return b[a.typeahead_field][0] == e[0]
                                                }), y = _.map(b, function(b) {
                                                    return b[a.typeahead_field]
                                                }), $(s).autocomplete("option", "source", y), 1 == b.length) {
                                                b = b[0];
                                                for (var d in b)
                                                    if (b.hasOwnProperty(d)) {
                                                        var f = $(_.template("input.typeahead_data_field-<%= field %>")({
                                                            field: d
                                                        }));
                                                        f && (f.val(b[d]), f.val() != s.val() && f.trigger("change"))
                                                    }
                                            }
                                        })
                                    })
                                }
                            }
                    }
                    _.isUndefined(a.suffix) || i.append($('<div class="input-suffix">' + a.suffix + "</div>")), _.isUndefined(a.description) || i.append($('<div class="setting-description">' + a.description + "</div>"))
                })
            }
            var l, m = {
                    type: g,
                    settings: {}
                },
                n = $("<div></div>"),
                o = $('<div id="plugin-description"></div>').hide();
            n.append(o), new DialogBox(n, a, "Save", "Cancel", function() {
                $(".validation-error").remove();
                for (var a = 0; a < l.settings.length; a++) {
                    var b = l.settings[a];
                    if (b.required && (_.isUndefined(m.settings[b.name]) || "" == m.settings[b.name]))
                        return c(b.name, "This is required."), !0;
                    if ("integer" == b.type && m.settings[b.name] % 1 !== 0)
                        return c(b.name, "Must be a whole number."), !0;
                    if ("number" == b.type && !e(m.settings[b.name]))
                        return c(b.name, "Must be a number."), !0
                }
                _.isFunction(i) && i(m)
            });
            var p, q = _.keys(b);
            if (q.length > 1) {
                var r = j("plugin-types", "Type");
                p = $("<select></select>").appendTo($('<div class="styled-select"></div>').appendTo(r)), p.append($("<option>Select a type...</option>").attr("value", "undefined")), _.each(b, function(a) {
                    p.append($("<option></option>").text(a.display_name).attr("value", a.type_name))
                }), p.change(function() {
                    m.type = $(this).val(), m.settings = {}, d(), l = b[p.val()], _.isUndefined(l) ? ($("#setting-row-instance-name").hide(), $("#dialog-ok").hide()) : ($("#setting-row-instance-name").show(), l.description && l.description.length > 0 ? o.html(l.description).show() : o.hide(), $("#dialog-ok").show(), k(l.settings, l.typeahead_source, l.typeahead_data_segment))
                })
            } else
                1 == q.length && (l = b[q[0]], m.type = l.type_name, m.settings = {}, k(l.settings));
            p && (_.isUndefined(g) ? ($("#setting-row-instance-name").hide(), $("#dialog-ok").hide()) : ($("#dialog-ok").show(), p.val(g).trigger("change")))
        }
        return {
            createPluginEditor: function(a, b, c, d, e, f) {
                g(a, b, c, d, e, f)
            }
        }
    }, ValueEditor = function(a) {
        function b(a, b) {
            return _.isArray(a) || _.isObject(a) ? !0 : c(a, b)
        }

        function c(a, b) {
            switch (b) {
                case o.ANY:
                    return !0;
                case o.ARRAY:
                    return _.isArray(a);
                case o.OBJECT:
                    return _.isObject(a);
                case o.STRING:
                    return _.isString(a);
                case o.NUMBER:
                    return _.isNumber(a);
                case o.BOOLEAN:
                    return _.isBoolean(a)
            }
        }

        function d(a, b) {
            $(a).parent().find(".validation-error").remove(), c(n, b) || $(a).parent().append("<div class='validation-error'>This field expects an expression that evaluates to type " + b + ".</div>")
        }

        function e(a) {
            var b = ($(a).val().match(/\n/g) || []).length,
                c = Math.min(200, 20 * (b + 1));
            $(a).css({
                height: c + "px"
            })
        }

        function f(a, c, d) {
            var e = j.exec(a),
                f = [];
            if (e)
                if ("" == e[1])
                    _.each(c, function(a) {
                        f.push({
                            value: a.name(),
                            entity: void 0,
                            precede_char: "",
                            follow_char: '"]'
                        })
                    });
                else if ("" != e[1] && _.isUndefined(e[2])) {
                var g = e[1];
                _.each(c, function(a) {
                    var b = a.name();
                    b != g && 0 == b.indexOf(g) && f.push({
                        value: b,
                        entity: void 0,
                        precede_char: "",
                        follow_char: '"]'
                    })
                })
            } else {
                var h = _.find(c, function(a) {
                    return a.name() === e[1]
                });
                if (!_.isUndefined(h)) {
                    var i = "data",
                        k = "";
                    if (!_.isUndefined(e[2])) {
                        var l = e[3].lastIndexOf("]") + 1;
                        i += e[3].substring(0, l), k = e[3].substring(l, e[3].length), k = k.replace(/^[\[\"]*/, ""), k = k.replace(/[\"\]]*$/, "")
                    }
                    var o = h.getDataRepresentation(i);
                    if (n = o, _.isArray(o)) {
                        for (var p = 0; p < o.length; p++)
                            if (0 == p.toString().indexOf(k)) {
                                var q = o[p];
                                b(q, d) && f.push({
                                    value: p,
                                    entity: q,
                                    precede_char: "[",
                                    follow_char: "]",
                                    preview: q.toString()
                                })
                            }
                    } else
                        _.isObject(o) && _.each(o, function(a, c) {
                            0 == c.indexOf(k) && b(a, d) && f.push({
                                value: c,
                                entity: a,
                                precede_char: '["',
                                follow_char: '"]'
                            })
                        })
                }
            }
            m = f
        }

        function g(b, c) {
            var e = $(b).val().substring(0, $(b).getCaretPosition());
            if (e = e.replace(String.fromCharCode(160), " "), f(e, a.datasources(), c), m.length > 0) {
                k || (k = $('<ul id="value-selector" class="value-dropdown"></ul>').insertAfter(b).width($(b).outerWidth() - 2).css("left", $(b).position().left).css("top", $(b).position().top + $(b).outerHeight() - 1)), k.empty(), k.scrollTop(0);
                var g = !0;
                l = 0, _.each(m, function(a, c) {
                    var d = h(b, e, a, c);
                    g && ($(d).addClass("selected"), g = !1)
                })
            } else
                d(b, c), $(b).next("ul#value-selector").remove(), k = null, l = -1
        }

        function h(a, b, c, d) {
            var e = c.value;
            c.preview && (e = e + "<span class='preview'>" + c.preview + "</span>");
            var f = $("<li>" + e + "</li>").appendTo(k).mouseenter(function() {
                $(this).trigger("freeboard-select")
            }).mousedown(function(a) {
                $(this).trigger("freeboard-insertValue"), a.preventDefault()
            }).data("freeboard-optionIndex", d).data("freeboard-optionValue", c.value).bind("freeboard-insertValue", function() {
                var d = c.value;
                d = c.precede_char + d + c.follow_char;
                var e = b.lastIndexOf("]"); - 1 != e ? $(a).replaceTextAt(e + 1, $(a).val().length, d) : $(a).insertAtCaret(d), n = c.entity, $(a).triggerHandler("mouseup")
            }).bind("freeboard-select", function() {
                $(this).parent().find("li.selected").removeClass("selected"), $(this).addClass("selected"), l = $(this).data("freeboard-optionIndex")
            });
            return f
        }

        function i(a, b) {
            $(a).addClass("calculated-value-input").bind("keyup mouseup freeboard-eval", function(c) {
                return !k || "keyup" != c.type || 38 != c.keyCode && 40 != c.keyCode && 13 != c.keyCode ? void g(a, b) : void c.preventDefault()
            }).focus(function() {
                $(a).css({
                    "z-index": 3001
                }), e(a)
            }).focusout(function() {
                d(a, b), $(a).css({
                    height: "",
                    "z-index": 3e3
                }), $(a).next("ul#value-selector").remove(), k = null, l = -1
            }).bind("keydown", function(a) {
                if (k)
                    if (38 == a.keyCode || 40 == a.keyCode) {
                        a.preventDefault();
                        var b = $(k).find("li");
                        38 == a.keyCode ? l-- : 40 == a.keyCode && l++, 0 > l ? l = b.size() - 1 : l >= b.size() && (l = 0);
                        var c = $(b).eq(l);
                        c.trigger("freeboard-select"), $(k).scrollTop($(c).position().top)
                    } else
                        13 == a.keyCode && (a.preventDefault(), -1 != l && $(k).find("li").eq(l).trigger("freeboard-insertValue"))
            })
        }
        var j = new RegExp('.*datasources\\["([^"]*)("\\])?(.*)$'),
            k = null,
            l = 0,
            m = [],
            n = null,
            o = {
                ANY: "any",
                ARRAY: "array",
                OBJECT: "object",
                STRING: "string",
                NUMBER: "number",
                BOOLEAN: "boolean"
            };
        return {
            createValueEditor: function(a, b) {
                b ? i(a, b) : i(a, o.ANY)
            },
            EXPECTED_TYPE: o
        }
    },
    function(a) {
        function b() {
            var a = document.createElement("p"),
                b = !1;
            if (a.addEventListener)
                a.addEventListener("DOMAttrModified", function() {
                    b = !0
                }, !1);
            else {
                if (!a.attachEvent)
                    return !1;
                a.attachEvent("onDOMAttrModified", function() {
                    b = !0
                })
            }
            return a.setAttribute("id", "target"), b
        }

        function c(b, c) {
            if (b) {
                var d = this.data("attr-old-value");
                if (c.attributeName.indexOf("style") >= 0) {
                    d.style || (d.style = {});
                    var e = c.attributeName.split(".");
                    c.attributeName = e[0], c.oldValue = d.style[e[1]], c.newValue = e[1] + ":" + this.prop("style")[a.camelCase(e[1])], d.style[e[1]] = c.newValue
                } else
                    c.oldValue = d[c.attributeName], c.newValue = this.attr(c.attributeName), d[c.attributeName] = c.newValue;
                this.data("attr-old-value", d)
            }
        }
        var d = window.MutationObserver || window.WebKitMutationObserver;
        a.fn.attrchange = function(e) {
            var f = {
                trackValues: !1,
                callback: a.noop
            };
            if ("function" == typeof e ? f.callback = e : a.extend(f, e), f.trackValues && a(this).each(function(b, c) {
                    for (var d, e = {}, b = 0, f = c.attributes, g = f.length; g > b; b++)
                        d = f.item(b), e[d.nodeName] = d.value;
                    a(this).data("attr-old-value", e)
                }), d) {
                var g = {
                        subtree: !1,
                        attributes: !0,
                        attributeOldValue: f.trackValues
                    },
                    h = new d(function(b) {
                        b.forEach(function(b) {
                            var c = b.target;
                            f.trackValues && (b.newValue = a(c).attr(b.attributeName)), f.callback.call(c, b)
                        })
                    });
                return this.each(function() {
                    h.observe(this, g)
                })
            }
            return b() ? this.on("DOMAttrModified", function(a) {
                a.originalEvent && (a = a.originalEvent), a.attributeName = a.attrName, a.oldValue = a.prevValue, f.callback.call(this, a)
            }) : "onpropertychange" in document.body ? this.on("propertychange", function(b) {
                b.attributeName = window.event.propertyName, c.call(a(this), f.trackValues, b), f.callback.call(this, b)
            }) : this
        }
    }
    (jQuery),
    function(a) {
        a.eventEmitter = {
            _JQInit: function() {
                this._JQ = a(this)
            },
            emit: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.trigger(a, b)
            },
            once: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.one(a, b)
            },
            on: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.bind(a, b)
            },
            off: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.unbind(a, b)
            }
        }
    }
    (jQuery);
var freeboard = function() {
        function a(a) {
            a = a.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var b = new RegExp("[\\?&]" + a + "=([^&#]*)"),
                c = b.exec(location.search);
            return null == c ? "" : decodeURIComponent(c[1].replace(/\+/g, " "))
        }
        var b = {},
            c = {},
            d = new FreeboardUI,
            e = new FreeboardModel(b, c, d),
            f = new JSEditor,
            g = new ValueEditor(e),
            h = new PluginEditor(f, g),
            i = new DeveloperConsole(e),
            j = {
                values: {
                    "font-family": '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif',
                    color: "#d3d4d4",
                    "font-weight": 100
                }
            };
        return ko.bindingHandlers.pluginEditor = {
            init: function(a, f, g, i, j) {
                var k = ko.unwrap(f()),
                    l = {},
                    m = void 0,
                    n = "";
                "datasource" == k.type ? (l = b, n = "Datasource") : "widget" == k.type ? (l = c, n = "Widget") : "pane" == k.type && (n = "Pane"), $(a).click(function(f) {
                    if ("delete" == k.operation) {
                        var g = $("<p>Are you sure you want to delete this " + n + "?</p>");
                        new DialogBox(g, "Confirm Delete", "Yes", "No", function() {
                            "datasource" == k.type ? e.deleteDatasource(i) : "widget" == k.type ? e.deleteWidget(i) : "pane" == k.type && e.deletePane(i)
                        })
                        e.saveLocalstorage();
                    } else {
                        var j = void 0;
                        "datasource" == k.type ? "add" == k.operation ? m = {} : (j = i.type(), m = i.settings(), m.name = i.name()) : "widget" == k.type ? "add" == k.operation ? m = {} : (j = i.type(), m = i.settings()) : "pane" == k.type && (m = {}, "edit" == k.operation && (m.title = i.title(), m.col_width = i.col_width()), l = {
                            settings: {
                                settings: [{
                                    name: "title",
                                    display_name: "Title",
                                    type: "text"
                                }, {
                                    name: "col_width",
                                    display_name: "Columns",
                                    type: "integer",
                                    default_value: 1,
                                    required: !0
                                }]
                            }
                        }), h.createPluginEditor(n, l, j, m, function(f) {
                            if ("add" == k.operation) {
                                if ("datasource" == k.type) {
                                    var g = new DatasourceModel(e, b);
                                    e.addDatasource(g), g.name(f.settings.name), delete f.settings.name, g.settings(f.settings), g.type(f.type)
                                } else if ("widget" == k.type) {
                                    var g = new WidgetModel(e, c);
                                    g.settings(f.settings), g.type(f.type), i.widgets.push(g), d.attachWidgetEditIcons(a)
                                }
                            } else {
                                "edit" == k.operation && ("pane" == k.type ? (i.title(f.settings.title), i.col_width(f.settings.col_width), d.processResize(!1)) : ("datasource" == k.type && (i.name(f.settings.name), delete f.settings.name), i.type(f.type), i.settings(f.settings)))
                            }
                            e.saveLocalstorage();
                        })
                        e.saveLocalstorage();
                    }
                })
            }
        }, ko.virtualElements.allowedBindings.datasourceTypeSettings = !0, ko.bindingHandlers.datasourceTypeSettings = {
            update: function(a, b, c, d, e) {
                processPluginSettings(a, b, c, d, e);
                e.saveLocalstorage();
            }
        }, ko.bindingHandlers.pane = {
            init: function(a, b, c, f, g) {
                e.isEditing() && $(a).css({
                    cursor: "pointer"
                }), d.addPane(a, f, g.$root.isEditing());
                e.saveLocalstorage();
            },
            update: function(a, b, c, f, g) {
                -1 == e.panes.indexOf(f) && d.removePane(a), d.updatePane(a, f);
                e.saveLocalstorage();
            }
        }, ko.bindingHandlers.widget = {
            init: function(a, b, c, f, g) {
                e.isEditing() && d.attachWidgetEditIcons($(a).parent()) && e.saveLocalstorage()
            },
            update: function(a, b, c, d, e) {
                d.shouldRender() && ($(a).empty(), d.render(a)) && e.saveLocalstorage()
            }
        }, $(function() {
            function a() {
                d.processResize(!0), e.saveLocalstorage();
            }
            d.showLoadingIndicator(!0);
            var b;
            $(window).resize(function() {
                clearTimeout(b), b = setTimeout(a, 500)
            })
        }), {
            initialize: function(b, c) {
                ko.applyBindings(e);
                var f = a("load");
                "" != f ? $.ajax({
                    url: f,
                    success: function(a) {
                        e.loadDashboard(a), _.isFunction(c) && c()
                    }
                }) : (e.allow_edit(b), e.setEditing(b), d.showLoadingIndicator(!1), _.isFunction(c) && c(), freeboard.emit("initialized"))
            },
            newDashboard: function() {
                e.loadDashboard({
                    allow_edit: !0
                })
            },
            loadDashboard: function(a, b) {
                e.loadDashboard(a, b)
            },
            serialize: function() {
                return e.serialize()
            },
            setEditing: function(a, b) {
                e.setEditing(a, b)
            },
            isEditing: function() {
                return e.isEditing()
            },
            loadDatasourcePlugin: function(a) {
                _.isUndefined(a.display_name) && (a.display_name = a.type_name), a.settings.unshift({
                    name: "name",
                    display_name: "Name",
                    type: "text",
                    required: !0
                }), e.addPluginSource(a.source), b[a.type_name] = a, e._datasourceTypes.valueHasMutated()
            },
            resize: function() {
                d.processResize(!0)
            },
            loadWidgetPlugin: function(a) {
                _.isUndefined(a.display_name) && (a.display_name = a.type_name), e.addPluginSource(a.source), c[a.type_name] = a, e._widgetTypes.valueHasMutated()
            },
            setAssetRoot: function(a) {
                f.setAssetRoot(a)
            },
            addStyle: function(a, b) {
                var c = a + "{" + b + "}",
                    d = $("style#fb-styles");
                0 == d.length && (d = $('<style id="fb-styles" type="text/css"></style>'), $("head").append(d)), d[0].styleSheet ? d[0].styleSheet.cssText += c : d.text(d.text() + c)
            },
            showLoadingIndicator: function(a) {
                d.showLoadingIndicator(a)
            },
            showDialog: function(a, b, c, d, e) {
                new DialogBox(a, b, c, d, e)
            },
            getDatasourceSettings: function(a) {
                var b = e.datasources(),
                    c = _.find(b, function(b) {
                        return b.name() === a
                    });
                return c ? c.settings() : null
            },
            setDatasourceSettings: function(a, b) {
                var c = e.datasources(),
                    d = _.find(c, function(b) {
                        return b.name() === a
                    });
                if (!d)
                    return void console.log("Datasource not found");
                var f = _.defaults(b, d.settings());
                d.settings(f)
            },
            getStyleString: function(a) {
                var b = "";
                return _.each(j[a], function(a, c) {
                    b = b + c + ":" + a + ";"
                }), b
            },
            getStyleObject: function(a) {
                return j[a]
            },
            showDeveloperConsole: function() {
                i.showDeveloperConsole()
            }
        }
    }
    ();
$.extend(freeboard, jQuery.eventEmitter),
    function() {
        var a = function(a, b) {
            function c(a) {
                e && clearInterval(e), e = setInterval(function() {
                    d.updateNow()
                }, a)
            }
            var d = this,
                e = null,
                f = a,
                g = 0,
                h = !1;
            c(1e3 * f.refresh), this.updateNow = function() {
                if (!(g > 1 && !f.use_thingproxy || g > 2)) {
                    var a = f.url;
                    2 == g && f.use_thingproxy && (a = ("https:" == location.protocol ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(f.url));
                    var c = f.body;
                    if (c)
                        try {
                            c = JSON.parse(c)
                        } catch (e) {}
                    $.ajax({
                        url: a,
                        dataType: 1 == g ? "JSONP" : "JSON",
                        type: f.method || "GET",
                        data: c,
                        beforeSend: function(a) {
                            try {
                                _.each(f.headers, function(b) {
                                    var c = b.name,
                                        d = b.value;
                                    _.isUndefined(c) || _.isUndefined(d) || a.setRequestHeader(c, d)
                                })
                            } catch (b) {}
                        },
                        success: function(a) {
                            h = !0, b(a)
                        },
                        error: function(a, b, c) {
                            h || (g++, d.updateNow())
                        }
                    })
                }
            }, this.onDispose = function() {
                clearInterval(e), e = null
            }, this.onSettingsChanged = function(a) {
                h = !1, g = 0, f = a, c(1e3 * f.refresh), d.updateNow()
            }
        };
        freeboard.loadDatasourcePlugin({
            type_name: "JSON",
            settings: [{
                name: "url",
                display_name: "URL",
                type: "text"
            }, {
                name: "use_thingproxy",
                display_name: "Try thingproxy",
                description: 'A direct JSON connection will be tried first, if that fails, a JSONP connection will be tried. If that fails, you can use thingproxy, which can solve many connection problems to APIs. <a href="https://github.com/Freeboard/thingproxy" target="_blank">More information</a>.',
                type: "boolean",
                default_value: !0
            }, {
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 5
            }, {
                name: "method",
                display_name: "Method",
                type: "option",
                options: [{
                    name: "GET",
                    value: "GET"
                }, {
                    name: "POST",
                    value: "POST"
                }, {
                    name: "PUT",
                    value: "PUT"
                }, {
                    name: "DELETE",
                    value: "DELETE"
                }]
            }, {
                name: "body",
                display_name: "Body",
                type: "text",
                description: "The body of the request. Normally only used if method is POST"
            }, {
                name: "headers",
                display_name: "Headers",
                type: "array",
                settings: [{
                    name: "name",
                    display_name: "Name",
                    type: "text"
                }, {
                    name: "value",
                    display_name: "Value",
                    type: "text"
                }]
            }],
            newInstance: function(b, c, d) {
                c(new a(b, d))
            }
        });
        var b = function(a, b) {
            function c(a) {
                f && clearInterval(f), f = setInterval(function() {
                    e.updateNow()
                }, a)
            }

            function d(a) {
                return a.replace(/\w\S*/g, function(a) {
                    return a.charAt(0).toUpperCase() + a.substr(1).toLowerCase()
                })
            }
            var e = this,
                f = null,
                g = a;
            c(1e3 * g.refresh), this.updateNow = function() {
                $.ajax({
                    url: "http://api.openweathermap.org/data/2.5/weather?APPID=" + g.api_key + "&q=" + encodeURIComponent(g.location) + "&units=" + g.units,
                    dataType: "JSONP",
                    success: function(a) {
                        var c = {
                            place_name: a.name,
                            sunrise: new Date(1e3 * a.sys.sunrise).toLocaleTimeString(),
                            sunset: new Date(1e3 * a.sys.sunset).toLocaleTimeString(),
                            conditions: d(a.weather[0].description),
                            current_temp: a.main.temp,
                            high_temp: a.main.temp_max,
                            low_temp: a.main.temp_min,
                            pressure: a.main.pressure,
                            humidity: a.main.humidity,
                            wind_speed: a.wind.speed,
                            wind_direction: a.wind.deg
                        };
                        b(c)
                    },
                    error: function(a, b, c) {}
                })
            }, this.onDispose = function() {
                clearInterval(f), f = null
            }, this.onSettingsChanged = function(a) {
                g = a, e.updateNow(), c(1e3 * g.refresh)
            }
        };
        freeboard.loadDatasourcePlugin({
            type_name: "openweathermap",
            display_name: "Open Weather Map API",
            settings: [{
                name: "api_key",
                display_name: "API Key",
                type: "text",
                description: "Your personal API Key from Open Weather Map"
            }, {
                name: "location",
                display_name: "Location",
                type: "text",
                description: "Example: London, UK"
            }, {
                name: "units",
                display_name: "Units",
                type: "option",
                "default": "imperial",
                options: [{
                    name: "Imperial",
                    value: "imperial"
                }, {
                    name: "Metric",
                    value: "metric"
                }]
            }, {
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 5
            }],
            newInstance: function(a, c, d) {
                c(new b(a, d))
            }
        });
        var c = function(a, b) {
            function c(a) {
                b(a)
            }
            var d = this,
                e = a;
            this.updateNow = function() {
                dweetio.get_latest_dweet_for(e.thing_id, function(a, b) {
                    a || c(b[0].content)
                })
            }, this.onDispose = function() {}, this.onSettingsChanged = function(a) {
                dweetio.stop_listening(), e = a, dweetio.listen_for(e.thing_id, function(a) {
                    c(a.content)
                })
            }, d.onSettingsChanged(a)
        };
        freeboard.loadDatasourcePlugin({
            type_name: "dweet_io",
            display_name: "Dweet.io",
            external_scripts: ["http://dweet.io/client/dweet.io.min.js"],
            settings: [{
                name: "thing_id",
                display_name: "Thing Name",
                description: "Example: salty-dog-1",
                type: "text"
            }],
            newInstance: function(a, b, d) {
                b(new c(a, d))
            }
        });
        var d = function(a, b) {
            function c() {
                h.length > 0 ? (i < h.length && (b(h[i]), i++), i >= h.length && g.loop && (i = 0), i < h.length && (e = setTimeout(c, 1e3 * g.refresh))) : b({})
            }

            function d() {
                h = [], i = 0, e && (clearTimeout(e), e = null)
            }
            var e, f = this,
                g = a,
                h = [],
                i = 0;
            this.updateNow = function() {
                d(), $.ajax({
                    url: g.datafile,
                    dataType: g.is_jsonp ? "JSONP" : "JSON",
                    success: function(a) {
                        h = _.isArray(a) ? a : [], i = 0, c()
                    },
                    error: function(a, b, c) {}
                })
            }, this.onDispose = function() {
                d()
            }, this.onSettingsChanged = function(a) {
                g = a, f.updateNow()
            }
        };
        freeboard.loadDatasourcePlugin({
            type_name: "playback",
            display_name: "Playback",
            settings: [{
                name: "datafile",
                display_name: "Data File URL",
                type: "text",
                description: "A link to a JSON array of data."
            }, {
                name: "is_jsonp",
                display_name: "Is JSONP",
                type: "boolean"
            }, {
                name: "loop",
                display_name: "Loop",
                type: "boolean",
                description: "Rewind and loop when finished"
            }, {
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 5
            }],
            newInstance: function(a, b, c) {
                b(new d(a, c))
            }
        });
        var e = function(a, b) {
            function c() {
                e && (clearTimeout(e), e = null)
            }

            function d() {
                c(), e = setInterval(f.updateNow, 1e3 * g.refresh)
            }
            var e, f = this,
                g = a;
            this.updateNow = function() {
                var a = new Date,
                    c = {
                        numeric_value: a.getTime(),
                        full_string_value: a.toLocaleString(),
                        date_string_value: a.toLocaleDateString(),
                        time_string_value: a.toLocaleTimeString(),
                        date_object: a
                    };
                b(c)
            }, this.onDispose = function() {
                c()
            }, this.onSettingsChanged = function(a) {
                g = a, d()
            }, d()
        };
        freeboard.loadDatasourcePlugin({
            type_name: "clock",
            display_name: "Clock",
            settings: [{
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 1
            }],
            newInstance: function(a, b, c) {
                b(new e(a, c))
            }
        }), freeboard.loadDatasourcePlugin({
            type_name: "meshblu",
            display_name: "Octoblu",
            description: "app.octoblu.com",
            external_scripts: ["http://meshblu.octoblu.com/js/meshblu.js"],
            settings: [{
                name: "uuid",
                display_name: "UUID",
                type: "text",
                default_value: "device uuid",
                description: "your device UUID",
                required: !0
            }, {
                name: "token",
                display_name: "Token",
                type: "text",
                default_value: "device token",
                description: "your device TOKEN",
                required: !0
            }, {
                name: "server",
                display_name: "Server",
                type: "text",
                default_value: "meshblu.octoblu.com",
                description: "your server",
                required: !0
            }, {
                name: "port",
                display_name: "Port",
                type: "number",
                default_value: 80,
                description: "server port",
                required: !0
            }],
            newInstance: function(a, b, c) {
                b(new f(a, c))
            }
        });
        var f = function(a, b) {
            function c() {
                var a = skynet.createConnection({
                    uuid: e.uuid,
                    token: e.token,
                    server: e.server,
                    port: e.port
                });
                a.on("ready", function(c) {
                    a.on("message", function(a) {
                        var c = a;
                        b(c)
                    })
                })
            }
            var d = this,
                e = a;
            d.onSettingsChanged = function(a) {
                e = a
            }, d.updateNow = function() {
                c()
            }, d.onDispose = function() {}
        }
    }
    (),
    function() {
        function a(a, b, c) {
            var d = $(b).text();
            if (d != a)
                if ($.isNumeric(a) && $.isNumeric(d)) {
                    var e = a.toString().split("."),
                        f = 0;
                    e.length > 1 && (f = e[1].length), e = d.toString().split(".");
                    var g = 0;
                    e.length > 1 && (g = e[1].length), jQuery({
                        transitionValue: Number(d),
                        precisionValue: g
                    }).animate({
                        transitionValue: Number(a),
                        precisionValue: f
                    }, {
                        duration: c,
                        step: function() {
                            $(b).text(this.transitionValue.toFixed(this.precisionValue))
                        },
                        done: function() {
                            $(b).text(a)
                        }
                    })
                } else
                    $(b).text(a)
        }

        function b(a, b) {
            for (var c = $("<div class='sparkline-legend'></div>"), d = 0; d < b.length; d++) {
                var f = e[d % e.length],
                    g = b[d];
                c.append("<div class='sparkline-legend-value'><span style='color:" + f + "'>&#9679;</span>" + g + "</div>")
            }
            a.empty().append(c), freeboard.addStyle(".sparkline-legend", "margin:5px;"), freeboard.addStyle(".sparkline-legend-value", "color:white; font:10px arial,san serif; float:left; overflow:hidden; width:50%;"), freeboard.addStyle(".sparkline-legend-value span", "font-weight:bold; padding-right:5px;")
        }

        function c(a, b, c) {
            var f = $(a).data().values,
                g = $(a).data().valueMin,
                h = $(a).data().valueMax;
            f || (f = [], g = void 0, h = void 0);
            var i = function(a, b) {
                f[b] || (f[b] = []), f[b].length >= d && f[b].shift(), f[b].push(Number(a)), (void 0 === g || g > a) && (g = a), (void 0 === h || a > h) && (h = a)
            };
            _.isArray(b) ? _.each(b, i) : i(b, 0), $(a).data().values = f, $(a).data().valueMin = g, $(a).data().valueMax = h;
            var j = '<span style="color: {{color}}">&#9679;</span> {{y}}',
                k = !1;
            _.each(f, function(b, d) {
                $(a).sparkline(b, {
                    type: "line",
                    composite: k,
                    height: "100%",
                    width: "100%",
                    fillColor: !1,
                    lineColor: e[d % e.length],
                    lineWidth: 2,
                    spotRadius: 3,
                    spotColor: !1,
                    minSpotColor: "#78AB49",
                    maxSpotColor: "#78AB49",
                    highlightSpotColor: "#9D3926",
                    highlightLineColor: "#9D3926",
                    chartRangeMin: g,
                    chartRangeMax: h,
                    tooltipFormat: c && c[d] ? j + " (" + c[d] + ")" : j
                }), k = !0
            })
        }
        var d = 100,
            e = ["#FF9900", "#FFFFFF", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"],
            f = freeboard.getStyleString("values");
        freeboard.addStyle(".widget-big-text", f + "font-size:75px;"), freeboard.addStyle(".tw-display", "width: 100%; height:100%; display:table; table-layout:fixed;"), freeboard.addStyle(".tw-tr", "display:table-row;"), freeboard.addStyle(".tw-tg", "display:table-row-group;"), freeboard.addStyle(".tw-tc", "display:table-caption;"), freeboard.addStyle(".tw-td", "display:table-cell;"), freeboard.addStyle(".tw-value", f + "overflow: hidden;display: inline-block;text-overflow: ellipsis;"), freeboard.addStyle(".tw-unit", "display: inline-block;padding-left: 10px;padding-bottom: 1.1em;vertical-align: bottom;"), freeboard.addStyle(".tw-value-wrapper", "position: relative;vertical-align: middle;height:100%;"), freeboard.addStyle(".tw-sparkline", "height:20px;");
        var g = function(b) {
            function d() {
                _.isUndefined(e.units) || "" == e.units ? h.css("max-width", "100%") : h.css("max-width", f.innerWidth() - i.outerWidth(!0) + "px")
            }
            var e = b,
                f = $('<div class="tw-display"></div>'),
                g = $('<h2 class="section-title tw-title tw-td"></h2>'),
                h = $('<div class="tw-value"></div>'),
                i = $('<div class="tw-unit"></div>'),
                j = $('<div class="tw-sparkline tw-td"></div>');
            this.render = function(a) {
                $(a).empty(), $(f).append($('<div class="tw-tr"></div>').append(g)).append($('<div class="tw-tr"></div>').append($('<div class="tw-value-wrapper tw-td"></div>').append(h).append(i))).append($('<div class="tw-tr"></div>').append(j)), $(a).append(f), d()
            }, this.onSettingsChanged = function(a) {
                e = a;
                var b = !_.isUndefined(a.title) && "" != a.title,
                    c = !_.isUndefined(a.units) && "" != a.units;
                a.sparkline ? j.attr("style", null) : (delete j.data().values, j.empty(), j.hide()), b ? (g.html(_.isUndefined(a.title) ? "" : a.title), g.attr("style", null)) : (g.empty(), g.hide()), c ? (i.html(_.isUndefined(a.units) ? "" : a.units), i.attr("style", null)) : (i.empty(), i.hide());
                var f = 30;
                "big" == a.size && (f = 75, a.sparkline && (f = 60)), h.css({
                    "font-size": f + "px"
                }), d()
            }, this.onSizeChanged = function() {
                d()
            }, this.onCalculatedValueChanged = function(b, d) {
                "value" == b && (e.animate ? a(d, h, 500) : h.text(d), e.sparkline && c(j, d))
            }, this.onDispose = function() {}, this.getHeight = function() {
                return "big" == e.size || e.sparkline ? 2 : 1
            }, this.onSettingsChanged(b)
        };
        freeboard.loadWidgetPlugin({
            type_name: "text_widget",
            display_name: "Text",
            external_scripts: ["plugins/thirdparty/jquery.sparkline.min.js"],
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "size",
                display_name: "Size",
                type: "option",
                options: [{
                    name: "Regular",
                    value: "regular"
                }, {
                    name: "Big",
                    value: "big"
                }]
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated"
            }, {
                name: "sparkline",
                display_name: "Include Sparkline",
                type: "boolean"
            }, {
                name: "animate",
                display_name: "Animate Value Changes",
                type: "boolean",
                default_value: !0
            }, {
                name: "units",
                display_name: "Units",
                type: "text"
            }],
            newInstance: function(a, b) {
                b(new g(a))
            }
        });
        var h = 0;
        freeboard.addStyle(".gauge-widget-wrapper", "width: 100%;text-align: center;"), freeboard.addStyle(".gauge-widget", "width:200px;height:160px;display:inline-block;");
        var i = function(a) {
            function b() {
                g && (f.empty(), c = new JustGage({
                    id: d,
                    value: _.isUndefined(i.min_value) ? 0 : i.min_value,
                    min: _.isUndefined(i.min_value) ? 0 : i.min_value,
                    max: _.isUndefined(i.max_value) ? 0 : i.max_value,
                    label: i.units,
                    showInnerShadow: !1,
                    valueFontColor: "#d3d4d4"
                }))
            }
            var c, d = "gauge-" + h++,
                e = $('<h2 class="section-title"></h2>'),
                f = $('<div class="gauge-widget" id="' + d + '"></div>'),
                g = !1,
                i = a;
            this.render = function(a) {
                g = !0, $(a).append(e).append($('<div class="gauge-widget-wrapper"></div>').append(f)), b()
            }, this.onSettingsChanged = function(a) {
                a.min_value != i.min_value || a.max_value != i.max_value || a.units != i.units ? (i = a, b()) : i = a, e.html(a.title)
            }, this.onCalculatedValueChanged = function(a, b) {
                _.isUndefined(c) || c.refresh(Number(b))
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 3
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "gauge",
            display_name: "Gauge",
            external_scripts: ["plugins/thirdparty/raphael.2.1.0.min.js", "plugins/thirdparty/justgage.1.0.1.js"],
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated"
            }, {
                name: "units",
                display_name: "Units",
                type: "text"
            }, {
                name: "min_value",
                display_name: "Minimum",
                type: "text",
                default_value: 0
            }, {
                name: "max_value",
                display_name: "Maximum",
                type: "text",
                default_value: 100
            }],
            newInstance: function(a, b) {
                b(new i(a))
            }
        }), freeboard.addStyle(".sparkline", "width:100%;height: 75px;");
        var j = function(a) {
            var d = $('<h2 class="section-title"></h2>'),
                e = $('<div class="sparkline"></div>'),
                f = $("<div></div>"),
                g = a;
            this.render = function(a) {
                $(a).append(d).append(e).append(f)
            }, this.onSettingsChanged = function(a) {
                g = a, d.html(_.isUndefined(a.title) ? "" : a.title), a.include_legend && b(f, a.legend.split(","))
            }, this.onCalculatedValueChanged = function(a, b) {
                g.legend ? c(e, b, g.legend.split(",")) : c(e, b)
            }, this.onDispose = function() {}, this.getHeight = function() {
                var a = 0;
                if (g.include_legend && g.legend) {
                    var b = g.legend.split(",").length;
                    b > 4 ? a = .5 * Math.floor((b - 1) / 4) : b && (a = .5)
                }
                return 2 + a
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "sparkline",
            display_name: "Sparkline",
            external_scripts: ["plugins/thirdparty/jquery.sparkline.min.js"],
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated",
                multi_input: "true"
            }, {
                name: "include_legend",
                display_name: "Include Legend",
                type: "boolean"
            }, {
                name: "legend",
                display_name: "Legend",
                type: "text",
                description: "Comma-separated for multiple sparklines"
            }],
            newInstance: function(a, b) {
                b(new j(a))
            }
        }), freeboard.addStyle("div.pointer-value", "position:absolute;height:95px;margin: auto;top: 0px;bottom: 0px;width: 100%;text-align:center;");
        var k = function(a) {
            function b(a) {
                if (!a || a.length < 2)
                    return [];
                var b = [];
                b.push(["m", a[0], a[1]]);
                for (var c = 2; c < a.length; c += 2)
                    b.push(["l", a[c], a[c + 1]]);
                return b.push(["z"]), b
            }
            var c, d, e, f, g = 3,
                h = 0,
                i = $('<div class="widget-big-text"></div>'),
                j = $("<div></div>");
            this.render = function(a) {
                e = $(a).width(), f = $(a).height();
                var h = Math.min(e, f) / 2 - 2 * g;
                c = Raphael($(a).get()[0], e, f);
                var k = c.circle(e / 2, f / 2, h);
                k.attr("stroke", "#FF9900"), k.attr("stroke-width", g), d = c.path(b([e / 2, f / 2 - h + g, 15, 20, -30, 0])), d.attr("stroke-width", 0), d.attr("fill", "#fff"), $(a).append($('<div class="pointer-value"></div>').append(i).append(j))
            }, this.onSettingsChanged = function(a) {
                j.html(a.units)
            }, this.onCalculatedValueChanged = function(a, b) {
                if ("direction" == a) {
                    if (!_.isUndefined(d)) {
                        d.animate({
                            transform: "r" + b + "," + e / 2 + "," + f / 2
                        }, 250, "bounce")
                    }
                    h = b
                } else "value_text" == a && i.html(b)
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 4
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "pointer",
            display_name: "Pointer",
            external_scripts: ["plugins/thirdparty/raphael.2.1.0.min.js"],
            settings: [{
                name: "direction",
                display_name: "Direction",
                type: "calculated",
                description: "In degrees"
            }, {
                name: "value_text",
                display_name: "Value Text",
                type: "calculated"
            }, {
                name: "units",
                display_name: "Units",
                type: "text"
            }],
            newInstance: function(a, b) {
                b(new k(a))
            }
        });
        var l = function(a) {
            function b() {
                e && (clearInterval(e), e = null)
            }

            function c() {
                if (d && f) {
                    var a = f + (-1 == f.indexOf("?") ? "?" : "&") + Date.now();
                    $(d).css({
                        "background-image": "url(" + a + ")"
                    })
                }
            }
            var d, e, f;
            this.render = function(a) {
                $(a).css({
                    width: "100%",
                    height: "100%",
                    "background-size": "cover",
                    "background-position": "center"
                }), d = a
            }, this.onSettingsChanged = function(a) {
                b(), a.refresh && a.refresh > 0 && (e = setInterval(c, 1e3 * Number(a.refresh)))
            }, this.onCalculatedValueChanged = function(a, b) {
                "src" == a && (f = b), c()
            }, this.onDispose = function() {
                b()
            }, this.getHeight = function() {
                return 4
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "picture",
            display_name: "Picture",
            fill_size: !0,
            settings: [{
                name: "src",
                display_name: "Image URL",
                type: "calculated"
            }, {
                type: "number",
                display_name: "Refresh every",
                name: "refresh",
                suffix: "seconds",
                description: "Leave blank if the image doesn't need to be refreshed"
            }],
            newInstance: function(a, b) {
                b(new l(a))
            }
        }), freeboard.addStyle(".indicator-light", "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;"), freeboard.addStyle(".indicator-light.on", "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;"), freeboard.addStyle(".indicator-text", "margin-top:10px;");
        var m = function(a) {
            function b() {
                g.toggleClass("on", i), i ? f.text(_.isUndefined(c) ? _.isUndefined(h.on_text) ? "" : h.on_text : c) : f.text(_.isUndefined(d) ? _.isUndefined(h.off_text) ? "" : h.off_text : d)
            }
            var c, d, e = $('<h2 class="section-title"></h2>'),
                f = $('<div class="indicator-text"></div>'),
                g = $('<div class="indicator-light"></div>'),
                h = a,
                i = !1;
            this.render = function(a) {
                $(a).append(e).append(g).append(f)
            }, this.onSettingsChanged = function(a) {
                h = a, e.html(_.isUndefined(a.title) ? "" : a.title), b()
            }, this.onCalculatedValueChanged = function(a, e) {
                "value" == a && (i = Boolean(e)), "on_text" == a && (c = e), "off_text" == a && (d = e), b()
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 1
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "indicator",
            display_name: "Indicator Light",
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated"
            }, {
                name: "on_text",
                display_name: "On Text",
                type: "calculated"
            }, {
                name: "off_text",
                display_name: "Off Text",
                type: "calculated"
            }],
            newInstance: function(a, b) {
                b(new m(a))
            }
        }), freeboard.addStyle(".gm-style-cc a", "text-shadow:none;");
        var n = function(a) {
            function b() {
                if (c && d && f.lat && f.lon) {
                    var a = new google.maps.LatLng(f.lat, f.lon);
                    d.setPosition(a), c.panTo(a)
                }
            }
            var c, d, e = a,
                f = {};
            this.render = function(a) {
                function e() {
                    var e = {
                        zoom: 13,
                        center: new google.maps.LatLng(37.235, -115.811111),
                        disableDefaultUI: !0,
                        draggable: !1,
                        styles: [{
                            featureType: "water",
                            elementType: "geometry",
                            stylers: [{
                                color: "#2a2a2a"
                            }]
                        }, {
                            featureType: "landscape",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 20
                            }]
                        }, {
                            featureType: "road.highway",
                            elementType: "geometry.fill",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 17
                            }]
                        }, {
                            featureType: "road.highway",
                            elementType: "geometry.stroke",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 29
                            }, {
                                weight: .2
                            }]
                        }, {
                            featureType: "road.arterial",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 18
                            }]
                        }, {
                            featureType: "road.local",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 16
                            }]
                        }, {
                            featureType: "poi",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 21
                            }]
                        }, {
                            elementType: "labels.text.stroke",
                            stylers: [{
                                visibility: "on"
                            }, {
                                color: "#000000"
                            }, {
                                lightness: 16
                            }]
                        }, {
                            elementType: "labels.text.fill",
                            stylers: [{
                                saturation: 36
                            }, {
                                color: "#000000"
                            }, {
                                lightness: 40
                            }]
                        }, {
                            elementType: "labels.icon",
                            stylers: [{
                                visibility: "off"
                            }]
                        }, {
                            featureType: "transit",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 19
                            }]
                        }, {
                            featureType: "administrative",
                            elementType: "geometry.fill",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 20
                            }]
                        }, {
                            featureType: "administrative",
                            elementType: "geometry.stroke",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 17
                            }, {
                                weight: 1.2
                            }]
                        }]
                    };
                    c = new google.maps.Map(a, e), google.maps.event.addDomListener(a, "mouseenter", function(a) {
                        a.cancelBubble = !0, c.hover || (c.hover = !0, c.setOptions({
                            zoomControl: !0
                        }))
                    }), google.maps.event.addDomListener(a, "mouseleave", function(a) {
                        c.hover && (c.setOptions({
                            zoomControl: !1
                        }), c.hover = !1)
                    }), d = new google.maps.Marker({
                        map: c
                    }), b()
                }
                window.google && window.google.maps ? e() : (window.gmap_initialize = e, head.js("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmap_initialize"))
            }, this.onSettingsChanged = function(a) {
                e = a
            }, this.onCalculatedValueChanged = function(a, c) {
                "lat" == a ? f.lat = c : "lon" == a && (f.lon = c), b()
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 4
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "google_map",
            display_name: "Google Map",
            fill_size: !0,
            settings: [{
                name: "lat",
                display_name: "Latitude",
                type: "calculated"
            }, {
                name: "lon",
                display_name: "Longitude",
                type: "calculated"
            }],
            newInstance: function(a, b) {
                b(new n(a))
            }
        }), freeboard.addStyle(".html-widget", "white-space:normal;width:100%;height:100%");
        var o = function(a) {
            var b = $('<div class="html-widget"></div>'),
                c = a;
            this.render = function(a) {
                $(a).append(b)
            }, this.onSettingsChanged = function(a) {
                c = a
            }, this.onCalculatedValueChanged = function(a, c) {
                "html" == a && b.html(c)
            }, this.onDispose = function() {}, this.getHeight = function() {
                return Number(c.height)
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "html",
            display_name: "HTML",
            fill_size: !0,
            settings: [{
                name: "html",
                display_name: "HTML",
                type: "calculated",
                description: "Can be literal HTML, or javascript that outputs HTML."
            }, {
                name: "height",
                display_name: "Height Blocks",
                type: "number",
                default_value: 4,
                description: "A height block is around 60 pixels"
            }],
            newInstance: function(a, b) {
                b(new o(a))
            }
        })
    }
    ();
