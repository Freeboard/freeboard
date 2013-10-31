var deccoboard = (function()
{
	var datasourcePlugins = {};
	var widgetPlugins = {};
	var grid;
	var deccoboardModel = new DeccoboardModel();
	var currentStyle = {
		values : {
			"font-family" : '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif',
			"color" : "#d3d4d4",
			"font-weight" : 100
		}
	};

	var veDatasourceRegex = new RegExp(".*datasources[.]([^.]*)([.][^\\s]*)?$");
	function createValueEditor(element)
	{
		var dropdown = null;
		var selectedOptionIndex = 0;

		$(element).bind("keyup mouseup",function(event)
		{

			// Ignore arrow keys and enter keys
			if(dropdown && event.type == "keyup" && (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13))
			{
				event.preventDefault();
				return;
			}

			var inputString = $(element).val().substring(0, $(element).getCaretPosition());
			var match = veDatasourceRegex.exec(inputString);

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
				dropdown.scrollTop(0);

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
						}).data("decco-optionIndex", currentIndex).data("decco-optionValue", option.value).bind("decco-insertValue",function()
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
								}
							}
							else
							{
								$(element).insertAtCaret(optionValue);
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

    function createDialogBox(contentElement, title, okTitle, cancelTitle, okCallback)
    {
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

        // Create our header
        modalDialog.append("<header><h1>" + title + "</h1></header>");

        $('<section></section>').appendTo(modalDialog).append(contentElement);

        // Create our footer
        var footer = $('<footer></footer>').appendTo(modalDialog);
        $('<span class="button">' + okTitle + '</span>')
            .appendTo(footer)
            .click(function(){
                if(_.isFunction(okCallback))
                {
                    okCallback();
                }

                closeModal();
            });

        $('<span class="button">' + cancelTitle  + '</span>')
            .appendTo(footer)
            .click(function(){
                closeModal();
            });

        $("body").append([overlay, modalDialog]);

        overlay.fadeTo(200, 0.8);
        modalDialog.fadeTo(200, 1);
    }

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


		var form = $('<table class="form-table"></table>');

		// Create our body
		if(!_.isUndefined(currentInstanceName))
		{
			createSettingRow("Name").append(
				$('<input type="text">')
					.val(currentInstanceName)
					.change(function(){
						newSettings.name = $(this).val();
					})
			);
		}

        function createSettingsFromDefinition(settingsDefs)
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

                var valueCell = createSettingRow(displayName);

                switch (settingDef.type)
                {
                    case "array":
                    {
                        var subTableDiv = $('<div class="form-table-value-subtable"></div>').appendTo(valueCell);

                        $('<a class="table-operation">Add</a>').appendTo(valueCell);

                        if(settingDef.name in currentSettingsValues)
                        {
                            var subSettings = currentSettingsValues[settingDef.name];

                            if(_.isArray(settingDef.settings) && _.isArray(subSettings) && subSettings.length > 0)
                            {
                                newSettings.settings[settingDef.name] = [];

                                var subTable = $('<table class="table table-condensed sub-table"></table>').appendTo(subTableDiv);
                                var subTableHead = $("<thead></thead>").appendTo(subTable);
                                subTableHead = $("<tr></tr>").appendTo(subTableHead);

                                // Create our headers
                                _.each(settingDef.settings, function(subSettingDef)
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
                                    newSettings.settings[settingDef.name].push(newSetting);

                                    _.each(settingDef.settings, function(subSettingDef)
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
                                        newSettings.settings[settingDef.name].splice(subSettingIndex, 1);
                                        subsettingRow.remove();
                                    })));
                                });
                            }
                        }

                        break;
                    }
                    case "boolean":
                    {
                        newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

                        var input = $('<input type="checkbox">').appendTo(valueCell).change(function(){
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

                        var input = $('<select></select>').appendTo(valueCell).change(function(){
                            newSettings.settings[settingDef.name] = $(this).val();
                        });

                        _.each(settingDef.options, function(option){

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

                        var input = $('<input type="text">').appendTo(valueCell).change(function(){
                            newSettings.settings[settingDef.name] = $(this).val();
                        });

                        if(!_.isUndefined(settingDef.suffix))
                        {
                            input.addClass("small align-right");
                            $('<div class="input-suffix">' + settingDef.suffix + '</div>').appendTo(valueCell);
                        }

                        if(settingDef.name in currentSettingsValues)
                        {
                            input.val(currentSettingsValues[settingDef.name]);
                        }

                        if(settingDef.type == "calculated")
                        {
                            createValueEditor(input);
                        }

                        break;
                    }
                }
            });
        }

        if(_.keys(pluginTypes).length > 1)
        {
            var typeRow = createSettingRow("Type");
            var typeSelect = $('<select></select>').appendTo(typeRow);

            _.each(pluginTypes, function(pluginType){
                typeSelect.append($("<option></option>").text(pluginType.display_name).attr("value", pluginType.type_name));
            });

            typeSelect.change(function(){

                newSettings.type = $(this).val();
                newSettings.settings = {};

                // Remove all the previous settings
                typeRow.parent().nextAll().remove();

                var currentType = pluginTypes[typeSelect.val()];


                createSettingsFromDefinition(currentType.settings);

            });

            typeSelect.val(currentTypeName).trigger("change");
        }
        else
        {
            createSettingsFromDefinition(pluginTypes.settings);
        }

        createDialogBox(form, title, "Save", "Cancel", function(){
            if(_.isFunction(settingsSavedCallback))
            {
                settingsSavedCallback(newSettings);
            }
        });
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
            else if(options.type == 'pane')
            {
                title = "Pane";
            }

			$(element).click(function(event)
            {
                if(options.operation == 'delete')
                {
                    var phraseElement = $('<p>Are you sure you want to delete this ' + title  + '?</p>');
                    createDialogBox(phraseElement, "Confirm Delete", "Yes", "No", function(){

                        if(options.type == 'datasource')
                        {
                            deccoboardModel.deleteDatasource(viewModel);
                        }
                        else if(options.type == 'widget')
                        {
                            deccoboardModel.deleteWidget(viewModel);
                        }
                        else if(options.type == 'pane')
                        {
                            deccoboardModel.deletePane(viewModel);
                        }

                    });
                }
                else
                {
                    var instanceName = undefined;
                    var instanceType = _.keys(types)[0];

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
                            settings : [
                                {
                                    name        : "title",
                                    display_name: "Title",
                                    type        : "text"
                                }
                            ]
                        }
                    }

                    createPluginEditor(title, types, instanceName, instanceType, settings, function(newSettings)
                    {
                        if(options.operation == 'add')
                        {
                            if(options.type == 'datasource')
                            {
                                var newViewModel = new DatasourceModel();
                                deccoboardModel.addDatasource(newViewModel);

                                newViewModel.settings(newSettings.settings);
                                newViewModel.name(newSettings.name);
                                newViewModel.type(newSettings.type);
                            }
                            else if(options.type == 'widget')
                            {
                                var newViewModel = new WidgetModel();
                                newViewModel.settings(newSettings.settings);
                                newViewModel.type(newSettings.type);

                                viewModel.widgets.push(newViewModel);

                                attachWidgetEditIcons(element);
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

			grid.add_widget(element, viewModel.width(), viewModel.getCalculatedHeight(), viewModel.col(), viewModel.row());

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
			else
            {
				grid.resize_widget($(element), undefined, viewModel.getCalculatedHeight());
			}
		}
	}

	ko.bindingHandlers.widget = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(deccoboardModel.isEditing())
			{
				attachWidgetEditIcons($(element).parent());
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

        this.getCalculatedHeight = function()
        {
            var sumHeights = _.reduce(self.widgets(), function(memo, widget)
            {
                return memo + widget.height();
            }, 0);

            return Math.max(2, sumHeights + 1);
        }

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

		this.datasourceRefreshNotifications = {};
		this.calculatedSettingScripts = {};

		this.title = ko.observable();

		this.type = ko.observable();
		this.type.subscribe(function(newValue)
		{
			disposeWidgetInstance();

			if((newValue in widgetPlugins) && _.isFunction(widgetPlugins[newValue].newInstance))
			{
				var widgetInstance = widgetPlugins[newValue].newInstance(self.settings(), self.updateCallback);
				self.widgetInstance = widgetInstance;
                self.shouldRender(true);
			}

			//self.updateCalculatedSettings();
			self._heightUpdate.valueHasMutated();
		});

		this.settings = ko.observable({});
		this.settings.subscribe(function(newValue)
		{
			if(!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSettingsChanged))
			{
				self.widgetInstance.onSettingsChanged(newValue);
			}

			self.updateCalculatedSettings();
			self._heightUpdate.valueHasMutated();
		});

		this.processDatasourceUpdate = function(datasourceName)
		{
			var refreshSettingNames = self.datasourceRefreshNotifications[datasourceName];

			if(_.isArray(refreshSettingNames))
			{
				_.each(refreshSettingNames, function(settingName){
					self.processCalculatedSetting(settingName);
				});
			}
		}

		this.callValueFunction = function(theFunction)
		{
			return theFunction.call(undefined, deccoboardModel.datasourceData);
		}

		this.processCalculatedSetting = function(settingName)
		{
			if(_.isFunction(self.calculatedSettingScripts[settingName]))
			{
				try
				{
					var returnValue = self.callValueFunction(self.calculatedSettingScripts[settingName]);

					if(!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onCalculatedValueChanged))
					{
						self.widgetInstance.onCalculatedValueChanged(settingName, returnValue);
					}
				}
				catch(e)
				{
					console.log(e.toString());
				}
			}
		}

		this.updateCalculatedSettings = function()
		{
			self.datasourceRefreshNotifications = {};
			self.calculatedSettingScripts = {};

			if(_.isUndefined(self.type()))
			{
				return;
			}

			// Check for any calculated settings
			var settingsDefs = widgetPlugins[self.type()].settings;
			var datasourceRegex = new RegExp("datasources.(\\w+)", "g");
			var currentSettings = self.settings();

			_.each(settingsDefs, function(settingDef)
			{
				if(settingDef.type == "calculated")
				{
					var script = currentSettings[settingDef.name];

					if(!_.isUndefined(script))
					{
						// If there is no return, add one
						if((script.match(/;/g) || []).length <= 1 && script.indexOf("return") == -1)
						{
							script = "return " + script;
						}

						var valueFunction;

						try
						{
							valueFunction = new Function("datasources", script);
						}
						catch(e)
						{
							var literalText = currentSettings[settingDef.name].replace(/"/g, '\\"');

							// If the value function cannot be created, then go ahead and treat it as literal text
							valueFunction = new Function("datasources", "return \"" + literalText + "\";");
						}

						self.calculatedSettingScripts[settingDef.name] = valueFunction;
						self.processCalculatedSetting(settingDef.name);

						// Are there any datasources we need to be subscribed to?
						var matches;

						while(matches = datasourceRegex.exec(script))
						{
							var refreshSettingNames = self.datasourceRefreshNotifications[matches[1]];

							if(_.isUndefined(refreshSettingNames))
							{
								refreshSettingNames = [];
								self.datasourceRefreshNotifications[matches[1]] = refreshSettingNames;
							}

							refreshSettingNames.push(settingDef.name);
						}
					}
				}
			});
		}

		this._heightUpdate = ko.observable();
		this.height = ko.computed({
			read: function()
			{
				self._heightUpdate();

				if(!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.getHeight))
				{
					return self.widgetInstance.getHeight();
				}

				return 1;
			}
		});

        this.shouldRender = ko.observable(false);
		this.render = function(element)
		{
            self.shouldRender(false);
			if(!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.render))
			{
				self.widgetInstance.render(element);
				self.updateCalculatedSettings();
			}
		}

		this.dispose = function()
		{

		}

		this.serialize = function()
		{
			return {
				title  : self.title(),
				type   : self.type(),
				settings : self.settings()
			};
		}

		this.deserialize = function(object)
		{
			self.title(object.title);
			self.type(object.type);
			self.settings(object.settings);
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
		},
		getStyleString : function(name)
		{
			var returnString = "";

			_.each(currentStyle[name], function(value, name){
				returnString = returnString + name + ":" + value + ";";
			});

			return returnString;
		},
		getStyleObject : function(name)
		{
			return currentStyle[name];
		}
	};
}());