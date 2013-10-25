deccoboard.loadWidgetPlugin((function()
{
	var textWidget = function(settings)
	{
		var self = this;

		this.render = function(element)
		{
			$(element).append($('<h2 class="section-title">' + settings.title + '</h2>'));
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
				name        : "title",
				display_name: "Title",
				type        : "text"
			},
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