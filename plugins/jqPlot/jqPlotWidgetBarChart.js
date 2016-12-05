var barCounter = 0;
//Vertical or Horizontal Bar Chart
var jqPlotWidgetBarChart = function (settings) {
	var self = this;    
	var currentSettings = settings;
	var htmlElement;
	var data; //example: [[1,2,3]]
	var id = 'barChart_' + barCounter;
	var title = currentSettings.title;
	var layout = currentSettings.layout;
	var varyBarColors = currentSettings.varyBarColors;
	
	var options = createBarOptions(title, layout, varyBarColors);

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
		barCounter++;
	}

	this.onSettingsChanged = function (newSettings) {
		currentSettings = newSettings;
		title = currentSettings.title;
		layout = currentSettings.layout;
		varyBarColors = currentSettings.varyBarColors;
		chartHeight = currentSettings.chartHeight;
		chartWidth = currentSettings.chartWidth;
		$('#'+ id + '').height(chartHeight);
		$('#'+ id + '').width(chartWidth);
		options = createBarOptions(title, layout, varyBarColors);
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
	"type_name": "jqPlotWidgetBarChart",
	"display_name": "jqPlot Bar Chart",    
	"fill_size": true,
	"external_scripts": [
	                     "plugins/jqPlot/1.0.8/js/jquery.jqplot.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.barRenderer.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.categoryAxisRenderer.min.js",
	                     "plugins/jqPlot/1.0.8/js/jqplot.pointLabels.min.js"
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
		                                	  "name": "layout",
		                                	  "display_name": "Chart Layout",
		                                	  "type": "option",
		                                	  "options"     : [
			                                	                   {
			                                	                	   "name": "Vertical",
			                                	                	   "value": "vertical"
			                                	                   },
			                                	                   {
			                                	                	   "name": "Horizontal",
			                                	                	   "value": "horizontal"		                                	                	   
			                                	                   }
		                                	                   ]
		                                  },
		                                  {
		                                	  "name": "varyBarColors",
		                                	  "display_name": "Vary Bar Colors",
		                                	  "type": "boolean",
		                                	  "default_value": false,
		                                	  "description": "Different color for each bar"
		                                  }
	                                  ],
	                                  newInstance: function (settings, newInstanceCallback) {
	                                	  newInstanceCallback(new jqPlotWidgetBarChart(settings));
	                                  }
});

function createBarOptions(inTitle, inLayout, inVaryBarColors) {
	var opts = {
			title:inTitle, 
			seriesDefaults: {
				renderer:$.jqplot.BarRenderer,
                pointLabels: { show: true },
				rendererOptions: {
					barDirection: inLayout,
					varyBarColor: inVaryBarColors
				}
			},
			grid: {
			    drawGridLines: true,        // wether to draw lines across the grid or not.
			        gridLineColor: '#666666',   // CSS color spec of the grid lines.
			        background: '#2a2a2a',      // CSS color spec for background color of grid.
			        borderWidth: 0.0,           // pixel width of border around grid.
			        shadow: false               // draw a shadow for grid
			},
			axes: {
				xaxis: {
					renderer: $.jqplot.CategoryAxisRenderer
				}
			}
	};
	return opts;
}
