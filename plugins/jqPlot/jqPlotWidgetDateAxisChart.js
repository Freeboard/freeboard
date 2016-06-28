var chartCounter = 0;
//Date Axis Chart
var jqPlotWidgetDateAxisChart = function (settings) {

	var self = this;    
	var currentSettings = settings;
	var htmlElement;
	var id = 'dateAxisChart_' + chartCounter;
	var data; //example: [ [['23-May-08', 578.55], ['20-Jun-08', 566.5], ['25-Jul-08', 480.88], ['22-Aug-08', 509.84],['26-Sep-08', 454.13], ['24-Oct-08', 379.75], ['21-Nov-08', 303], ['26-Dec-08', 308.56],['23-Jan-09', 299.14], ['20-Feb-09', 346.51], ['20-Mar-09', 325.99], ['24-Apr-09', 386.15]] ]
	var title = currentSettings.title;
	var showCursor  = currentSettings.showCursor;
	var options = createDateAxisOptions(title, showCursor);

	var chartHeight = 600;
	var chartWidth = 600;

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
		chartCounter++;
	}

	this.onSettingsChanged = function (newSettings) {
		currentSettings = newSettings;
		title = currentSettings.title;
		showCursor  = currentSettings.showCursor;
		chartHeight = currentSettings.chartHeight;
		chartWidth = currentSettings.chartWidth;
		$('#'+ id + '').height(chartHeight);
		$('#'+ id + '').width(chartWidth);
		options = createDateAxisOptions(title, showCursor);
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
	"type_name": "jqPlotWidgetDateAxisChart",
	"display_name": "jqPlot Date Axis Chart",    
	"fill_size": true,
	"external_scripts": [
	                     "plugins/jqPlot/1.0.8/js/jquery.jqplot.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.dateAxisRenderer.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.barRenderer.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.categoryAxisRenderer.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.highlighter.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.cursor.min.js"
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
		                                	  "default_value": 600,
		                                	  "description": "chart height in pixels"
		                                  },
		                                  {
		                                	  "name": "chartWidth",
		                                	  "display_name": "Chart Width (px)",
		                                	  "type": "number",
		                                	  "default_value": 600,
		                                	  "description": "chart width in pixels"
		                                  },      
		                                  {
		                                	  "name": "height",
		                                	  "display_name": "Height Blocks",
		                                	  "type": "number",
		                                	  "default_value": 10
		                                  },
		                                  {
		                                	  "name": "showCursor",
		                                	  "display_name": "Show Cursor",
		                                	  "type": "boolean",
		                                	  "default_value": false
		                                  }
	                                  ],
	                                  newInstance: function (settings, newInstanceCallback) {
	                                	  newInstanceCallback(new jqPlotWidgetDateAxisChart(settings));
	                                  }
});

function createDateAxisOptions(inTitle, showCursor){
	var opts = {
			title:inTitle, 
			axes:{
				xaxis:{
					renderer:$.jqplot.DateAxisRenderer,
				}
			},
			highlighter: {
				show: true,
				sizeAdjust: 7.5
			},
			grid: {
			    drawGridLines: true,        // wether to draw lines across the grid or not.
			        gridLineColor: '#666666',   // CSS color spec of the grid lines.
			        background: '#2a2a2a',      // CSS color spec for background color of grid.
			        borderWidth: 0.0,           // pixel width of border around grid.
			        shadow: false               // draw a shadow for grid
			},
			cursor: {
				show: showCursor
			}
	};
	return opts;
}