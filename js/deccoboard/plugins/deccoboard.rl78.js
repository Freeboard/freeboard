var messageUpdatedFunctions = [];
var swarmConnected  = false;
var swarmAvailable = false;

// Load the bugswarm API javascript if it's not already loaded
head.js({bugswarm: "http://cdn.buglabs.net/swarm/swarm-v0.4.0.js"}, function()
{
	swarmAvailable = true;
	processStartup();
});

function onPresence(presence)
{
}

function onMessage(message)
{
	_.each(messageUpdatedFunctions, function(messageUpdatedFunction){
		messageUpdatedFunction(message);
	});
}

function onError(error)
{
	console.log('error! -> ' + JSON.stringify(error));
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

deccoboard.loadDatasourcePlugin((function()
{
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

				deviceState[sensorName] = sensorValue;

				updateCallback(deviceState);
			}
		}

		processStartup(self);
	};

	return {
		type_name   : "rl78",
		display_name: "RL78",
		settings    : [
			{
				name        : "device_resource_id",
				display_name: "Device Resource ID",
				type        : "text"
			}
		],
		newInstance : function(settings, updateCallback)
		{
			return new rl78Datasource(settings, updateCallback);
		}
	};
}()));