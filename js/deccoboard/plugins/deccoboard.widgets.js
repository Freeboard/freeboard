deccoboard.loadWidgetPlugin((function()
{
	var textWidget = function(settings)
	{
		var self = this;

		this.render = function(element)
		{

		}

		this.dispose = function()
		{

		}

		this.getHeight = function()
		{
			return 1;
		}
	};

	return {
		type_name  : "text_widget",
		display_name : "Text",
		settings   : [
			{
				name        : "value",
				display_name: "Value",
				type        : "script"
			},
			{
				name        : "units",
				display_name: "Units",
				type        : "text"
			}
		],
		newInstance: function(settings)
		{
			return new textWidget(settings);
		}
	};
}()));