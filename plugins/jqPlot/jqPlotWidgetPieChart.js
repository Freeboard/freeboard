var pieCounter = 0;
//Filled/Unfilled Colored/Uncolored Pie Chart
var jqPlotWidgetPieChart = function (settings) {

	var self = this;    
	var currentSettings = settings;
	var htmlElement;
	var data; //example: [[ [ "CLOSED", 59 ], [ "OPEN", 12 ] ]]
	var title = currentSettings.title;
	var id = 'pieChart_' + pieCounter;
	var fill = currentSettings.fill;
	var chartHeight = 300;
	var chartWidth = 300;
	var options = createPieOptions(title, fill);


	//seems to be called once (or after settings change)
	this.render = function (element) {
		console.log('render');

		//add external css
		$(element).append('<link rel="stylesheet" href="plugins/jqPlot/1.0.8/css/jquery.jqplot.css" />');      

		//add the chart div to the dom
		var chartDiv = '<div id="' + id + '" style="height:' + currentSettings.chartHeight + 'px;width:' + currentSettings.chartWidth + 'px;"></div>';
		console.log(chartDiv);
		htmlElement = $(chartDiv);
		$(element).append(htmlElement);
		pieCounter++;
	}

	this.onSettingsChanged = function (newSettings) {
		currentSettings = newSettings;
		title = currentSettings.title;
		fill = currentSettings.fill
		chartHeight = currentSettings.chartHeight;
		chartWidth = currentSettings.chartWidth;
		$('#'+ id + '').height(chartHeight);
		$('#'+ id + '').width(chartWidth);
		options = createPieOptions(title, fill);
	}

	//seems to be called after render whenever a calculated value changes
	this.onCalculatedValueChanged = function (settingName, newValue) {
		console.log('onCalculatedValueChanged for ' + settingName);

		if (settingName == 'data')
			data = newValue;

		//render the chart
		htmlElement.empty();
		$.jqplot(id, data, options);
	}

	this.onDispose = function () {
	}

	this.getHeight = function () {
		return Number(currentSettings.height);
	}

	this.onSettingsChanged(settings);
};

freeboard.loadWidgetPlugin({
	"type_name": "jqPlotWidgetPieChart",
	"display_name": "jqPlot Pie Chart",    
	"fill_size": true,
	"external_scripts": [
	                     "plugins/jqPlot/1.0.8/js/jquery.jqplot.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.pieRenderer.min.js"
	                     ],    
	                     "settings": [    
	                                  {
	                                	  "name": "title",
	                                	  "display_name": "Title",
	                                  },  
	                                  {
	                                	  "name": "data",
	                                	  "display_name": "Chart Data",
	                                	  "type": "calculated",
	                                	  "description": "The data to plot"
	                                  },
	                                  {
	                                	  "name": "chartHeight",
	                                	  "display_name": "Chart Height (px)",
	                                	  "type": "number",
	                                	  "default_value": 300,
	                                	  "description": "chart height in pixels"
	                                  },
	                                  {
	                                	  "name": "chartWidth",
	                                	  "display_name": "Chart Width (px)",
	                                	  "type": "number",
	                                	  "default_value": 300,
	                                	  "description": "chart width in pixels"
	                                  },      
	                                  {
	                                	  "name": "height",
	                                	  "display_name": "Height Blocks",
	                                	  "type": "number",
	                                	  "default_value": 5,
	                                	  "description": "A height block is around 60 pixels"
	                                  },
	                                  {
	                                	  "name": "fill",
	                                	  "display_name": "Fill Pie Chart",
	                                	  "type": "boolean",
	                                	  "default_value": true,
	                                	  "description": "Fill the pie chart"
	                                  }

	                                  ],
	                                  newInstance: function (settings, newInstanceCallback) {
	                                	  newInstanceCallback(new jqPlotWidgetPieChart(settings));
	                                  }
});

function createPieOptions (title, fill) {
	var opt = {
			title:title, 
			seriesDefaults: {
				renderer: $.jqplot.PieRenderer,
				rendererOptions: {
					// Turn off filling of slices.
					fill: fill,
					showDataLabels: true, 
					// Add a margin to seperate the slices.
					sliceMargin: 4, 
					// stroke the slices with a little thicker line.
					lineWidth: 5
				}
			},
			grid: {
			    drawGridLines: true,        // wether to draw lines across the grid or not.
			        gridLineColor: '#2a2a2a',   // CSS color spec of the grid lines.
			        background: '#2a2a2a',      // CSS color spec for background color of grid.
			        borderWidth: 0.0,           // pixel width of border around grid.
			        shadow: false               // draw a shadow for grid
			},
			legend: {
				show: true, 
				location: 'e' 
			}
	};
	return opt;
}
