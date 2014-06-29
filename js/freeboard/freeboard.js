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
	var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');

	var datasourcePlugins = {};
	var widgetPlugins = {};
	var grid;
    var assetRoot = "";
	var theFreeboardModel = new FreeboardModel(datasourcePlugins, widgetPlugins);
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

    function displayJSEditor(value, callback)
    {
        // We load these when we need them— no sense in loading more javascript and css if we're never using the editor.
        head.js(
            assetRoot + "css/codemirror.css",
            assetRoot + "css/codemirror-ambiance.css",
            assetRoot + "js/codemirror.js",
            function(){

                var exampleText = "// Example: Convert temp from C to F and truncate to 2 decimal places.\n// return (datasources[\"MyDatasource\"].sensor.tempInF * 1.8 + 32).toFixed(2);";

                // If value is empty, go ahead and suggest something
                if(!value)
                {
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
                        mode:  "javascript",
                        theme: "ambiance",
                        indentUnit: 4,
                        lineNumbers: true,
                        matchBrackets: true,
                        autoCloseBrackets: true
                    }
                );

                var closeButton = $('<span id="dialog-cancel" class="text-button">Close</span>').click(function(){
                    if(callback)
                    {
                        var newValue = codeMirrorEditor.getValue();

                        if(newValue === exampleText)
                        {
                            newValue = "";
                        }

                        callback(newValue);
                        codeWindow.remove();
                    }
                });

                codeWindowFooter.append(closeButton);
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

        var pluginDescriptionElement = $('<div id="plugin-description"></div>').hide();
        form.append(pluginDescriptionElement);

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
							var input = $('<textarea></textarea>').appendTo(valueCell).change(function()
							{
								newSettings.settings[settingDef.name] = $(this).val();
							});

							if(settingDef.name in currentSettingsValues)
							{
								input.val(currentSettingsValues[settingDef.name]);
							}

							createValueEditor(input);

                            var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');

                            var datasourceTool = $('<li><i class="icon-plus icon-white"></i><label>DATASOURCE</label></li>').mousedown(function(e)
                            {
                                e.preventDefault();
                                $(input).focus();
                                $(input).insertAtCaret("datasources[\"");
                                $(input).trigger("freeboard-eval");
                            });

                            var jsEditorTool = $('<li><i class="icon-fullscreen icon-white"></i><label>.JS EDITOR</label></li>').mousedown(function(e)
                            {
                                e.preventDefault();

                                displayJSEditor(input.val(), function(result){
                                    input.val(result);
                                    input.change();
                                });
                            });

                            $(valueCell).append(datasourceToolbox.append([datasourceTool, jsEditorTool]));
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

		function displayValidationError(settingName, errorMessage)
		{
			var errorElement = $('<div class="validation-error"></div>').html(errorMessage);
			$("#setting-value-container-" + settingName).append(errorElement);
		}

        function removeSettingsRows()
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
                removeSettingsRows();

				var currentType = pluginTypes[typeSelect.val()];

				if(_.isUndefined(currentType))
				{
                    $("#setting-row-instance-name").hide();
					$("#dialog-ok").hide();
				}
				else
				{
                    $("#setting-row-instance-name").show();

                    if(currentType.description && currentType.description.length > 0)
                    {
                        pluginDescriptionElement.html(currentType.description).show();
                    }
                    else
                    {
                        pluginDescriptionElement.hide();
                    }

					$("#dialog-ok").show();
					createSettingsFromDefinition(currentType.settings);
				}
			});
		}
		else if(pluginTypeNames.length == 1)
		{
			createSettingsFromDefinition(pluginTypes[pluginTypeNames[0]].settings);
		}

        if(!_.isUndefined(currentInstanceName))
        {
            createSettingRow("instance-name", "Name").append($('<input type="text">').val(currentInstanceName).change(function()
            {
                newSettings.name = $(this).val();
            }));
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
        setAssetRoot : function(_assetRoot) // To be used if freeboard is going to load dynamic assets from a different root URL
        {
            assetRoot = _assetRoot;
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
	        _attachWidgetEditIcons : function(element)
	        {
		    attachWidgetEditIcons(element);
		},
	        _showPaneEditIcons : function(show, animate)
	        {
		    showPaneEditIcons(show, animate);
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
