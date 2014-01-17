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
		newInstance: function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback( new jsonDatasource(settings, updateCallback));
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
            self.updateNow();
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
		newInstance: function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback( new openWeatherMapDatasource(settings, updateCallback));
		}
	});

	var dweetioDatasource = function(settings, updateCallback)
	{
		var self = this;
		var currentSettings = settings;

		function onNewDweet(dweet)
		{
			updateCallback(dweet);
		}

		this.updateNow = function()
		{
			dweetio.get_latest_dweet_for(currentSettings.thing_id, function(err, dweet){
				if(err)
				{
					onNewDweet({});
				}
				else
				{
					onNewDweet(dweet[0].content);
				}
			});
		}

		this.onDispose = function()
		{

		}

		this.onSettingsChanged = function(newSettings)
		{
			dweetio.stop_listening();

			currentSettings = newSettings;

			dweetio.listen_for(currentSettings.thing_id, function(dweet)
			{
				onNewDweet(dweet.content);
			});
		}

		self.onSettingsChanged(settings);
	};

	freeboard.loadDatasourcePlugin({
		"type_name"   : "dweet_io",
		"display_name": "Dweet.io",
		"external_scripts" : [
			"http://dweet.io/client/dweet.io.min.js"
		],
		"settings"    : [
			{
				name        : "thing_id",
				display_name: "Thing Name",
				"description": "Example: salty-dog-1",
				type        : "text"
			}
		],
		newInstance : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new dweetioDatasource(settings, updateCallback));
		}
	});

}());