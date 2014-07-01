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
	var grid;

        var freeboardUI = new FreeboardUI();
	var theFreeboardModel = new FreeboardModel(datasourcePlugins, widgetPlugins, freeboardUI);

	var jsEditor = new JSEditor();
	var valueEditor = new ValueEditor(theFreeboardModel);
	var pluginEditor = new PluginEditor(jsEditor, valueEditor);

	var currentStyle = {
		values: {
			"font-family": '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif',
			"color"      : "#d3d4d4",
			"font-weight": 100
		}
	};

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
					var instanceName = undefined;
					var instanceType = undefined;

					if(options.type == 'datasource')
					{
						if(options.operation == 'add')
						{
							settings = {};
							instanceName = "";
						}
						else
						{
							instanceName = viewModel.name();
							instanceType = viewModel.type();
							settings = viewModel.settings();
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
						}

						types = {
							settings: {
								settings: [
									{
										name        : "title",
										display_name: "Title",
										type        : "text"
									}
								]
							}
						}
					}

					pluginEditor.createPluginEditor(title, types, instanceName, instanceType, settings, function(newSettings)
					{
						if(options.operation == 'add')
						{
							if(options.type == 'datasource')
							{
								var newViewModel = new DatasourceModel(theFreeboardModel, datasourcePlugins);
								theFreeboardModel.addDatasource(newViewModel);

								newViewModel.settings(newSettings.settings);
								newViewModel.name(newSettings.name);
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
							}
							else
							{
								if(viewModel.name)
								{
									viewModel.name(newSettings.name);
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

	ko.bindingHandlers.grid = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			// Initialize our grid
			grid = $(element).gridster({
				widget_margins        : [10, 10],
				widget_base_dimensions: [300, 10]
			}).data("gridster");

            $(".gridster").css("width", grid.cols * 300 + (grid.cols * 20));

			grid.disable();
		}
	}

    function updatePositionForScreenSize(paneModel, row, col)
    {
        var displayCols = grid.cols;

        if(!_.isUndefined(row)) paneModel.row[displayCols] = row;
        if(!_.isUndefined(col)) paneModel.col[displayCols] = col;
    }

    function getPositionForScreenSize(paneModel)
    {
        var displayCols = grid.cols;

        if(_.isNumber(paneModel.row) && _.isNumber(paneModel.col)) // Support for legacy format
        {
            var obj = {};
            obj[displayCols] = paneModel.row;
            paneModel.row = obj;


            obj = {};
            obj[displayCols] = paneModel.col;
            paneModel.col = obj;
        }

        var rowCol = {};

        // Loop through our settings until we find one that is equal to or less than our display cols
        for(var colIndex = displayCols; colIndex >= 1; colIndex--)
        {
            if(!_.isUndefined(paneModel.row[colIndex]))
            {
                rowCol.row = paneModel.row[colIndex];
                break;
            }
        }

        for(var colIndex = displayCols; colIndex >= 1; colIndex--)
        {
            if(!_.isUndefined(paneModel.col[colIndex]))
            {
                rowCol.col = paneModel.col[colIndex];
                break;
            }
        }

        if(_.isUndefined(rowCol.row)) rowCol.row = 1;
        if(_.isUndefined(rowCol.col)) rowCol.col = 1;

        return rowCol;
    }

	ko.bindingHandlers.pane = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(theFreeboardModel.isEditing())
			{
				$(element).css({cursor: "pointer"});
			}

            var position = getPositionForScreenSize(viewModel);

			var col = position.col;
			var row = position.row;
			var width = Number(viewModel.width());
			var height = Number(viewModel.getCalculatedHeight());

			grid.add_widget(element, width, height, col, row);

			if(bindingContext.$root.isEditing())
			{
				freeboardUI.showPaneEditIcons(true);
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
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			// If pane has been removed
			if(theFreeboardModel.panes.indexOf(viewModel) == -1)
			{
				grid.remove_widget(element);
			}

			// If widget has been added or removed
            var calculatedHeight = viewModel.getCalculatedHeight();

			if(calculatedHeight != Number($(element).attr("data-sizey")))
			{
				grid.resize_widget($(element), undefined, calculatedHeight, function(){

					grid.set_dom_grid_height();

				});
			}
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

			theFreeboardModel.addPluginSource(plugin.source);
			datasourcePlugins[plugin.type_name] = plugin;
			theFreeboardModel._datasourceTypes.valueHasMutated();
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
			var context = document, stylesheet;

			if(typeof context.styleSheets == 'object')
			{
				if(context.styleSheets.length)
				{
					stylesheet = context.styleSheets[context.styleSheets.length - 1];
				}
				if(context.styleSheets.length)
				{
					if(context.createStyleSheet)
					{
						stylesheet = context.createStyleSheet();
					}
					else
					{
						context.getElementsByTagName('head')[0].appendChild(context.createElement('style'));
						stylesheet = context.styleSheets[context.styleSheets.length - 1];
					}
				}
				if(stylesheet.addRule)
				{
					stylesheet.addRule(selector, rules);
				}
				else
				{
					stylesheet.insertRule(selector + '{' + rules + '}', stylesheet.cssRules.length);
				}
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
			showDeveloperConsole();
		},
	        _removeAllWidgets : function()
	        {
		    grid.remove_all_widgets();
		},
	        _disableGrid : function()
	        {
		    grid.disable();
		},
	        _enableGrid : function()
	        {
		    grid.enable();
		}
	};
}());

$.extend(freeboard, jQuery.eventEmitter);
