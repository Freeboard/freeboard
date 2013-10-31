(function()
{
    var SPARKLINE_HISTORY_LENGTH = 100;
	var valueStyle = deccoboard.getStyleString("values");

	valueStyle +=
		"overflow: hidden;" +
		"text-overflow: ellipsis;" +
		"display: inline;";

	// Add some styles to our sheet
	document.styleSheets[0].addRule('.text-widget-unit', 'padding-left: 5px;display:inline;');
	document.styleSheets[0].addRule('.text-widget-regular-value', valueStyle + "font-size:30px;");
	document.styleSheets[0].addRule('.text-widget-big-value', valueStyle + "font-size:75px;");

	document.styleSheets[0].addRule('.gauge-widget-wrapper', "width: 100%;text-align: center;");
	document.styleSheets[0].addRule('.gauge-widget', "width:200px;height:160px;display:inline-block;");

    document.styleSheets[0].addRule('.sparkline', "width:100%;height: 75px;");
    document.styleSheets[0].addRule('.sparkline-inline', "width:50%;float:right;height:30px;");

    function addValueToSparkline(element, value)
    {
        var values = $(element).data().values;

        if(!values)
        {
            values = [];
        }

        if(values.length >= SPARKLINE_HISTORY_LENGTH)
        {
            values.shift();
        }

        //if(_.isNumber(value))
        //{
            values.push(Number(value));

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
        //}
    }

	var textWidget = function(settings)
	{
		var self = this;

		var currentSettings = settings;
		var titleElement = $('<h2 class="section-title"></h2>');
		var valueElement = $('<div></div>');
		var unitsElement = $('<div class="text-widget-unit"></div>');
        var sparklineElement = $('<span class="sparkline-inline"></span>');

		this.render = function(element)
		{
			$(element).append(titleElement).append(valueElement).append(unitsElement).append(sparklineElement);
		}

		this.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;
			titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));

			valueElement
				.toggleClass("text-widget-regular-value", (newSettings.size == "regular"))
				.toggleClass("text-widget-big-value", (newSettings.size == "big"));

			unitsElement.html((_.isUndefined(newSettings.units) ? "" : newSettings.units));

            if(newSettings.sparkline)
            {
                sparklineElement.show();
            }
            else
            {
                delete sparklineElement.data().values;
                sparklineElement.empty();
                sparklineElement.hide();
            }
		}

		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			if(settingName == "value")
			{
				valueElement.text(newValue);

                if(currentSettings.sparkline)
                {
                    addValueToSparkline(sparklineElement, newValue);
                }
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
                name        : "sparkline",
                display_name: "Include Sparkline",
                type        : "boolean"
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

    var sparklineWidget = function(settings)
    {
        var self = this;

        var titleElement = $('<h2 class="section-title"></h2>');
        var sparklineElement = $('<div class="sparkline"></div>');

        this.render = function(element)
        {
            $(element).append(titleElement).append(sparklineElement);
        }

        this.onSettingsChanged = function(newSettings)
        {
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
        }

        this.onCalculatedValueChanged = function(settingName, newValue)
        {
            addValueToSparkline(sparklineElement, newValue);
        }

        this.onDispose = function()
        {
        }

        this.getHeight = function()
        {
            return 2;
        }

        this.onSettingsChanged(settings);
    };

    deccoboard.loadWidgetPlugin({
        type_name   : "sparkline",
        display_name: "Sparkline",
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
            }
        ],
        newInstance : function(settings)
        {
            return new sparklineWidget(settings);
        }
    });

    var pictureWidget = function(settings)
    {
        var self = this;
        var widgetElement;

        this.render = function(element)
        {
            $(element).css({
                width : "100%",
                height: "100%"
            });
            widgetElement = element;
        }

        this.onSettingsChanged = function(newSettings)
        {
        }

        this.onCalculatedValueChanged = function(settingName, newValue)
        {
            $(widgetElement).css({
                "background-image" :  "url(" + newValue + ")",
                "background-size" : "cover",
                "background-position" : "center"
            });
        }

        this.onDispose = function()
        {
        }

        this.getHeight = function()
        {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    deccoboard.loadWidgetPlugin({
        type_name   : "picture",
        display_name: "Picture",
        settings    : [
            {
                name        : "src",
                display_name: "Image URL",
                type        : "calculated"
            }
        ],
        newInstance : function(settings)
        {
            return new pictureWidget(settings);
        }
    });

}());