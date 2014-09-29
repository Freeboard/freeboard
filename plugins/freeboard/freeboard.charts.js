var chartWidget = function (settings) {

	var self = this;
	var currentSettings = settings;
	var chart;
	var chartData;
	var rootElement;

	function sampleChartData() {
		var sin = [],
			cos = [];

		for (var i = 0; i < 100; i++) {
			sin.push({x: i, y: Math.sin(i/10)});
			cos.push({x: i, y: .5 * Math.cos(i/10)});
		}

		return [
			{
				values: sin,
				key: 'Sine Wave',
				color: '#ff7f0e'
			},
			{
				values: cos,
				key: 'Cosine Wave',
				color: '#2ca02c'
			}
		];
	}

	function updateGraph(recreate)
	{
		if(rootElement)
		{
			var chartContainer = $("<svg></svg>").css({
				width : $(rootElement).width(),
				height: $(rootElement).height()
			});

			$(rootElement).empty().append(chartContainer);

			nv.addGraph(function() {
				chart = nv.models.lineChart()
						.useInteractiveGuideline(true)
					;

				chart.xAxis
					.axisLabel('Time (ms)')
					.tickFormat(d3.format(',r'))
				;

				chart.yAxis
					.axisLabel('Voltage (v)')
					.tickFormat(d3.format('.02f'))
				;

				d3.select(chartContainer[0])
					.datum(sampleChartData())
					.transition().duration(500)
					.call(chart)
				;

				return chart;
			});

		}
	}

	this.render = function (element){

		rootElement = $(element)[0];
	}

	this.onSettingsChanged = function (newSettings) {
		currentSettings = newSettings;
	}

	this.onSizeChanged = function () {

		if(chart)
		{
			chart.update();
		}

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

				updateGraph(true);
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
		"plugins/thirdparty/d3.v3.js",
		"plugins/thirdparty/nv.d3.min.css",
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