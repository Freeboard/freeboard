var deccoboard = (function()
{
	var datasourcePlugins = {};
	var widgetPlugins = {};
	var grid;
	var deccoboardModel = new DeccoboardModel();

	function createPluginEditor(title, pluginTypes, currentInstanceName, currentTypeName, currentSettingsValues, settingsSavedCallback)
	{
		var newSettings = {
			name : currentInstanceName,
			type : currentTypeName,
			settings : {}
		};

		function createSettingRow(displayName)
		{
			var tr = $("<tr></tr>").appendTo(form);

			tr.append('<td class="form-table-label"><label class="control-label">' + displayName + '</label></td>');
			return $('<td class="form-table-value"></td>').appendTo(tr);
		}

		function closeModal()
		{
			overlay.fadeTo(200, 0.0, function()
			{
				$(this).remove();
			});
			modalDialog.fadeTo(200, 0.0, function()
			{
				$(this).remove();
			});
		}

		var modal_width = 800;

		// Initialize our modal overlay
		var overlay = $('<div id="modal_overlay"></div>')
			.css({ 'display': 'block', opacity: 0 });

		var modalDialog = $('<div class="modal"></div>')
			.css({

				'display'    : 'block',
				'position'   : 'fixed',
				'opacity'    : 0,
				'z-index'    : 11000,
				'left'       : 50 + '%',
				'margin-left': -(modal_width / 2) + "px",
				'top'        : 120 + "px"

			});

		// Create our header
		modalDialog.append("<header><h1>" + title + "</h1></header>");

		var form = $('<table class="form-table"></table>');
		$('<section></section>').appendTo(modalDialog).append(form);

		// Create our body
		createSettingRow("Name").append(
			$('<input type="text">')
				.val(currentInstanceName)
				.change(function(){
					newSettings.name = $(this).val();
				})
		);

		var typeRow = createSettingRow("Type");
		var typeSelect = $('<select></select>').appendTo(typeRow).change(function(){
			newSettings.type = $(this).val();
			newSettings.settings = {};
		});

		_.each(pluginTypes, function(pluginType){
			typeSelect.append($("<option></option>").text(pluginType.display_name).attr("value", pluginType.type_name));
		});

		typeSelect.on("change", function(event){

			// Remove all the previous settings
			typeRow.parent().nextAll().remove();

			var currentType = pluginTypes[typeSelect.val()];

			_.each(currentType.settings, function(setting)
			{
				var displayName = setting.name;

				if(!_.isUndefined(setting.display_name))
				{
					displayName = setting.display_name;
				}

				var valueCell = createSettingRow(displayName);

				switch (setting.type)
				{
					case "array":
					{
						var subTableDiv = $('<div class="form-table-value-subtable"></div>').appendTo(valueCell);

						$('<a class="table-operation">Add</a>').appendTo(valueCell);

						if(setting.name in currentSettingsValues)
						{
							var subSettings = currentSettingsValues[setting.name];

							if(_.isArray(setting.settings) && _.isArray(subSettings) && subSettings.length > 0)
							{
								newSettings.settings[setting.name] = [];

								var subTable = $('<table class="table table-condensed sub-table"></table>').appendTo(subTableDiv);
								var subTableHead = $("<thead></thead>").appendTo(subTable);
								subTableHead = $("<tr></tr>").appendTo(subTableHead);

								// Create our headers
								_.each(setting.settings, function(subSettingDef)
								{
									var subsettingDisplayName = subSettingDef.name;

									if(!_.isUndefined(subSettingDef.display_name))
									{
										subsettingDisplayName = subSettingDef.display_name;
									}

									$('<th>' + subsettingDisplayName + '</th>').appendTo(subTableHead);
								});

								var subTableBody = $('<tbody></tbody>').appendTo(subTable);

								// Create our rows
								_.each(subSettings, function(subSetting, subSettingIndex)
								{
									var subsettingRow = $('<tr></tr>').appendTo(subTableBody);

									var newSetting = {};
									newSettings.settings[setting.name].push(newSetting);

									_.each(setting.settings, function(subSettingDef)
									{
										var subsettingCol = $('<td></td>').appendTo(subsettingRow);
										var subsettingValue = "";

										if(!_.isUndefined(subSetting[subSettingDef.name]))
										{
											subsettingValue = subSetting[subSettingDef.name];
										}

										newSetting[subSettingDef.name] = subsettingValue;

										$('<input class="table-row-value" type="text">').appendTo(subsettingCol).val(subsettingValue).change(function(){
											newSetting[subSettingDef.name] = $(this).val();
										});
									});

									subsettingRow.append($('<td class="table-row-operation"></td>').append($('<i class="icon-trash icon-white"></i>').click(function()
										{
											newSettings.settings[setting.name].splice(subSettingIndex, 1);
											subsettingRow.remove();
										})));
								});
							}
						}

						break;
					}
					case "boolean":
					{
						newSettings.settings[setting.name] = currentSettingsValues[setting.name];

						var input = $('<input type="checkbox">').appendTo(valueCell).change(function(){
							newSettings.settings[setting.name] = this.checked;
						});

						if(setting.name in currentSettingsValues)
						{
							input.prop("checked", currentSettingsValues[setting.name]);
						}

						break;
					}
					default:
					{
						newSettings.settings[setting.name] = currentSettingsValues[setting.name];

						var input = $('<input type="text">').appendTo(valueCell).change(function(){
							newSettings.settings[setting.name] = $(this).val();
						});

						if(!_.isUndefined(setting.suffix))
						{
							input.addClass("small align-right");
							$('<div class="input-suffix">' + setting.suffix + '</div>').appendTo(valueCell);
						}

						if(setting.name in currentSettingsValues)
						{
							input.val(currentSettingsValues[setting.name]);
						}

						break;
					}
				}
			});

		});

		typeSelect.val(currentTypeName).trigger("change");

		// Create our footer
		var footer = $('<footer></footer>').appendTo(modalDialog);
		$('<span class="button">Save</span>')
			.appendTo(footer)
			.click(function(){
				if(_.isFunction(settingsSavedCallback))
				{
					settingsSavedCallback(newSettings);
				}

				closeModal();
			});

		$('<span class="button">Cancel</span>')
			.appendTo(footer)
			.click(function(){
				closeModal();
			});

		$("body").append([overlay, modalDialog]);

		overlay.fadeTo(200, 0.8);
		modalDialog.fadeTo(200, 1);
	}

	ko.bindingHandlers.pluginEditor = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
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

			$(element).click(function(event){

				var instanceName = "";
				var instanceType = _.keys(types)[0];

				if(options.operation == 'add')
				{
					settings = {};
				}
				else if(options.operation == 'delete')
				{
				}
				else
				{
					instanceName = viewModel.name();
					instanceType = viewModel.type();
					settings = viewModel.settings();
				}

				createPluginEditor(title, types, instanceName, instanceType, settings, function(newSettings)
				{
					if(options.operation == 'add')
					{
						if(options.type == 'datasource')
						{
							viewModel = new DatasourceModel();
							deccoboardModel.addDatasource(viewModel);
						}
						else if(options.type == 'widget')
						{
							viewModel = new WidgetModel();
							//deccoboardModel.addDatasource(viewModel);
						}
					}

					viewModel.settings(newSettings.settings);
					viewModel.name(newSettings.name);
					viewModel.type(newSettings.type);
				});
			});
		}
	}

	ko.virtualElements.allowedBindings.datasourceTypeSettings = true;
	ko.bindingHandlers.datasourceTypeSettings =
	{
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
				widget_base_dimensions: [300, 40]
			}).data("gridster");

			grid.disable();
		}
	}

	ko.bindingHandlers.pane = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(deccoboardModel.isEditing())
			{
				$(element).css({cursor: "pointer"});
			}

			grid.add_widget(element, viewModel.width(), viewModel.height(), viewModel.col(), viewModel.row());

			if(bindingContext.$root.isEditing())
			{
				showPaneEditIcons(true);
			}
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			// If pane has been removed
			if(deccoboardModel.panes.indexOf(viewModel) == -1)
			{
				grid.remove_widget(element);
			}
			// If widget has been added or removed
			else if($(element).attr("data-sizey") != viewModel.widgets().length)
			{
				//var sizeY = Math.max(viewModel.widgets().length, 1);
				grid.resize_widget($(element), undefined, viewModel.height());
			}

		}
	}

	ko.bindingHandlers.valueEditor = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			var datasourceRegex = new RegExp(".*datasources[.]([^.]*)([.][^\\s]*)?$");
			var dropdown = null;
			var selectedOptionIndex = 0;

			$(element).bind("keyup mouseup", function(event)
			{

				// Ignore arrow keys and enter keys
				if(dropdown && event.type == "keyup" && (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13))
				{
					event.preventDefault();
					return;
				}

				var inputString = $(element).val().substring(0, $(element).getCaretPosition());
				var match = datasourceRegex.exec(inputString);

				var options = [];
				var replacementString = undefined;

				if(match)
				{
					if(match[1] == "") // List all datasources
					{
						_.each(deccoboardModel.datasources(), function(datasource)
						{
							options.push({value: datasource.name(), follow_char: "."});
						});
					}
					else if(match[1] != "" && _.isUndefined(match[2])) // List partial datasources
					{
						replacementString = match[1];

						_.each(deccoboardModel.datasources(), function(datasource)
						{

							var name = datasource.name();

							if(name != match[1] && name.indexOf(match[1]) == 0)
							{
								options.push({value: name, follow_char: "."});
							}
						});
					}
					else
					{
						var datasource = _.find(deccoboardModel.datasources(), function(datasource)
						{
							return (datasource.name() === match[1]);
						});

						if(!_.isUndefined(datasource))
						{
							var dataPath = "";

							if(!_.isUndefined(match[2]))
							{
								dataPath = match[2];
							}

							var dataPathItems = dataPath.split(".");
							dataPath = "data";

							for(var index = 1; index < dataPathItems.length - 1; index++)
							{
								if(dataPathItems[index] != "")
								{
									dataPath = dataPath + "." + dataPathItems[index];
								}
							}

							var lastPathObject = _.last(dataPathItems);

							// If the last character is a [, then ignore it
							if(lastPathObject.charAt(lastPathObject.length - 1) == "[")
							{
								lastPathObject = lastPathObject.replace(/\[+$/, "");
								dataPath = dataPath + "." + lastPathObject;
							}

							var dataValue = datasource.getDataRepresentation(dataPath);

							if(_.isArray(dataValue))
							{
								for(var index = 0; index < dataValue.length; index++)
								{
									var followChar = "]";

									if(_.isObject(dataValue[index]))
									{
										followChar = followChar + ".";
									}
									else if(_.isArray(dataValue[index]))
									{
										followChar = followChar + "[";
									}

									options.push({value: index, follow_char: followChar});
								}
							}
							else if(_.isObject(dataValue))
							{
								replacementString = lastPathObject;

								_.each(dataValue, function(value, name)
								{

									if(name != lastPathObject && name.indexOf(lastPathObject) == 0)
									{
										var followChar = undefined;

										if(_.isArray(value))
										{
											followChar = "[";
										}
										else if(_.isObject(value))
										{
											followChar = ".";
										}

										options.push({value: name, follow_char: followChar});
									}
								});
							}
						}
					}
				}

				if(options.length > 0)
				{
					if(!dropdown)
					{
						dropdown = $('<ul id="value-selector" class="value-dropdown"></ul>').insertAfter(element).width($(element).outerWidth() - 2).css("left", $(element).position().left).css("top", $(element).position().top + $(element).outerHeight() - 1);
					}

					dropdown.empty();

					var selected = true;
					selectedOptionIndex = 0;

					var currentIndex = 0;

					_.each(options, function(option)
					{
						var li = $('<li>' + option.value + '</li>').appendTo(dropdown).mouseenter(function()
							{
								$(this).trigger("decco-select");
							}).mousedown(function(event)
							{
								$(this).trigger("decco-insertValue");
								event.preventDefault();
							}).data("decco-optionIndex", currentIndex).data("decco-optionValue", option.value).bind("decco-insertValue", function()
							{

								var optionValue = option.value;

								if(!_.isUndefined(option.follow_char))
								{
									optionValue = optionValue + option.follow_char;
								}

								if(!_.isUndefined(replacementString))
								{
									var replacementIndex = inputString.lastIndexOf(replacementString);

									if(replacementIndex != -1)
									{
										$(element).replaceTextAt(replacementIndex, replacementIndex + replacementString.length, optionValue);
										viewModel.value($(element).val());
									}
								}
								else
								{
									$(element).insertAtCaret(optionValue);
									viewModel.value($(element).val());
								}

								$(element).triggerHandler("mouseup");
							}).bind("decco-select", function()
							{
								$(this).parent().find("li.selected").removeClass("selected");
								$(this).addClass("selected");
								selectedOptionIndex = $(this).data("decco-optionIndex");
							});

						if(selected)
						{
							$(li).addClass("selected");
							selected = false;
						}

						currentIndex++;
					});
				}
				else
				{
					$(element).next("ul#value-selector").remove();
					dropdown = null;
					selectedOptionIndex = -1;
				}
			}).focusout(function()
				{
					$(element).next("ul#value-selector").remove();
					dropdown = null;
					selectedOptionIndex = -1;
				}).bind("keydown", function(event)
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

							optionElement.trigger("decco-select");
							$(dropdown).scrollTop($(optionElement).position().top);
						}
						else if(event.keyCode == 13) // Handle enter key
						{
							event.preventDefault();

							if(selectedOptionIndex != -1)
							{
								$(dropdown).find("li").eq(selectedOptionIndex).trigger("decco-insertValue");
							}
						}
					}
				});
		}
	}

	function createGauge(element, viewModel)
	{
		$(element).empty();

		var gaugeID = "widget-" + viewModel.widgetID() + "-gauge";

		$(element).attr("id", gaugeID);

		var gauge = new JustGage({
			id             : gaugeID,
			value          : viewModel.computedValue(),
			min            : (_.isUndefined(viewModel.min()) ? 0 : viewModel.min()),
			max            : (_.isUndefined(viewModel.max()) ? 100 : viewModel.max()),
			label          : viewModel.units(),
			showInnerShadow: false,
			valueFontColor : "#d3d4d4"
		});

		$(element).data("gauge", gauge);

		return gauge;
	}

	ko.bindingHandlers.gauge = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			createGauge(element, viewModel);
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			viewModel._updateDummy();

			var gauge = $(element).data("gauge");

			if(viewModel.min() != gauge.config.min || viewModel.max() != gauge.config.max || viewModel.units() != gauge.config.label)
			{
				gauge = createGauge(element, viewModel);
			}

			gauge.refresh(viewModel.computedValue());
		}
	}

	ko.bindingHandlers.sparkline = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			var id = "widget-" + viewModel.widgetID() + "-sparkline";
			$(element).attr("id", id);
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			viewModel._updateDummy();

			var values = $(element).data().values;

			if(!values)
			{
				values = [];
			}

			if(values.length >= SPARKLINE_HISTORY_LENGTH)
			{
				values.shift();
			}

			var newValue = viewModel.computedValue();

			if(_.isNumber(newValue))
			{
				values.push(newValue);

				$(element).data().values = values;

				$(element).sparkline(values, {
					type              : "line",
					height            : "100%",
					width             : "100%",
					fillColor         : false,
					lineColor         : "#FF9900",
					lineWidth         : 2,
					spotRadius        : 3,
					spotColor         : false,
					minSpotColor      : "#78AB49",
					maxSpotColor      : "#78AB49",
					highlightSpotColor: "#9D3926",
					highlightLineColor: "#9D3926"
				});
			}
		}
	}

	ko.bindingHandlers.widget = {
		/*init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(!_.isUndefined(viewModel.widgetInstance))
			{

			}
		},*/
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			$(element).empty();

			if(!_.isUndefined(viewModel.widgetInstance) && _.isFunction(viewModel.widgetInstance.render))
			{
				viewModel.widgetInstance.render(element);
			}
			//$(element).empty();
			/*if(bindingContext.$root.isEditing())
			{
				attachWidgetEditIcons(element);
			}*/
		}
	}

	function DeccoboardModel()
	{
		var self = this;

		this.isEditing = ko.observable(false);
		this.allow_edit = ko.observable(true);

		this.datasources = ko.observableArray();
		this.panes = ko.observableArray();
		this.datasourceData = {};
		this.processDatasourceUpdate = function(datasourceModel, newData)
		{
			var datasourceName = datasourceModel.name();

			self.datasourceData[datasourceName] = newData;

			_.each(deccoboardModel.panes(), function(pane)
			{
				_.each(pane.widgets(), function(widget)
				{
					if(widget.refresh().indexOf(datasourceName) != -1)
					{
						widget.update();
					}
				});
			});
		}

		this._datasourceTypes = ko.observable();
		this.datasourceTypes = ko.computed({
			read: function()
			{
				self._datasourceTypes();

				var returnTypes = [];

				_.each(datasourcePlugins, function(datasourcePluginType){
					var typeName = datasourcePluginType.type_name;
					var displayName = typeName;

					if(!_.isUndefined(datasourcePluginType.display_name))
					{
						displayName = datasourcePluginType.display_name;
					}

					returnTypes.push(
						{
							name : typeName,
							display_name : displayName
						}
					);
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
				allow_edit : self.allow_edit(),
				panes    : panes,
				datasources: datasources
			};
		}

		this.deserialize = function(object)
		{
			this.datasources.removeAll();
			this.panes.removeAll();

			if(!_.isUndefined(object.allow_edit))
			{
				self.allow_edit(object.allow_edit);
			}

			_.each(object.datasources, function(datasourceConfig)
			{
				var datasource = new DatasourceModel();
				datasource.deserialize(datasourceConfig);
				self.addDatasource(datasource);
			});

			_.each(object.panes, function(paneConfig)
			{
				var pane = new PaneModel();
				pane.deserialize(paneConfig);
				self.panes.push(pane);
			});
		}

		this.loadDashboard = function()
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

							self.deserialize(jsonObject);
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

		this.saveDashboard = function()
		{
			var contentType = 'application/octet-stream';
			var a = document.createElement('a');
			var blob = new Blob([JSON.stringify(self.serialize())], {'type': contentType});
			a.href = window.URL.createObjectURL(blob);
			a.download = "dashboard.json";
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
			var newPane = new PaneModel();
			self.addPane(newPane);
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

		this.toggleEditing = function()
		{
			var editing = !self.isEditing();
			self.isEditing(editing);

			if(!editing)
			{
				$(".gridster .gs_w").css({cursor: "default"});
				$("#main-header").animate({top: "-280px"}, 250);
				$(".gridster").animate({"margin-top": "20px"}, 250);
				$("#main-header").data().shown = false;

				$(".sub-section").unbind();

				grid.disable();
			}
			else
			{
				$(".gridster .gs_w").css({cursor: "pointer"});
				$("#main-header").animate({top: "0px"}, 250);
				$(".gridster").animate({"margin-top": "300px"}, 250);
				$("#main-header").data().shown = true;

				attachWidgetEditIcons($(".sub-section"));

				grid.enable();
			}

			showPaneEditIcons(editing);
		}
	}

	function PaneModel()
	{
		var self = this;

		this.title = ko.observable();
		this.width = ko.observable(1);
		this.row = ko.observable(1);
		this.col = ko.observable(1);
		this.widgets = ko.observableArray();

		this.addWidget = function(widget)
		{
			this.widgets.push(widget);
		}

		this.height = ko.computed({
			read: function()
			{
				var sumHeights = _.reduce(self.widgets(), function(memo, widget)
				{
					return memo + widget.height();
				}, 0);

				return Math.max(2, sumHeights + 1);
			}
		});

		this.serialize = function()
		{
			var widgets = [];

			_.each(self.widgets(), function(widget)
			{
				widgets.push(widget.serialize());
			});

			return {
				title   : self.title(),
				width   : self.width(),
				row     : self.row(),
				col     : self.col(),
				widgets: widgets
			};
		}

		this.deserialize = function(object)
		{
			self.title(object.title);
			self.width(object.width);
			self.row(object.row);
			self.col(object.col);

			_.each(object.widgets, function(widgetConfig)
			{
				var widget = new WidgetModel();
				widget.deserialize(widgetConfig);
				self.widgets.push(widget);
			});
		}

		this.dispose = function()
		{
			ko.utils.arrayForEach(self.widgets(), function(widget)
			{
				widget.dispose();
			});
		}
	}

	function WidgetModel()
	{
		function disposeWidgetInstance()
		{
			if(!_.isUndefined(self.widgetInstance))
			{
				if(_.isFunction(self.widgetInstance.onDispose))
				{
					self.widgetInstance.onDispose();
				}

				self.widgetInstance = undefined;
			}
		}

		var self = this;

		this.title = ko.observable();

		this.type = ko.observable();
		this.type.subscribe(function(newValue)
		{
			disposeWidgetInstance();

			if((newValue in widgetPlugins) && _.isFunction(widgetPlugins[newValue].newInstance))
			{
				var widgetInstance = widgetPlugins[newValue].newInstance(self.settings(), self.updateCallback);
				self.widgetInstance = widgetInstance;
			}
		});

		this.settings = ko.observable({});
		this.settings.subscribe(function(newValue)
		{
		});

		this.value = ko.observable("");
		this.value.subscribe(function(newValue)
		{
			var script;
			var typeSpecIndex = newValue.indexOf("javascript:");

			if(typeSpecIndex == 0)
			{
				script = newValue.substring(11);

				// If there is no return, add one
				if((script.match(/;/g) || []).length <= 1 && script.indexOf("return") == -1)
				{
					script = "return " + script;
				}
			}
			else
			{
				typeSpecIndex = newValue.indexOf("datasource:");

				if(typeSpecIndex == 0)
				{
					script = 'return data.' + newValue.substring(11).trim() + ";";
				}
				else
				{
					script = 'return "' + newValue + '";';
				}
			}

			try
			{
				self.valueFunction = new Function("datasources", script);
			}
			catch(e)
			{
			}

			// Find any references to datasources, and show that we want to be notified when they refresh
			var refreshDatasources = [];

			var datasourceRegex = new RegExp("datasources.(\\w+)", "g");
			var matches;

			while(matches = datasourceRegex.exec(newValue))
			{
				refreshDatasources.push(matches[1]);
			}

			self.refresh(refreshDatasources);
		});

		this.height = ko.computed({
			read: function()
			{
				if(!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.getHeight))
				{
					return self.widgetInstance.getHeight();
				}

				return 1;
			}
		});

		this.refresh = ko.observableArray();

		this._updateDummy = ko.observable();

		this.computedValue = ko.computed(function()
		{
			self._updateDummy();

			var value;

			try
			{

				value = self.currentComputedValue = self.valueFunction.call(undefined, deccoboardModel.datasourceData);
			}
			catch(e)
			{
				value = "";
				console.log(e.toString());
				/*valueElement.popover({
				 title    : "Error",
				 content  : e.toString(),
				 trigger  : "hover",
				 container: "body"
				 });*/
			}

			return value;
		});

		this.update = function()
		{
			self._updateDummy.valueHasMutated();
		}

		this.dispose = function()
		{
			if(self._dataSubscription)
			{
				self._dataSubscription.dispose();
			}
		}

		this.serialize = function()
		{
			return {
				title  : self.title(),
				type   : self.type(),
				value  : self.value(),
				refresh: self.refresh(),
				units  : self.units(),
				min    : self.min(),
				max    : self.max()
			};
		}

		this.deserialize = function(object)
		{
			self.title(object.title);
			self.type(object.type);
			self.value(object.value);
			self.refresh(object.refresh);
			self.units(object.units);
			self.max(object.max);
			self.min(object.min);
		}
	}

	function DatasourceModel()
	{
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
			deccoboardModel.processDatasourceUpdate(self, newData);

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
				var datasourceInstance = datasourcePlugins[newValue].newInstance(self.settings(), self.updateCallback);
				self.datasourceInstance = datasourceInstance;
				datasourceInstance.updateNow();
			}
		});


		this.last_updated = ko.observable("never");
		this.last_error = ko.observable();

		this.serialize = function()
		{
			return {
				name   : self.name(),
				type   : self.type(),
				settings : self.settings()
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

	function showPaneEditIcons(show)
	{
		if(show)
		{
			$(".widget-tools").css("display", "block").animate({opacity: 1.0}, 250);
		}
		else
		{
			$(".widget-tools").animate({opacity: 0.0}, 250, function()
			{
				$().css("display", "none");
			});
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

	$(function()
	{ //DOM Ready

		ko.applyBindings(deccoboardModel);

		if(deccoboardModel.allow_edit() && deccoboardModel.panes().length == 0)
		{
			deccoboardModel.toggleEditing();
		}

		// Fade everything in
		$(".gridster").css("opacity", 1);
	});

	// PUBLIC FUNCTIONS
	return {
		loadConfiguration : function(configuration)
		{
			deccoboardModel.deserialize(configuration);
		},
		loadDatasourcePlugin : function(plugin)
		{
			if(_.isUndefined(plugin.display_name))
			{
				plugin.display_name = plugin.type_name;
			}

			datasourcePlugins[plugin.type_name] = plugin;
			deccoboardModel._datasourceTypes.valueHasMutated();
		},
		loadWidgetPlugin : function(plugin)
		{
			if(_.isUndefined(plugin.display_name))
			{
				plugin.display_name = plugin.type_name;
			}

			widgetPlugins[plugin.type_name] = plugin;
			deccoboardModel._widgetTypes.valueHasMutated();
		}
	};
}());