deccoboard.loadDatasourcePlugin((function()
{
	var bugswarmDatasource = function(settings, updateCallback)
	{
		var self = this;

		function onPresence(presence)
		{
			console.log('presence -> ' + Date.now() + ':' + JSON.stringify(presence));
		}

		function onMessage(message)
		{
			console.log('message -> ' + Date.now() + ': ' + JSON.stringify(message));
		}

		function onError(error)
		{
			console.log('error! -> ' + JSON.stringify(error));
		}

		function onConnect()
		{
			console.log('connected!');
		}

		var swarmIDs = [];

		_.each(settings.swarms, function(swarm){
			swarmIDs.push(swarm.swarm_id);
		});

		// Load the bugswarm API javascript if it's not already loaded
		head.js({bugswarm: "http://cdn.buglabs.net/swarm/swarm-v0.4.0.js"}, function()
		{
			SWARM.connect({ apikey: settings.api_key,
				resource          : settings.resource_id,
				swarms            : swarmIDs,
				onmessage         : onMessage,
				onpresence        : onPresence,
				onerror           : onError,
				onconnect         : onConnect
			});
		});

		this.updateNow = function()
		{
		}

		this.onDispose = function()
		{
			SWARM.disconnect();
		}

		this.onSettingsChanged = function(newSettings)
		{

		}
	};

	return {
		type_name  : "bugswarm",
		display_name : "Bug Swarm",
		settings   : [
			{
				name        : "api_key",
				display_name: "API Key",
				type        : "text"
			},
			{
				name        : "resource_id",
				display_name: "Consumer Resource ID",
				type        : "text"
			},
			{
				name        : "swarms",
				display_name: "Swarms",
				type        : "array",
				settings    : [
					{
						name        : "swarm_id",
						display_name: "Swarm ID",
						type        : "text"
					}
				]
			}
		],
		newInstance: function(settings, updateCallback)
		{
			return new bugswarmDatasource(settings, updateCallback);
		}
	};
}()));