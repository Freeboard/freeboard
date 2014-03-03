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

var freeboard = (function()
{
	var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');

	var datasourcePlugins = {};
	var widgetPlugins = {};
	var grid;
	var theFreeboardModel = new freeboardModel();
	var currentStyle = {
		values: {
			"font-family": '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif',
			"color"      : "#d3d4d4",
			"font-weight": 100
		}
	};

	var veDatasourceRegex = new RegExp(".*datasources\\[\"([^\"]*)(\"\\].)?$");

	function resizeValueEditor(element)
	{
		var lineBreakCount = ($(element).val().match(/\n/g) || []).length;

		var newHeight = Math.min(200, 20 * (lineBreakCount + 1));

		$(element).css({height: newHeight + "px"});
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

	function createValueEditor(element)
	{
		var dropdown = null;
		var selectedOptionIndex = 0;

		$(element).addClass("calculated-value-input").bind("keyup mouseup freeboard-eval",function(event)
		{
			// Ignore arrow keys and enter keys
			if(dropdown && event.type == "keyup" && (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13))
			{
				event.preventDefault();
				return;
			}

			var inputString = $(element).val().substring(0, $(element).getCaretPosition());
			inputString = inputString.replace(String.fromCharCode(160), " "); // Weird issue where the textarea box was putting in ASCII (non breaking space) for spaces.

			var match = veDatasourceRegex.exec(inputString);

			var options = [];
			var replacementString;

			if(match)
			{
				if(match[1] == "") // List all datasources
				{
					_.each(theFreeboardModel.datasources(), function(datasource)
					{
						options.push({value: datasource.name(), follow_char: "\"]."});
					});
				}
				else if(match[1] != "" && _.isUndefined(match[2])) // List partial datasources
				{
					replacementString = match[1];

					_.each(theFreeboardModel.datasources(), function(datasource)
					{
						var dsName = datasource.name();

						if(dsName != replacementString && dsName.indexOf(replacementString) == 0)
						{
							options.push({value: dsName, follow_char: "\"]."});
						}
					});
				}
				else
				{
					var datasource = _.find(theFreeboardModel.datasources(), function(datasource)
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

							if(_.keys(dataValue).indexOf(replacementString) == -1)
							{
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
						$(this).trigger("freeboard-select");
					}).mousedown(function(event)
						{
							$(this).trigger("freeboard-insertValue");
							event.preventDefault();
						}).data("freeboard-optionIndex", currentIndex).data("freeboard-optionValue", option.value).bind("freeboard-insertValue",function()
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
						}).bind("freeboard-select", function()
						{
							$(this).parent().find("li.selected").removeClass("selected");
							$(this).addClass("selected");
							selectedOptionIndex = $(this).data("freeboard-optionIndex");
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
		}).focus(function()
			{
				resizeValueEditor(element);
			}).focusout(function()
			{
				$(element).css({height: ""});
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

						optionElement.trigger("freeboard-select");
						$(dropdown).scrollTop($(optionElement).position().top);
					}
					else if(event.keyCode == 13) // Handle enter key
					{
						event.preventDefault();

						if(selectedOptionIndex != -1)
						{
							$(dropdown).find("li").eq(selectedOptionIndex).trigger("freeboard-insertValue");
						}
					}
				}
			});
	}

	function createDialogBox(contentElement, title, okTitle, cancelTitle, okCallback)
	{
		var modal_width = 900;

		// Initialize our modal overlay
		var overlay = $('<div id="modal_overlay"></div>').css({ 'display': 'block', opacity: 0 });

		var modalDialog = $('<div class="modal"></div>').css({

			'display' : 'block',
			'position': 'fixed',
			'opacity' : 0,
			'z-index' : 1000

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

		$("body").append([overlay, modalDialog]);

		overlay.fadeTo(200, 0.8);
		modalDialog.fadeTo(200, 1);
	}

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
			.append(addScript);

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

		createDialogBox(container, "Developer Console", "OK", null, function(){

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

	function createPluginEditor(title, pluginTypes, currentInstanceName, currentTypeName, currentSettingsValues, settingsSavedCallback)
	{
		var newSettings = {
			name    : currentInstanceName,
			type    : currentTypeName,
			settings: {}
		};

		function createSettingRow(name, displayName)
		{
			var tr = $('<div id="setting-row-' + name + '" class="form-row"></div>').appendTo(form);

			tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
			return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);
		}


		var form = $('<div></div>');

		// Create our body
		if(!_.isUndefined(currentInstanceName))
		{
			createSettingRow("instance-name", "Name").append($('<input type="text">').val(currentInstanceName).change(function()
			{
				newSettings.name = $(this).val();
			}));
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

						var input = $('<input type="checkbox">').appendTo(valueCell).change(function()
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
							var input = $('<textarea></textarea>').appendTo(valueCell).change(function()
							{
								newSettings.settings[settingDef.name] = $(this).val();
							});

							if(settingDef.name in currentSettingsValues)
							{
								input.val(currentSettingsValues[settingDef.name]);
							}

							createValueEditor(input);

							$(valueCell).append($('<div class="datasource-input-suffix text-button">+ Datasource</div>').mousedown(function(e)
							{
								e.preventDefault();
								$(input).focus();
								$(input).insertAtCaret("datasources[\"");
								$(input).trigger("freeboard-eval");
							}));
						}
						else
						{
							var input = $('<input type="text">').appendTo(valueCell).change(function()
							{
								newSettings.settings[settingDef.name] = $(this).val();
							});

							if(settingDef.name in currentSettingsValues)
							{
								input.val(currentSettingsValues[settingDef.name]);
							}
						}

						break;
					}
				}

				if(!_.isUndefined(settingDef.description))
				{
					valueCell.append($('<div class="setting-description">' + settingDef.description + '</div>'));
				}
			});
		}

		function displayValidationError(settingName, errorMessage)
		{
			var errorElement = $('<div class="validation-error"></div>').html(errorMessage);
			$("#setting-value-container-" + settingName).append(errorElement);
		}

		createDialogBox(form, title, "Save", "Cancel", function()
		{
			$(".validation-error").remove();

			// Validate our new settings
			if(!_.isUndefined(currentInstanceName) && newSettings.name == "")
			{
				displayValidationError("instance-name", "A name is required.");
				return true;
			}

			if(_.isFunction(settingsSavedCallback))
			{
				settingsSavedCallback(newSettings);
			}
		});

		var pluginTypeNames = _.keys(pluginTypes);

		if(pluginTypeNames.length > 1)
		{
			var typeRow = createSettingRow("plugin-types", "Type");
			var typeSelect = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(typeRow));

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
				typeRow.parent().nextAll().remove();

				var currentType = pluginTypes[typeSelect.val()];

				if(_.isUndefined(currentType))
				{
					$("#dialog-ok").hide();
				}
				else
				{
					$("#dialog-ok").show();
					createSettingsFromDefinition(currentType.settings);
				}
			});

			if(_.isUndefined(currentTypeName))
			{
				$("#dialog-ok").hide();
			}
			else
			{
				$("#dialog-ok").show();
				typeSelect.val(currentTypeName).trigger("change");
			}
		}
		else if(pluginTypeNames.length == 1)
		{
			createSettingsFromDefinition(pluginTypes[pluginTypeNames[0]].settings);
		}
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
					createDialogBox(phraseElement, "Confirm Delete", "Yes", "No", function()
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

					createPluginEditor(title, types, instanceName, instanceType, settings, function(newSettings)
					{
						if(options.operation == 'add')
						{
							if(options.type == 'datasource')
							{
								var newViewModel = new DatasourceModel();
								theFreeboardModel.addDatasource(newViewModel);

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
				widget_base_dimensions: [300, 10]/*,
				draggable : {
					start: function(event, ui)
					{
						this.startingCol = this.$player.attr('data-col');
						this.startingRow = this.$player.attr('data-row');
					},
					stop : function(event, ui)
					{
						var newCol = this.$player.attr('data-col');
						var newRow = this.$player.attr('data-row');

						var paneModel = ko.dataFor(this.$player[0]);

						paneModel.col(Number(this.$player.attr('data-col')));
						paneModel.row(Number(this.$player.attr('data-row')));
					}
				}*/
			}).data("gridster");

			grid.disable();
		}
	}

	ko.bindingHandlers.pane = {
		init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			if(theFreeboardModel.isEditing())
			{
				$(element).css({cursor: "pointer"});
			}

			var col = Number(viewModel.col());
			var row = Number(viewModel.row());
			var width = Number(viewModel.width());
			var height = Number(viewModel.getCalculatedHeight());

			//viewModel.col(col);
			//viewModel.row(row);

			//console.log(col + ":" + row + ", " + width + ":" + height);

			grid.add_widget(element, width, height, col, row);

			if(bindingContext.$root.isEditing())
			{
				showPaneEditIcons(true);
			}

			$(element).attrchange({
				trackValues: true,
				callback   : function(event)
				{
					if(event.attributeName == "data-row")
					{
						viewModel.row(Number(event.newValue));
					}
					else if(event.attributeName == "data-col")
					{
						viewModel.col(Number(event.newValue));
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
			if(viewModel.getCalculatedHeight() != Number($(element).attr("data-sizey")))
			{
				grid.resize_widget($(element), undefined, viewModel.getCalculatedHeight(), function(){

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

	function freeboardModel()
	{
		var self = this;

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

			_.each(theFreeboardModel.panes(), function(pane)
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
				header_image: self.header_image(),
				allow_edit  : self.allow_edit(),
				plugins     : self.plugins(),
				panes       : panes,
				datasources : datasources
			};
		}

		this.deserialize = function(object, finishedCallback)
		{
			self.clearDashboard();

			function finishLoad()
			{
				if(!_.isUndefined(object.allow_edit))
				{
					self.allow_edit(object.allow_edit);
				}
				else
				{
					self.allow_edit(true);
				}

				self.header_image(object.header_image);

				_.each(object.datasources, function(datasourceConfig)
				{
					var datasource = new DatasourceModel();
					datasource.deserialize(datasourceConfig);
					self.addDatasource(datasource);
				});

				var sortedPanes = _.sortBy(object.panes, function(pane){
					return pane.row;
				});

				_.each(sortedPanes, function(paneConfig)
				{
					var pane = new PaneModel();
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

		this.clearDashboard = function()
		{
			grid.remove_all_widgets();

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
			showLoadingIndicator(true);
			self.deserialize(dashboardData, function()
			{
				showLoadingIndicator(false);

				if(_.isFunction(callback))
				{
					callback();
				}

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
				grid.disable();
			}
			else
			{
				$("#toggle-header-icon").addClass("icon-chevron-up").removeClass("icon-wrench");
				$(".gridster .gs_w").css({cursor: "pointer"});
				$("#main-header").animate({"top": "0px"}, animateLength);
				$("#board-content").animate({"top": (barHeight + 20) + "px"}, animateLength);
				$("#main-header").data().shown = true;
				attachWidgetEditIcons($(".sub-section"));
				grid.enable();
			}

			showPaneEditIcons(editing, animate);
		}

		this.toggleEditing = function()
		{
			var editing = !self.isEditing();
			self.setEditing(editing);
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

			sumHeights *= 6;
			sumHeights += 3;

			sumHeights *= 10;

			var rows = Math.ceil((sumHeights + 20) / 30);

			return Math.max(4, rows);
		}

		this.serialize = function()
		{
			var widgets = [];

			_.each(self.widgets(), function(widget)
			{
				widgets.push(widget.serialize());
			});

			return {
				title  : self.title(),
				width  : self.width(),
				row    : self.row(),
				col    : self.col(),
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
			_.each(self.widgets(), function(widget)
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
		this.fillSize = ko.observable(false);

		this.type = ko.observable();
		this.type.subscribe(function(newValue)
		{
			disposeWidgetInstance();

			if((newValue in widgetPlugins) && _.isFunction(widgetPlugins[newValue].newInstance))
			{
				var widgetType = widgetPlugins[newValue];

				function finishLoad()
				{
					widgetType.newInstance(self.settings(), function(widgetInstance)
					{

						self.fillSize((widgetType.fill_size === true));
						self.widgetInstance = widgetInstance;
						self.shouldRender(true);
						self._heightUpdate.valueHasMutated();

					});
				}

				// Do we need to load any external scripts?
				if(widgetType.external_scripts)
				{
					head.js(widgetType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
				}
				else
				{
					finishLoad();
				}
			}
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
				_.each(refreshSettingNames, function(settingName)
				{
					self.processCalculatedSetting(settingName);
				});
			}
		}

		this.callValueFunction = function(theFunction)
		{
			return theFunction.call(undefined, theFreeboardModel.datasourceData);
		}

		this.processCalculatedSetting = function(settingName)
		{
			if(_.isFunction(self.calculatedSettingScripts[settingName]))
			{
				var returnValue = undefined;

				try
				{
					returnValue = self.callValueFunction(self.calculatedSettingScripts[settingName]);
				}
				catch(e)
				{
					var rawValue = self.settings()[settingName];

					// If there is a reference error and the value just contains letters and numbers, then
					if(e instanceof ReferenceError && (/^\w+$/).test(rawValue))
					{
						returnValue = rawValue;
					}
				}

				if(!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onCalculatedValueChanged) && !_.isUndefined(returnValue))
				{
					try
					{
						self.widgetInstance.onCalculatedValueChanged(settingName, returnValue);
					}
					catch(e)
					{
						console.log(e.toString());
					}
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
			var datasourceRegex = new RegExp("datasources(?:\\[\"|[.])([\\w\\s]+)", "g");
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
				title   : self.title(),
				type    : self.type(),
				settings: self.settings()
			};
		}

		this.deserialize = function(object)
		{
			self.title(object.title);
			self.settings(object.settings);
			self.type(object.type);
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

	function getParameterByName(name)
	{
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	$(function()
	{ //DOM Ready
		// Show the loading indicator when we first load
		showLoadingIndicator(true);
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

				showLoadingIndicator(false);
				if(_.isFunction(finishedCallback))
				{
					finishedCallback();
				}
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
			showLoadingIndicator(show);
		},
		showDialog          : function(contentElement, title, okTitle, cancelTitle, okCallback)
		{
			createDialogBox(contentElement, title, okTitle, cancelTitle, okCallback);
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
		}
	};
}());