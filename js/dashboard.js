var ACCESS_CODE = "355272e39ec44198bf0dec6f58a003b7";
var THING_ID = "1291d1ffb033";
var SPARKLINE_HISTORY_LENGTH = 100;

var mainPowerGauge;
var prePowerGauge;
var editing = false;
var grid;

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function createGauge(id, min, max)
{
    return new JustGage({
        id: id,
        value: 0,
        min: min,
        max: max,
        title: "Power",
        label: "%",
        showInnerShadow: false,
        valueFontColor: "#d3d4d4"
    });
}

function updateSparkline(id, maxValues, newValue)
{
    var values = $(id).data().values;

    if(!values)
    {
        values = [];
    }

    if(values.length >= maxValues)
    {
        values.shift();
    }

    values.push(newValue);

    $(id).data().values = values;

    $(id).sparkline(values, {
        type : "line",
        height: "100%",
        width: "100%",
        fillColor : false,
        lineColor : "#FF9900",
        lineWidth : 2,
        spotRadius : 3,
        spotColor: false,
        minSpotColor : "#78AB49",
        maxSpotColor : "#78AB49",
        highlightSpotColor : "#9D3926",
        highlightLineColor : "#9D3926"
    });
}

function updateDashboard() {
    $.getJSON("http://ops.bunkerstills.com/things/" + getParameterByName("still_id") + "/status?access_code=" + getParameterByName("access_code") + "&callback=?")
        .done(function (data) {

            var components = data.status.components;

            var onOff = !(components.startStopSwitch.value == "OFF" || components.startStopSwitch.value == "false" || components.startStopSwitch.value == false);

            if(onOff)
            {
                $("#pump-icon").show();
            }
            else
            {
                $("#pump-icon").hide();
            }

            $("#status-on-off").prop("checked", onOff);
            $("#status").text(components.operationState.value);

            if(onOff)
            {
                $("#pump-flow-rate").text(components.pumpFlowRate.value);
            }
            else
            {
                $("#pump-flow-rate").text("0.0");
            }

            var telemetryUpdateTime = new Date(data.status_update_time);
            $("#last-telemetry").text(telemetryUpdateTime.toLocaleTimeString());

            $("#pressure").text(components.ambientPressure.value);
            updateSparkline("#pressure-sparkline", SPARKLINE_HISTORY_LENGTH, components.ambientPressure.value);

            $("#heads-temp").text(components.headsTemp.value);
            updateSparkline("#heads-temp-sparkline", SPARKLINE_HISTORY_LENGTH, components.headsTemp.value);

            $("#hearts-temp").text(components.heartsTemp.value);
            updateSparkline("#hearts-temp-sparkline", SPARKLINE_HISTORY_LENGTH, components.heartsTemp.value);

            $("#tails-temp").text(components.tailsTemp.value);
            updateSparkline("#tails-temp-sparkline", SPARKLINE_HISTORY_LENGTH, components.tailsTemp.value);

            $("#sump-temp").text(components.calculatedSumpTemp.value);
            updateSparkline("#sump-temp-sparkline", SPARKLINE_HISTORY_LENGTH, components.calculatedSumpTemp.value);

            prePowerGauge.refresh(components.preHeaterPower.value);
            updateSparkline("#pre-heater-sparkline", SPARKLINE_HISTORY_LENGTH, components.preHeaterPower.value);

            mainPowerGauge.refresh(components.mainHeaterPower.value);
            updateSparkline("#main-heater-sparkline", SPARKLINE_HISTORY_LENGTH, components.mainHeaterPower.value);
        });
}

function toggleEdit()
{
	editing = !editing;

	if(!editing)
	{
		$("#main-header").animate({top: "-280px"}, 250);
		$(".gridster").animate({"margin-top": "20px"}, 250);
		$("#main-header").data().shown = false;


		$(".widget-tools").animate({opacity: 0.0}, 250, function(){
			$().css("display", "none");
		});

		grid.disable();
	}
	else
	{
		$("#main-header").animate({top:"0px"}, 250);
		$(".gridster").animate({"margin-top": "300px"}, 250);
		$("#main-header").data().shown = true;
		$(".widget-tools").css("display", "block").animate({opacity: 1.0}, 250);

		grid.enable();
	}
}

function updateSectionValue(section)
{
	var config = section.data("decco-config");
	var valueElement = $("#section-" + config.sectionID + "-value");

	var value;

	// If an error existed here before, destroy it
	//valueElement.popover('destroy');

	try
	{
		value = window["getSection" + config.sectionID + "Value"](datasourcesData);
	}
	catch(e)
	{
		value = "Error";
		/*valueElement.popover({
			title: "Error",
			content: e.toString(),
			trigger: "hover",
			container : "body"
		});*/
	}

	valueElement.text(value);
}

var sectionID = 0;
function addWidget(widgetConfig)
{
	var widget = $('<li><header><h1>' + widgetConfig.title + '</h1><div class="widget-tools"><i class="icon-wrench icon-white edit-widget"></i><i class="icon-trash icon-white delete-widget"></i></div></header></li>');

	var sectionContainer = $("<section></section>");
	widget.append(sectionContainer);

	grid.add_widget(widget, widgetConfig.width, widgetConfig.height, widgetConfig.col, widgetConfig.row);

	_.each(widgetConfig.sections, function(sectionConfig, index, list)
	{
		sectionID++;

		sectionConfig.sectionID = sectionID;

		var section = $('<div class="sub-section" id="' + sectionID + '"></div>');
		section.data("decco-config", sectionConfig);

		if(!_.isUndefined(sectionConfig.title))
		{
			section.append("<h2>" + sectionConfig.title + "</h2>");
		}

		var sectionValue = $('<div id="section-' + sectionID + '-value"></div>');
		section.append(sectionValue);

		switch(sectionConfig.type)
		{
			case "big-text":
			{
				sectionValue.addClass("big-text");
				break;
			}
		}

		var valueScript = $('<script type="text/javascript"></script>');
		section.append(valueScript);

		var script;
		var typeSpecIndex = sectionConfig.value.indexOf("javascript:");

		if(typeSpecIndex == 0)
		{
			script = sectionConfig.value.substring(11);

			// If there is no return, add one
			if((script.match(/;/g) || []).length <= 1 && script.indexOf("return") == -1)
			{
				script = "return " + script;
			}
		}
		else
		{
			typeSpecIndex = sectionConfig.value.indexOf("datasource:");

			if(typeSpecIndex == 0)
			{
				script = 'return data.' + sectionConfig.value.substring(11).trim() + ";";
			}
			else
			{
				script = 'return "' + sectionConfig.value + '";';
			}
		}

		valueScript.text('function getSection' + sectionID + 'Value(data){ ' + script + ' }');

		sectionContainer.append(section);

		if(!_.isUndefined(sectionConfig.refresh))
		{
			addUpdateSection(section);
		}
	});
}

function addDatasource(datasourceConfig)
{
	if(_.isUndefined(datasourceConfig.name))
	{
		return;
	}

	var interval = 0;

	if(!_.isUndefined(datasourceConfig.refresh))
	{
		interval = Number(datasourceConfig.refresh);
	}

	updateDatasources[datasourceConfig.name] = {
		last_update: Math.round(Date.now() / 1000),
		interval   : interval,
		config     : datasourceConfig,
		sections    : []
	};

	doUpdateDatasource(updateDatasources[datasourceConfig.name]);

	var datasourceTR = $('<tr id="datasource-' + datasourceConfig.name + '"></tr>');
	datasourceTR.append("<td>" + datasourceConfig.name + "</td>")
	$("#datasources-list").append(datasourceTR);
}

var updateSections = [];
var updateDatasources = {};
var datasourcesData = {};
function processUpdates()
{
	var now = Math.round(Date.now() / 1000);

	_.each(updateSections, function(updateSection)
	{
		var elapsedSeconds = now - updateSection.last_update;

		if(elapsedSeconds >= updateSection.interval)
		{
			updateSection.last_update = Math.round(Date.now() / 1000);
			updateSectionValue(updateSection.section);
		}
	});

	_.each(updateDatasources, function(updateDatasource)
	{
		if(updateDatasource.interval > 0)
		{
			var elapsedSeconds = now - updateDatasource.last_update;

			if(elapsedSeconds >= updateDatasource.interval)
			{
				updateDatasource.last_update = Math.round(Date.now() / 1000);
				doUpdateDatasource(updateDatasource);
			}
		}
	});
}

function doUpdateDatasource(datasource)
{
	switch(datasource.config.type)
	{
		case "json":
		{
			$.getJSON(datasource.config.url).done(function(data)
			{
				datasourcesData[datasource.config.name] = data;

				_.each(datasource.sections, function(section)
				{
					updateSectionValue(section);
				});
			});

			break;
		}
	}
}

function addUpdateSection(section)
{
	var config = section.data("decco-config");

	if(_.isUndefined(config.refresh))
	{
		return;
	}

	var data = {
		config     : config,
		section    : section
	};

	if(_.isNumber(config.refresh))
	{
		// If this is a number, add it to be refreshed at a given time
		updateSections.push({
			last_update : Math.round(Date.now() / 1000),
			interval : Number(config.refresh),
			config : config,
			section: section
		});

		updateSectionValue(section);
	}
	else if(config.refresh in updateDatasources)
	{
		// If this is a datasource name, add it to our datasources to be refreshed
		updateDatasources[config.refresh].sections.push(section);
	}
}

$(function () { //DOM Ready

    grid = $(".gridster ul").gridster({
        widget_margins: [10, 10],
        widget_base_dimensions: [140, 140]
    }).data("gridster");

	grid.disable();

	// Parse out our datasources
	_.each(gridConfig.datasources, function(datasourceConfig)
	{
		addDatasource(datasourceConfig);
	});

	// Parse our our widgets
	_.each(gridConfig.widgets, function(widgetConfig)
	{
		addWidget(widgetConfig);
	});

	processUpdates();
	setInterval(processUpdates, 1000);

	$("#toggle-header").on("click", toggleEdit);

    // Fade everything in
    $(".gridster").css("opacity", 1);
});