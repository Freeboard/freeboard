(function()
{
	var valueStyle = deccoboard.getStyleString("values");

	valueStyle +=
		"overflow: hidden;" +
		"text-overflow: ellipsis;" +
		"display: inline;";

	// Add some styles to our sheet
	document.styleSheets[0].addRule('.text-widget-unit', 'padding-left: 5px;display:inline');
	document.styleSheets[0].addRule('.text-widget-regular-value', valueStyle + "font-size:30px;");
	document.styleSheets[0].addRule('.text-widget-big-value', valueStyle + "font-size:75px;");

	document.styleSheets[0].addRule('.gauge-widget-wrapper', "width: 100%;text-align: center;");
	document.styleSheets[0].addRule('.gauge-widget', "width:200px;height:160px;display:inline-block");

	var textWidget = function(settings)
	{
		var self = this;

		var currentSettings = settings;
		var titleElement = $('<h2 class="section-title"></h2>');
		var valueElement = $('<div></div>');
		var unitsElement = $('<div class="text-widget-unit"></div>');

		this.render = function(element)
		{
			$(element).append(titleElement).append(valueElement).append(unitsElement);
		}

		this.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;
			titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));

			valueElement
				.toggleClass("text-widget-regular-value", (newSettings.size == "regular"))
				.toggleClass("text-widget-big-value", (newSettings.size == "big"));

			unitsElement.html((_.isUndefined(newSettings.units) ? "" : newSettings.units));
		}

		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			if(settingName == "value")
			{
				valueElement.text(newValue);
			}
		}

		this.onDispose = function()
		{

		}

		this.getHeight = function()
		{
			if(currentSettings.size == "big")
			{
				return 2;
			}
			else
			{
				return 1;
			}
		}

		this.onSettingsChanged(settings);
	};

	deccoboard.loadWidgetPlugin({
		type_name   : "text_widget",
		display_name: "Text",
		settings    : [
			{
				name        : "title",
				display_name: "Title",
				type        : "text"
			},
			{
				name        : "size",
				display_name: "Size",
				type        : "option",
				options     : [
					{
						name : "Regular",
						value: "regular"
					},
					{
						name : "Big",
						value: "big"
					}
				]
			},
			{
				name        : "value",
				display_name: "Value",
				type        : "calculated"
			},
			{
				name        : "units",
				display_name: "Units",
				type        : "text"
			}
		],
		newInstance : function(settings)
		{
			return new textWidget(settings);
		}
	});

	var gaugeID = 0;

	var gaugeWidget = function(settings)
	{
		var self = this;

		var thisGaugeID = "gauge-" + gaugeID++;
		var gaugeElement = $('<div class="gauge-widget" id="' + thisGaugeID + '"></div>');

		var gaugeObject;

		var currentSettings = settings;

		function createGauge()
		{
			gaugeElement.empty();

			gaugeObject = new JustGage({
				id             : thisGaugeID,
				value          : (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
				min            : (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
				max            : (_.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value),
				label          : currentSettings.units,
				showInnerShadow: false,
				valueFontColor : "#d3d4d4"
			});
		}

		this.render = function(element)
		{
			$(element).append($('<div class="gauge-widget-wrapper"></div>').append(gaugeElement));
			createGauge();
		}

		this.onSettingsChanged = function(newSettings)
		{
			if(newSettings.min_value != currentSettings.min_value || newSettings.max_value != currentSettings.max_value || newSettings.units != currentSettings.units)
			{
				currentSettings = newSettings;
				createGauge();
			}
			else
			{
				currentSettings = newSettings;
			}
		}

		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			gaugeObject.refresh(Number(newValue));
		}

		this.onDispose = function()
		{
		}

		this.getHeight = function()
		{
			return 3;
		}

		this.onSettingsChanged(settings);
	};

	deccoboard.loadWidgetPlugin({
		type_name   : "gauge",
		display_name: "Gauge",
		settings    : [
			{
				name        : "title",
				display_name: "Title",
				type        : "text"
			},
			{
				name        : "value",
				display_name: "Value",
				type        : "calculated"
			},
			{
				name        : "units",
				display_name: "Units",
				type        : "text"
			},
			{
				name        : "min_value",
				display_name: "Minimum",
				type        : "text",
				default_value : 0
			},
			{
				name        : "max_value",
				display_name: "Minimum",
				type        : "text",
				default_value: 100
			}
		],
		newInstance : function(settings)
		{
			return new gaugeWidget(settings);
		}
	});

}());