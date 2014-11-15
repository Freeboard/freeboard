ValueEditor = function(theFreeboardModel)
{
	var _veDatasourceRegex = new RegExp(".*datasources\\[\"([^\"]*)(\"\\])?(.*)$");

	var _autocompleteOptions = [];
	var _autocompleteReplacementString;

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
		var replacementString;

		if(match)
		{
			// Editor value is: datasources["; List all datasources
			if(match[1] == "")
			{
				_.each(datasources, function(datasource)
				{
					options.push({value: datasource.name(), follow_char: "\"][\""});
				});
			}
			// Editor value is a partial match for a datasource; list matching datasources
			else if(match[1] != "" && _.isUndefined(match[2]))
			{
				replacementString = match[1];

				_.each(datasources, function(datasource)
				{
					var dsName = datasource.name();

					if(dsName != replacementString && dsName.indexOf(replacementString) == 0)
					{
						options.push({value: dsName, follow_char: "\"][\""});
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
						if(remainderIndex > 0)
						{
							dataPath = dataPath + match[3].substring(0, remainderIndex);
							remainder = match[3].substring(remainderIndex, match[3].length);
						}
					}

					// Get the data for the last complete JSON field
					var dataValue = datasource.getDataRepresentation(dataPath);

					// For arrays, list out the indices
					if(_.isArray(dataValue))
					{
						for(var index = 0; index < dataValue.length; index++)
						{
							var value = dataValue[index];
							if(_isPotentialTypeMatch(value, expectsType))
							{
								var followChar = "]";
								if(_.isObject(value))
								{
									followChar = followChar + "[\"";
								}
								else if(_.isArray(value))
								{
									followChar = followChar + "[";
								}

								options.push({value: index, follow_char: followChar});
							}
						}
					}
					// For objects, list out the keys
					else if(_.isObject(dataValue))
					{
						replacementString = remainder.replace(/^[\[\"]*/, "");

						_.each(dataValue, function(value, name)
						{
							if(name != replacementString && name.indexOf(replacementString) == 0)
							{
								if(_isPotentialTypeMatch(value, expectsType))
								{
									var followChar = "\"]";
									if(_.isArray(value))
									{
										followChar = "\"][";
									}
									else if(_.isObject(value))
									{
										followChar = "\"][\"";
									}

									options.push({value: name, follow_char: followChar});
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
		_autocompleteReplacementString = replacementString;
	}

	function createValueEditor(element, expectsType)
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

			_autocompleteFromDatasource(inputString, theFreeboardModel.datasources(), expectsType);

			if(_autocompleteOptions.length > 0)
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

				_.each(_autocompleteOptions, function(option)
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

							if(!_.isUndefined(_autocompleteReplacementString))
							{
								var replacementIndex = inputString.lastIndexOf(_autocompleteReplacementString);

								if(replacementIndex != -1)
								{
									$(element).replaceTextAt(replacementIndex, replacementIndex + _autocompleteReplacementString.length, optionValue);
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
				$(element).css({"z-index" : 3001});
				_resizeValueEditor(element);
			}).focusout(function()
			{
				$(element).css({
					"height": "",
					"z-index" : 3000
				});

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
