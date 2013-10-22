deccoboard.loadDatasourcePlugin((function()
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

	return {
		type_name : "JSON",
		settings : [
			{
				name : "url",
				display_name : "URL",
				type : "text"
			},
			{
				name : "refresh",
				display_name : "Refresh Every",
				type : "number",
				suffix : "seconds"
			},
			{
				name : "is_jsonp",
				display_name : "Is JSONP",
				type : "boolean"
			},
			{
				name : "headers",
				display_name : "Headers",
				type : "array",
				settings : [
					{
						name: "name",
						display_name: "Name",
						type: "text"
					},
					{
						name: "value",
						display_name: "Value",
						type: "text"
					}
				]
			}
		],
		newInstance: function(settings, updateCallback)
		{
			return new jsonDatasource(settings, updateCallback);
		}
	};
}()));