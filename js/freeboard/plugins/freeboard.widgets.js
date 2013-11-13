(function()
{
    var SPARKLINE_HISTORY_LENGTH = 100;
	var valueStyle = freeboard.getStyleString("values");

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

	document.styleSheets[0].addRule('.indicator-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
	document.styleSheets[0].addRule('.indicator-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
	document.styleSheets[0].addRule('.indicator-text', "margin-top:10px;");

	document.styleSheets[0].addRule('div.pointer-value', "position:absolute;height:95px;margin: auto;top: 0px;bottom: 0px;width: 100%;text-align:center;");

	function easeTransitionText(currentValue, newValue, textElement, duration)
	{
		if(currentValue == newValue)
			return;

		if($.isNumeric(newValue) && $.isNumeric(currentValue))
		{
			var numParts = newValue.toString().split('.');
			var endingPrecision = 0;

			if(numParts.length > 1)
			{
				endingPrecision = numParts[1].length;
			}

			numParts = currentValue.toString().split('.');
			var startingPrecision = 0;

			if(numParts.length > 1)
			{
				startingPrecision = numParts[1].length;
			}

			jQuery({transitionValue: Number(currentValue), precisionValue: startingPrecision}).animate({transitionValue: Number(newValue), precisionValue: endingPrecision}, {
				duration: duration,
				step    : function()
				{
					$(textElement).text(this.transitionValue.toFixed(this.precisionValue));
				},
				done    : function()
				{
					$(textElement).text(newValue);
				}
			});
		}
		else
		{
			$(textElement).text(newValue);
		}
	}

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
		var currentValue;

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
				if(currentSettings.animate)
				{
					easeTransitionText(currentValue, newValue, valueElement, 500);
				}
				else
				{
					valueElement.text(newValue);
				}

                if(currentSettings.sparkline)
                {
                    addValueToSparkline(sparklineElement, newValue);
                }

				currentValue = newValue;
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

	freeboard.loadWidgetPlugin({
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
	            name        : "animate",
	            display_name: "Animate Value Changes",
	            type        : "boolean",
	            default_value:true
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
		var titleElement = $('<h2 class="section-title"></h2>');
		var gaugeElement = $('<div class="gauge-widget" id="' + thisGaugeID + '"></div>');

		var gaugeObject;
		var rendered = false;

		var currentSettings = settings;

		function createGauge()
		{
			if(!rendered)
			{
				return;
			}

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
			rendered = true;
			$(element).append(titleElement).append($('<div class="gauge-widget-wrapper"></div>').append(gaugeElement));
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

			titleElement.html(newSettings.title);
		}

		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			if(!_.isUndefined(gaugeObject))
			{
				gaugeObject.refresh(Number(newValue));
			}
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

	freeboard.loadWidgetPlugin({
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

    freeboard.loadWidgetPlugin({
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

	var pointerWidget = function(settings)
	{
		var self = this;
		var paper;
		var strokeWidth = 3;
		var triangle;
		var width, height;
		var currentValue = 0;
		var valueDiv = $('<div class="text-widget-big-value"></div>');
		var unitsDiv = $('<div></div>');

		function polygonPath(points)
		{
			if(!points || points.length < 2)
				return [];
			var path = []; //will use path object type
			path.push(['m', points[0], points[1]]);
			for(var i = 2; i < points.length; i += 2)
			{
				path.push(['l', points[i], points[i + 1]]);
			}
			path.push(['z']);
			return path;
		}

		this.render = function(element)
		{
			width = $(element).width();
			height = $(element).height();

			var radius = Math.min(width, height) / 2 - strokeWidth * 2;

			paper = Raphael($(element).get()[0], width, height);
			var circle = paper.circle(width / 2, height / 2, radius);
			circle.attr("stroke", "#FF9900");
			circle.attr("stroke-width", strokeWidth);

			triangle = paper.path(polygonPath([width / 2, (height / 2) - radius + strokeWidth, 15, 20, -30, 0]));
			triangle.attr("stroke-width", 0);
			triangle.attr("fill", "#fff");

			$(element).append($('<div class="pointer-value"></div>').append(valueDiv).append(unitsDiv));
		}

		this.onSettingsChanged = function(newSettings)
		{
			unitsDiv.html(newSettings.units);
		}

		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			if(settingName == "direction")
			{
				if(!_.isUndefined(triangle))
				{
					var direction = "r";

					var oppositeCurrent = currentValue + 180;

					if(oppositeCurrent < newValue)
					{
						//direction = "l";
					}

					triangle.animate({transform: "r" + newValue + "," + (width / 2) + "," + (height / 2)}, 250, "bounce");
				}

				currentValue = newValue;
			}
			else if(settingName == "value_text")
			{
				valueDiv.html(newValue);
			}
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

	freeboard.loadWidgetPlugin({
		type_name   : "pointer",
		display_name: "Pointer",
		settings    : [
			{
				name        : "direction",
				display_name: "Direction",
				type        : "calculated",
				description : "In degrees"
			},
			{
				name        : "value_text",
				display_name: "Value Text",
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
			return new pointerWidget(settings);
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

    freeboard.loadWidgetPlugin({
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

	var indicatorWidget = function(settings)
	{
		var self = this;
		var titleElement = $('<h2 class="section-title"></h2>');
		var stateElement = $('<div class="indicator-text"></div>');
		var indicatorElement = $('<div class="indicator-light"></div>');
		var currentSettings = settings;
		var isOn = false;

		function updateState()
		{
			indicatorElement.toggleClass("on", isOn);

			if(isOn)
			{
				stateElement.text((_.isUndefined(currentSettings.on_text) ? "" : currentSettings.on_text));
			}
			else
			{
				stateElement.text((_.isUndefined(currentSettings.off_text) ? "" : currentSettings.off_text));
			}
		}

		this.render = function(element)
		{
			$(element).append(titleElement).append(indicatorElement).append(stateElement);
		}

		this.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;
			titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
			updateState();
		}

		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			if(settingName == "value")
			{
				isOn = Boolean(newValue);
			}

			updateState();
		}

		this.onDispose = function()
		{
		}

		this.getHeight = function()
		{
			return 1;
		}

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name   : "indicator",
		display_name: "Indicator Light",
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
				name        : "on_text",
				display_name: "On Text",
				type        : "calculated"
			},
			{
				name        : "off_text",
				display_name: "Off Text",
				type        : "calculated"
			}
		],
		newInstance : function(settings)
		{
			return new indicatorWidget(settings);
		}
	});

}());