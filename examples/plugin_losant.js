(function()
{
	freeboard.loadDatasourcePlugin({
		"type_name"   : "losant_device_data",
		"display_name": "Losant Device Data",
    "description" : "Query the Losant API for a device's most recently reported attribute value.",
		"settings"    : [
			{
				"name"         : "applicationKey",
				"display_name" : "Access Key",
				"type"         : "text",
        "required" : true
			},
			{
				"name"					: "applicationSecret",
				"display_name"	: "Access Secret",
				"type"					: "text",
        "required"			: true
			},
			{
				"name"        	: "deviceId",
				"display_name"	: "Device ID",
				"type"        	: "text",
				"required"			: true
			},
			{
				"name"         	: "attribute",
				"display_name" 	: "Attribute",
				"type"         	: "text",
        "required" 			: true
			},
			{
				"name"         	: "refreshTime",
				"display_name" 	: "Refresh Time (ms)",
				"type"         	: "text",
				"default_value"	: 60000,
				"required" 			: true
			}
		],
		newInstance   : function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new myDatasourcePlugin(settings, updateCallback));
		}
	});
	var myDatasourcePlugin = function(settings, updateCallback)
	{
		// a constant
		var tokenTTL = 3600000; // 24 hours. fetch a new token after this amount of time.

		var self = this;
		var currentSettings = settings;

		var accessToken = {}; // { applicationId, token, expires (now plus tokenTTL)}

		function getData() {
			return getAccessToken(currentSettings.deviceId, currentSettings.applicationKey, currentSettings.applicationSecret)
				.then(function(authResult) {
					return getDeviceData(authResult.applicationId, currentSettings.deviceId, currentSettings.attribute, authResult.token);
				}).then(function(data) {
					return updateCallback(data);
				}).fail(function(err) {
					return updateCallback({
						code: err && err.status,
						message: err && err.responseJSON && err.responseJSON.message,
						type: err && err.responseJSON && err.responseJSON.type,
						value: null, // so the gauge stops showing the previous value
						time: new Date() // set to now
					});
				});
		}

		function getDeviceData(applicationId, deviceId, attribute, token) {
			var query = {
				attribute: attribute,
				deviceIds: [deviceId]
			};
			return $.ajax({
				type: 'POST',
				url: 'https://api.losant.com/applications/'+applicationId+'/data/last-value-query',
				data: JSON.stringify(query),
				dataType: 'json',
				beforeSend: function (xhr) {
				  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
				},
				contentType: 'application/json'
			}).then(function(data) {
				// let's pare down to just a value and a timestamp
				return {
					value: data && data[deviceId] && data[deviceId].data && data[deviceId].data[attribute],
					time: data && data[deviceId] && new Date(data[deviceId].time)
				};
			});
		}

		function getAccessToken(deviceId, key, secret) {
			// 1. Do we have a token?
			// 2. Is the token still fresh?
			// 3. Do the credentials used to create the token match the credentials currently being passed into the function?
			// If YES to all three, return the token in memory
			var now = new Date().getTime();
			if(accessToken && accessToken.expires > now && accessToken.deviceId === deviceId && accessToken.key === key && accessToken.secret === secret) {
				var deferred = new $.Deferred();
				return deferred.resolve(accessToken);
			} else {
				// Otherwise, generate a new token
				var credentials = {
					deviceId: deviceId,
					key: key,
					secret: secret
				};
				return $.ajax({
					type: 'POST',
					url: 'https://api.losant.com/auth/device',
					data: JSON.stringify(credentials),
					dataType: 'json',
					contentType: 'application/json'
				}).then(function(data) {
					if(data.token) {
						// store the credentials we used to make the request.
						// we need these to fetch a new token if the user made any changes
						accessToken = {
							deviceId: deviceId,
							key: key,
							secret: secret,
							applicationId: data.applicationId,
							token: data.token,
							expires: new Date().getTime() + tokenTTL
						};
					}
					return accessToken;
				});
			}
		}

		// You'll probably want to implement some sort of timer to refresh your data every so often.
		var refreshTimer;

		function createRefreshTimer(interval)
		{
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}

			refreshTimer = setInterval(function()
			{
				// Here we call our getData function to update freeboard with new data.
				getData();
			}, interval);
		}

		// **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
		self.onSettingsChanged = function(newSettings)
		{
			// Here we update our current settings with the variable that is passed in.
			console.log('changed', newSettings);
			currentSettings = newSettings;
		};

		// **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
		self.updateNow = function()
		{
			// Most likely I'll just call getData() here.
			getData();
		};

		// **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
		self.onDispose = function()
		{
			// Probably a good idea to get rid of our timer.
			clearInterval(refreshTimer);
			refreshTimer = undefined;
		};

		// Here we call createRefreshTimer with our current settings, to kick things off, initially. Notice how we make use of one of the user defined settings that we setup earlier.
		createRefreshTimer(currentSettings.refreshTime);
	};

}());
