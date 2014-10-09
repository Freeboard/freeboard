freeboard.addStyle(".nvd3 text", "fill: #686868; font-family: " + freeboard.getStyleObject("font-family"));
freeboard.addStyle(".nvd3 .nv-axis line", "stroke: #686868 !important; stroke-width: 1;shape-rendering: crispEdges;stroke-dasharray: 5,5;");
freeboard.addStyle(".nv-legend-text", "font-weight: 700;");

var chartWidget = function (settings) {

	var self = this;
	var currentSettings = settings;
	var chart;
	var chartData;
	var rootElement;
	var chartElement;

	function createChart()
	{
		nv.addGraph(function() {

			switch(currentSettings.render_type)
			{
				case "line":
					chart = nv.models.lineChart()
						.useInteractiveGuideline(true);
					break;
				case "bar":
					chart = nv.models.multiBarChart()
						.reduceXTicks(true)
						.showControls(true);
					break;
			}

			chart.transitionDuration(350)
				.showLegend(true)
				.showYAxis(true)
				.showXAxis(true);

			if(!_.isUndefined(currentSettings.y_label) && currentSettings.y_label != "")
			{
				chart.margin({left: 75});
			}

			chart.xAxis
				.axisLabel(currentSettings.x_label);

			chart.yAxis
				.axisLabel(currentSettings.y_label);

			refreshChartData();

			return chart;
		});
	}

	function refreshChartData()
	{
		if(chart && chartData)
		{
			//var id = "#" + chartElement.attr("id"); // For some reason we can only select by ID here. Not exactly sure why.
			d3.select(chartElement.get(0)).datum(chartData).transition().duration(500).call(chart);
		}
	}

	function resetChartElement(element)
	{
		rootElement = $(element);
		chartElement = $('<svg id=""></svg>').uniqueId();
		$(element).empty().append(chartElement);
		chart = null;
	}

	function updateSize()
	{
		if(chartElement)
		{
			chartElement.css({
				width : rootElement.width(),
				height: rootElement.height()
			});
		}

		if(chart && chart.update)
		{
			chart.update();
		}
	}

	this.render = function (element){
		resetChartElement(element);
	}

	this.onSettingsChanged = function (newSettings) {
		currentSettings = newSettings;

		updateSize();
		resetChartElement(rootElement);
		createChart();
	}

	this.onSizeChanged = function () {
		updateSize();
	}

	function createSeriesData(data, xSelector, ySelector, name, color)
	{
		var newData = [];

		_.each(data, function(point)
		{
			newData.push({
				x : Number(point[xSelector]),
				y : Number(point[ySelector])
			});
		});

		return {
			key : name,
			values : newData,
			color : color
		};
	}

	this.onCalculatedValueChanged = function (settingName, newValue)
	{
		if(settingName === "data_points")
		{
			if(_.isArray(newValue))
			{
				chartData = [];

				if(currentSettings.series_1_x && currentSettings.series_1_y)
				{
					chartData.push(createSeriesData(newValue, currentSettings.series_1_x, currentSettings.series_1_y, currentSettings.series_1_name, 'steelblue'));
				}

				refreshChartData();
			}
		}
	}

	this.onDispose = function () {

	}

	this.getHeight = function () {
		return Number(currentSettings.height);
	}

	this.onSettingsChanged(settings);
};

freeboard.loadWidgetPlugin({
	type_name: "chart_widget",
	display_name: "Chart",
	"external_scripts": [
		"plugins/thirdparty/nv.d3.min.css",
		"plugins/thirdparty/d3.v3.js",
		"plugins/thirdparty/nv.d3.min.js"
	],
	settings: [
		{
			name: "title",
			display_name: "Title",
			type: "text"
		},
		{
			name: "render_type",
			display_name: "Type",
			type: "option",
			options: [
				{
					name: "Line",
					value: "line"
				},
				{
					name: "Area",
					value: "area"
				},
				{
					name: "Bar",
					value: "bar"
				},
				{
					name: "Stack",
					value: "stack"
				},
				{
					name: "Scatter",
					value: "scatterplot"
				}
			]
		},
		{
			name: "data_points",
			display_name: "Data Path",
			type: "calculated",
			description : "A path to a series of data (an array)"
		},
		{
			name: "x_label",
			display_name: "X Axis Label",
			type: "text"
		},
		{
			name: "y_label",
			display_name: "Y Axis Label",
			type: "text"
		},
		{
			name: "series_1_name",
			display_name: "Series 1 Name",
			type: "text",
			description : ""
		},
		{
			name: "series_1_x",
			display_name: "Series 1 X",
			type: "text",
			description : ""
		},
		{
			name: "series_1_y",
			display_name: "Series 1 Y",
			type: "text",
			description : ""
		},
		{
			"name": "height",
			"display_name": "Height Blocks",
			"type": "number",
			"default_value": 4,
			"description": "A height block is around 60 pixels"
		}
	],
	newInstance: function (settings, newInstanceCallback) {
		newInstanceCallback(new chartWidget(settings));
	}
});