// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function()
{
	var messageUpdatedFunctions = [];
	var swarmConnected = false;
	var swarmAvailable = false;

	// Load the bugswarm API javascript if it's not already loaded
	head.js({bugswarm: "http://cdn.buglabs.net/swarm/swarm-v0.6.0.js"}, function()
	{
		swarmAvailable = true;
	});

	function onPresence(presence)
	{
	}

	function onMessage(message)
	{
		_.each(messageUpdatedFunctions, function(messageUpdatedFunction)
		{
			messageUpdatedFunction(message);
		});
	}

	function onError(error)
	{
		console.log('Bugswarm error! -> ' + JSON.stringify(error));
	}

	function onConnect()
	{
		swarmConnected = true;
	}

	function processStartup(pluginInstance)
	{
		if(swarmAvailable && !swarmConnected)
		{
			SWARM.connect({ apikey: "bc60aa60d80f7c104ad1e028a5223e7660da5f8c",
				resource          : "5cf5ad58fa9ad98a01841fde8e1761b2ca473dbf",
				swarms            : ["69df1aea11433b3f85d2ca6e9c3575a9c86f8182"],
				onmessage         : onMessage,
				onpresence        : onPresence,
				onerror           : onError,
				onconnect         : onConnect
			});
		}

		if(!_.isUndefined(pluginInstance))
		{
			messageUpdatedFunctions.push(pluginInstance.messageReceived);
		}
	}

	function processShutdown(pluginInstance)
	{
		var index = messageUpdatedFunctions.indexOf(pluginInstance.messageReceived);

		if(index != -1)
		{
			messageUpdatedFunctions.splice(index, 1);
		}

		if(messageUpdatedFunctions.length == 0)
		{
			SWARM.disconnect();
			swarmConnected = false;
		}
	}

	var rl78Datasource = function(settings, updateCallback)
	{
		var self = this;
		var currentSettings = settings;
		var deviceState = {};

		this.updateNow = function()
		{
			// Not implemented
		}

		this.onDispose = function()
		{
			processShutdown(self);
		}

		this.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;
		}

		this.messageReceived = function(message)
		{
			if(message.from.resource == currentSettings.device_resource_id)
			{
				var sensorName = message.payload.name;
				var sensorValue = message.payload.feed;

				if(!_.isUndefined(sensorName) && !_.isUndefined(sensorValue))
				{
					switch (sensorName)
					{
						case "Acceleration":
						{
							deviceState["Acceleration_X"] = sensorValue["x"];
							deviceState["Acceleration_Y"] = sensorValue["y"];
							deviceState["Acceleration_Z"] = sensorValue["z"];
							break;
						}
						case "Button":
						{
							deviceState["Button_1"] = sensorValue["b1"];
							deviceState["Button_2"] = sensorValue["b2"];
							deviceState["Button_3"] = sensorValue["b3"];
							break;
						}
						case "Light":
						{
							deviceState["Light"] = sensorValue["Value"];
							break;
						}
						case "Potentiometer":
						{
							deviceState["Potentiometer"] = sensorValue["Raw"];
							break;
						}
						case "Sound Level":
						{
							deviceState["Sound"] = sensorValue["Raw"];
							break;
						}
						case "Temperature":
						{
							deviceState["Temperature"] = sensorValue["TempF"];
							break;
						}
						default:
						{
							deviceState[sensorName] = sensorValue;
						}
					}

					updateCallback(deviceState);
				}
			}
		}

		processStartup(self);
	};

	freeboard.loadDatasourcePlugin({
		type_name   : "rl78",
		display_name: "Renesas RL78",
		settings    : [
			{
				name        : "device_resource_id",
				display_name: "Board ID",
				type        : "text"
			}
		],
		newInstance : function(settings, updateCallback)
		{
			return new rl78Datasource(settings, updateCallback);
		}
	});

	var jsonDatasource = function(settings, updateCallback)
	{
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;

		function updateRefresh(refreshTime)
		{
			if(updateTimer)
			{
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function()
			{
				self.updateNow();
			}, refreshTime);
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function()
		{
			$.ajax({
				url       : currentSettings.url,
				dataType  : (currentSettings.is_jsonp) ? "JSONP" : "JSON",
				beforeSend: function(xhr)
				{
					try
					{
						_.each(currentSettings.headers, function(header)
						{
							var name = header.name;
							var value = header.value;

							if(!_.isUndefined(name) && !_.isUndefined(value))
							{
								xhr.setRequestHeader(name, value);
							}
						});
					}
					catch(e)
					{
					}
				},
				success   : function(data)
				{
					updateCallback(data);
				},
				error     : function(xhr, status, error)
				{
				}
			});
		}

		this.onDispose = function()
		{
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name  : "JSON",
		settings   : [
			{
				name        : "url",
				display_name: "URL",
				type        : "text"
			},
			{
				name         : "refresh",
				display_name : "Refresh Every",
				type         : "number",
				suffix       : "seconds",
				default_value: 5
			},
			{
				name        : "is_jsonp",
				display_name: "Is JSONP",
				type        : "boolean"
			},
			{
				name        : "headers",
				display_name: "Headers",
				type        : "array",
				settings    : [
					{
						name        : "name",
						display_name: "Name",
						type        : "text"
					},
					{
						name        : "value",
						display_name: "Value",
						type        : "text"
					}
				]
			}
		],
		newInstance: function(settings, updateCallback)
		{
			return new jsonDatasource(settings, updateCallback);
		}
	});

	var openWeatherMapDatasource = function(settings, updateCallback)
	{
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;

		function updateRefresh(refreshTime)
		{
			if(updateTimer)
			{
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function()
			{
				self.updateNow();
			}, refreshTime);
		}

		function toTitleCase(str)
		{
			return str.replace(/\w\S*/g, function(txt)
			{
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function()
		{
			$.ajax({
				url       : "http://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentSettings.location) + "&units=" + currentSettings.units,
				dataType  : "JSONP",
				success   : function(data)
				{
					// Rejigger our data into something easier to understand
					var newData = {
						place_name      : data.name,
						sunrise         : (new Date(data.sys.sunrise * 1000)).toLocaleTimeString(),
						sunset          : (new Date(data.sys.sunset * 1000)).toLocaleTimeString(),
						conditions      : toTitleCase(data.weather[0].description),
						current_temp    : data.main.temp,
						high_temp       : data.main.temp_max,
						low_temp        : data.main.temp_min,
						pressure        : data.main.pressure,
						humidity        : data.main.humidity,
						wind_speed      : data.wind.speed,
						wind_direction  : data.wind.deg
					};

					updateCallback(newData);
				},
				error     : function(xhr, status, error)
				{
				}
			});
		}

		this.onDispose = function()
		{
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name  : "openweathermap",
		display_name: "Open Weather Map API",
		settings   : [
			{
				name        : "location",
				display_name: "Location",
				type        : "text",
				description : "Example: London, UK"
			},
			{
				name        : "units",
				display_name: "Units",
				type   : "option",
				default : "imperial",
				options: [
					{
						name : "Imperial",
						value: "imperial"
					},
					{
						name : "Metric",
						value: "metric"
					}
				]
			},
			{
				name         : "refresh",
				display_name : "Refresh Every",
				type         : "number",
				suffix       : "seconds",
				default_value: 5
			}
		],
		newInstance: function(settings, updateCallback)
		{
			return new openWeatherMapDatasource(settings, updateCallback);
		}
	});

}());