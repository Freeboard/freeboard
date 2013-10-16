deccoboard.loadDatasourcePlugin((function()
{
	var bugswarmDatasource = function(settings, updateCallback)
	{
		var self = this;



		this.updateNow = function()
		{
		}

		this.dispose = function()
		{
		}
	};

	return {
		type_name  : "bugswarm",
		display_name : "Bug Swarm",
		settings   : [
			{
				name        : "swarm_id",
				display_name: "Swarm ID",
				type        : "text"
			}
		],
		newInstance: function(settings, updateCallback)
		{
			return new bugswarmDatasource(settings, updateCallback);
		}
	};
}()));