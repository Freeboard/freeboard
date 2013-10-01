// Add support for progress even on jQuery
(function(a)
{
	if(a.support.ajaxProgress = "onprogress"in a.ajaxSettings.xhr())
	{
		a.fn.ajaxProgress = function(a)
		{
			return this.bind("ajaxProgress", a)
		};
		a("html").bind("ajaxSend.ajaxprogress", function(a, b, d)
		{
			d.__jqXHR = b
		});
		var e = a.ajaxSettings.xhr.bind(a.ajaxSettings);
		a.ajaxSetup({xhr: function()
		{
			var c = this, b = e();
			b && b.addEventListener("progress", function(b)
			{
				c.global && a.event.trigger("ajaxProgress", [b, c.__jqXHR]);
				typeof c.progress === "function" && c.progress(c.__jqXHR, b)
			});
			return b
		}})
	}
})(jQuery);

var SPARKLINE_HISTORY_LENGTH = 100;

var deccoboardConfig;
var grid;
var updateTimer;

function closeCRUDModal()
{
	var modal_id = "#crud-dialog";
	$("#lean_overlay").fadeOut(200);
	$(modal_id).css({ 'display': 'none' });
}

function openCRUDModal()
{
	var modal_id = "#crud-dialog";
	var modal_width = $(modal_id).outerWidth();

	$(modal_id).find(".modal_close").click(function()
	{
		closeCRUDModal();
	});

	$("#lean_overlay").click(function()
	{
		closeCRUDModal();
	});

	$('#lean_overlay').css({ 'display': 'block', opacity: 0 });
	$('#lean_overlay').fadeTo(200, 0.8);

	$(modal_id).css({

		'display'    : 'block',
		'position'   : 'fixed',
		'opacity'    : 0,
		'z-index'    : 11000,
		'left'       : 50 + '%',
		'margin-left': -(modal_width / 2) + "px",
		'top'        : 120 + "px"

	});

	$(modal_id).fadeTo(200, 1);
}

function createCRUDObject(viewModel)
{
	var copy = new viewModel.constructor;
	copy.original = viewModel;

	_.each(_.pairs(viewModel), function(property){

		var propertyName = property[0];
		var propertyValue = property[1];

		if(ko.isObservable(propertyValue) && !ko.isComputed(propertyValue))
		{
			copy[propertyName](propertyValue());
		}
	});

	return copy;
}

function commitCRUDObject(crudObject)
{
	if(_.isUndefined(crudObject.original))
	{
		return;
	}

	_.each(_.pairs(crudObject), function(property)
	{
		var propertyName = property[0];
		var propertyValue = property[1];

		if(ko.isObservable(propertyValue) && !ko.isComputed(propertyValue))
		{
			crudObject.original[propertyName](propertyValue());
		}
	});
}

ko.bindingHandlers.grid = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		// Initialize our grid
		grid = $(element).gridster({
			widget_margins        : [10, 10],
			widget_base_dimensions: [300, 40]
		}).data("gridster");

		grid.disable();
	}
}

ko.bindingHandlers.widget = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		grid.add_widget(element, viewModel.width(), viewModel.height(), viewModel.col(), viewModel.row());

		if(bindingContext.$root.isEditing())
		{
			showWidgetEditIcons(true);
		}
	},
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		// If widget has been removed
		if(deccoboardConfig.widgets.indexOf(viewModel) == -1)
		{
			grid.remove_widget(element);
		}
		// If section has been added or removed
		else if($(element).attr("data-sizey") != viewModel.sections().length)
		{
			//var sizeY = Math.max(viewModel.sections().length, 1);
			grid.resize_widget($(element), undefined, viewModel.height());
		}

	}
}

ko.bindingHandlers.section = {
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		if(bindingContext.$root.isEditing())
		{
			attachSubSectionEditIcons(element);
		}
	}
}

ko.bindingHandlers.valueScript = {
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		$(element).empty();
		$(element).append('<script type="text/javascript">' + viewModel.valueScript() + '</script>');

		viewModel.update();
	}
}

ko.bindingHandlers.crud = {
	init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		$(element).click(function(e)
		{
			var options = ko.unwrap(valueAccessor());

			if(options.operation == 'add')
			{
				deccoboardConfig.currentCRUDObject(new window[options.model]);
			}
			else if(options.operation == 'delete')
			{
				deccoboardConfig.currentCRUDObject(viewModel);
			}
			else
			{
				deccoboardConfig.currentCRUDObject(createCRUDObject(viewModel));
			}

			deccoboardConfig.currentCRUDObjectParent = viewModel;
			deccoboardConfig.currentCRUDOperation(options.operation);
			deccoboardConfig.currentCRUDTemplate(options.template);

			openCRUDModal();

			e.preventDefault();
		});
	}
};

var sectionTypes = [
	{
		name       : "text",
		description: "Regular text",
		height     : 1
	},
	{
		name       : "big-text",
		description: "Big text",
		height     : 2
	},
	{
		name       : "sparkline",
		description: "Sparkline",
		height     : 2
	},
	{
		name       : "text-with-sparkline",
		description: "Regular text with sparkline",
		height     : 1
	}
];

var datasourceTypes = [
	"json",
	"jsonp"
];

function DeccoboardModel()
{
	var self = this;

	this.isEditing = ko.observable(false);
	this.allow_edit = ko.observable(true);
	this.currentCRUDTemplate = ko.observable("empty-crud-template");
	this.currentCRUDObjectParent = undefined;
	this.currentCRUDObject = ko.observable();
	this.currentCRUDOperation = ko.observable();

	this.datasources = ko.observableArray();
	this.widgets = ko.observableArray();
	this.datasourceData = {};

	this.datasourceTypes = datasourceTypes

	this.sectionTypes = sectionTypes;

	this.serialize = function()
	{
		var widgets = [];

		_.each(self.widgets(), function(widget)
		{
			widgets.push(widget.serialize());
		});

		var datasources = [];

		_.each(self.datasources(), function(datasource)
		{
			datasources.push(datasource.serialize());
		});

		return {
			allow_edit   : self.allow_edit(),
			widgets : widgets,
			datasources : datasources
		};
	}

	this.deserialize = function(object)
	{
		if(!_.isUndefined(object.allow_edit))
		{
			self.allow_edit(object.allow_edit);
		}

		_.each(object.datasources, function(datasourceConfig)
		{
			var datasource = new DatasourceModel();
			datasource.deserialize(datasourceConfig);
			self.addDatasource(datasource);
		});

		_.each(object.widgets, function(widgetConfig)
		{
			var widget = new WidgetModel();
			widget.deserialize(widgetConfig);
			self.widgets.push(widget);
		});
	}

	this.addDatasource = function(datasource)
	{
		self.datasources.push(datasource);
	}

	this.deleteDatasource = function(datasource)
	{
		delete self.datasourceData[datasource.name()];
		self.datasources.remove(datasource);
	}

	this.createWidget = function()
	{
		var newWidget = new WidgetModel();
		self.addWidget(newWidget);
	}

	this.addWidget = function(widget)
	{
		self.widgets.push(widget);
	}

	this.deleteWidget = function(widget)
	{
		widget.dispose();
		self.widgets.remove(widget);
	}

	this.deleteSection = function(section)
	{
		ko.utils.arrayForEach(self.widgets(), function(widget)
		{
			widget.sections.remove(section);
		});

		section.dispose();
	}

	this.commitCurrentCRUD = function()
	{
		var crudObject = self.currentCRUDObject();

		if(self.currentCRUDOperation() == "add")
		{
			if(crudObject instanceof DatasourceModel)
			{
				self.addDatasource(crudObject);
			}
			else if(crudObject instanceof SectionModel)
			{
				self.currentCRUDObjectParent.addSection(crudObject);
			}
		}
		else if(self.currentCRUDOperation() == "delete")
		{
			if(crudObject instanceof DatasourceModel)
			{
				self.deleteDatasource(crudObject);
			}
			else if(crudObject instanceof WidgetModel)
			{
				self.deleteWidget(crudObject);
			}
            else if(crudObject instanceof SectionModel)
            {
	            self.deleteSection(crudObject);
            }
		}
		else
		{
			commitCRUDObject(crudObject);
		}

		self.cancelCurrentCRUD();
	}

	this.toggleEditing = function()
	{
		var editing = !self.isEditing();
		self.isEditing(editing);

		if(!editing)
		{
			$("#main-header").animate({top: "-280px"}, 250);
			$(".gridster").animate({"margin-top": "20px"}, 250);
			$("#main-header").data().shown = false;

			$(".sub-section").unbind();

			grid.disable();
		}
		else
		{
			$("#main-header").animate({top: "0px"}, 250);
			$(".gridster").animate({"margin-top": "300px"}, 250);
			$("#main-header").data().shown = true;

			attachSubSectionEditIcons($(".sub-section"));

			grid.enable();
		}

		showWidgetEditIcons(editing);
	}

	this.cancelCurrentCRUD = function()
	{
		closeCRUDModal();

		self.currentCRUDObject();
		self.currentCRUDObjectParent = undefined;
		self.currentCRUDOperation();
		self.currentCRUDTemplate("empty-crud-template");
	}
}

function WidgetModel()
{
	var self = this;

	this.title = ko.observable();
	this.width = ko.observable(1);
	this.row = ko.observable(1);
	this.col = ko.observable(1);
	this.sections = ko.observableArray();

	this.addSection = function(section)
	{
		this.sections.push(section);
	}

	this.height = ko.computed({
		read: function()
		{
			var sumHeights = _.reduce(self.sections(), function(memo, section)
			{
				return memo + section.height();
			}, 0);

			return Math.max(2, sumHeights + 1);
		}
	});

	this.serialize = function()
	{
		var sections = [];

		_.each(self.sections(), function(section){
			sections.push(section.serialize());
		});

		return {
			title : self.title(),
			width : self.width(),
			row : self.row(),
			col : self.col(),
			sections : sections
		};
	}

	this.deserialize = function(object)
	{
		self.title(object.title);
		self.width(object.width);
		self.row(object.row);
		self.col(object.col);

		_.each(object.sections, function(sectionConfig)
		{
			var section = new SectionModel();
			section.deserialize(sectionConfig);
			self.sections.push(section);
		});
	}

	this.dispose = function()
	{
		ko.utils.arrayForEach(self.sections(), function(section)
		{
			section.dispose();
		});
	}
}

var sectionID = 0;
function SectionModel()
{
	var self = this;

	this.sectionID = ko.observable(++sectionID);
	this.title = ko.observable();
	this.type = ko.observable("text");
	this.value = ko.observable("");
	this.units = ko.observable();

	this.height = ko.computed({
		read: function()
		{
			var sectionType = _.findWhere(sectionTypes, {name: self.type()});

			if(sectionType)
			{
				return sectionType.height;
			}
			else
			{
				return 1;
			}
		}
	});

	this._refreshVal = ko.observable(0);
	this.refresh = ko.computed({
		read:function(){
			return self._refreshVal();
		},
		write:function(value){

			if(!_.isUndefined(self._dataSubscription))
			{
				self._dataSubscription.dispose();
				delete self._dataSubscription;
			}

			if(!_.isNumber(value))
			{
				// This is a reference to a datasource. We should update when it refreshes.
				var datasource = ko.utils.arrayFirst(deccoboardConfig.datasources(), function(item)
				{
					return (item.name() == value);
				});

				if(datasource)
				{
					self._dataSubscription = datasource.data.subscribe(function(){
						self.update();
					});
				}
			}

			self._refreshVal(value);
		}
	});

	this._updateDummy = ko.observable();

	this.computedValue = ko.computed(function(){

		self._updateDummy();

		var valueElement = $("#section-" + self.sectionID() + "-value");
		var value;

		// If an error existed here before, destroy it
		//valueElement.popover('destroy');

		var valueFunction = window["getSection" + self.sectionID() + "Value"];

		if(_.isUndefined(valueFunction))
		{
			return "";
		}

		try
		{
            var thisObject = {
                element : valueElement,
                current_value : self.currentComputedValue
            };

			value = window["getSection" + self.sectionID() + "Value"].call(thisObject, deccoboardConfig.datasourceData);
            self.currentComputedValue = value;

            if(self.type() == "text-with-sparkline" || self.type() == "sparkline")
            {
                updateSparkline("#section-" + self.sectionID() + "-sparkline", SPARKLINE_HISTORY_LENGTH, value);
            }
		}
		catch(e)
		{
			value = "Error";
			/*valueElement.popover({
				title    : "Error",
				content  : e.toString(),
				trigger  : "hover",
				container: "body"
			});*/
		}

		return value;
	});

	this.valueScript = ko.computed(function()
	{
		var script;
		var typeSpecIndex = self.value().indexOf("javascript:");

		if(typeSpecIndex == 0)
		{
			script = self.value().substring(11);

			// If there is no return, add one
			if((script.match(/;/g) || []).length <= 1 && script.indexOf("return") == -1)
			{
				script = "return " + script;
			}
		}
		else
		{
			typeSpecIndex = self.value().indexOf("datasource:");

			if(typeSpecIndex == 0)
			{
				script = 'return data.' + self.value().substring(11).trim() + ";";
			}
			else
			{
				script = 'return "' + self.value() + '";';
			}
		}

		return 'function getSection' + self.sectionID() + 'Value(datasources){ ' + script + ' }';
	});

	this.update = function()
	{
		self._updateDummy.valueHasMutated();
	}

	this.dispose = function()
	{
		if(self._dataSubscription)
		{
			self._dataSubscription.dispose();
		}
	}

	this.serialize = function()
	{
		return {
			title : self.title(),
			type : self.type(),
			value : self.value(),
			refresh : self.refresh(),
			units : self.units()
		};
	}

	this.deserialize = function(object)
	{
		self.title(object.title);
		self.type(object.type);
		self.value(object.value);
		self.refresh(object.refresh);
		self.units(object.units);
	}
}

function DatasourceModel()
{
	var self = this;

	this.name = ko.observable();
	this.type = ko.observable("json");
	this.url = ko.observable();
	this.headers = ko.observableArray();
	this.refresh = ko.observable(0);
	this.chunked = ko.observable(false);
	this.last_updated = ko.observable("never");
	this.last_error = ko.observable();
	this.data = ko.observable();

	this.serialize = function()
	{
		return {
			name : self.name(),
			type : self.type(),
			url : self.url(),
			headers : self.headers(),
			refresh : self.refresh(),
			chunked : self.chunked()
		};
	}

	this.deserialize = function(object)
	{
		self.name(object.name);
		self.type(object.type);
		self.url(object.url);
		self.refresh(object.refresh);
		self.chunked(object.chunked);

		_.each(object.headers, function(value, name)
		{
			var headerObject = {
				name : ko.observable(name),
				value: ko.observable(value)
			};

			self.headers.push(headerObject);
		});
	}

	this.update = function()
	{
		switch (self.type())
		{
			case "json":
			case "jsonp":
			{
				// If the response is chunked, then it's probably keep-alive which means we shouldn't allow it to refresh
				if(self.chunked())
				{
					self.refresh(0);
				}

				$.ajax({
					url: self.url(),
					dataType: self.type(),
					beforeSend: function(xhr)
					{
						try
						{
							ko.utils.arrayForEach(self.headers(), function(header)
							{
								var name = header.name();
								var value = header.value();

								if(!_.isUndefined(name) && !_.isUndefined(value))
								{
									xhr.setRequestHeader(name, value);
								}
							});
						}
						catch(e)
						{
							self.last_error(e);
						}
					},
					success: self.processData,
					progress: function(xhr, progressEvent)
					{
						if(self.chunked())
						{
							// xhr doesn't work, we'll have to use the target of the progress event
							xhr = progressEvent.currentTarget;

							var tokens = xhr.responseText.split("\r\n");

							_.each(tokens, function(token)
							{
								try
								{
									var data = JSON.parse(token);
									self.processData(data);
								}
								catch(e)
								{
								}
							});

							xhr.responseText = "";
						}
					},
					error: function(xhr, status, error)
					{
						self.last_error(error);
					}
				});

				break;
			}
		}
	}

	this.processData = function(data)
	{
		deccoboardConfig.datasourceData[self.name()] = data;
		self.data(data);

		var now = new Date();
		self.last_updated(now.toLocaleTimeString());
	}

	this.createHeader = function()
	{
		var header = {
			name: ko.observable(),
			value: ko.observable()
		};

		self.headers.push(header);

		return header;
	}

	this.deleteHeader = function(header)
	{
		self.headers.remove(header);
	}
}

function processUpdates()
{
	var now = new Date();
	var nowSeconds = Math.round(now.getTime() / 1000);

	ko.utils.arrayForEach(deccoboardConfig.datasources(), function(datasource)
	{
		var refreshInterval = datasource.refresh();

		if(refreshInterval == 0)
		{
			return;
		}

		var elapsedSeconds = nowSeconds - (datasource.last_update_time || 0);

		if(elapsedSeconds >= refreshInterval)
		{
			datasource.last_update_time = nowSeconds;
			datasource.update();
		}
	});

	ko.utils.arrayForEach(deccoboardConfig.widgets(), function(widget)
	{
		ko.utils.arrayForEach(widget.sections(), function(section)
		{
			var refreshInterval = section.refresh();

			if(refreshInterval > 0)
			{
				var elapsedSeconds = nowSeconds - (section.last_update_time || 0);

				if(elapsedSeconds >= refreshInterval)
				{
					section.last_update_time = nowSeconds;
					section.update();
				}
			}
		});
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
		type              : "line",
		height            : "100%",
		width             : "100%",
		fillColor         : false,
		lineColor         : "#FF9900",
		lineWidth         : 2,
		spotRadius        : 3,
		spotColor         : false,
		minSpotColor      : "#78AB49",
		maxSpotColor      : "#78AB49",
		highlightSpotColor: "#9D3926",
		highlightLineColor: "#9D3926"
	});
}

function showWidgetEditIcons(show)
{
	if(show)
	{
		$(".widget-tools").css("display", "block").animate({opacity: 1.0}, 250);
	}
	else
	{
		$(".widget-tools").animate({opacity: 0.0}, 250, function()
		{
			$().css("display", "none");
		});
	}
}

function attachSubSectionEditIcons(element)
{
	$(element).hover(function()
		{
			showSubSectionEditIcons(this, true);
		}, function()
		{
			showSubSectionEditIcons(this, false);
		});
}

function showSubSectionEditIcons(element, show)
{
    if(show)
    {
        $(element).find(".sub-section-tools").fadeIn(250);
    }
    else
    {
        $(element).find(".sub-section-tools").fadeOut(250);
    }
}

$(function()
{ //DOM Ready
	// Load our configuration
	deccoboardConfig = new DeccoboardModel();
	deccoboardConfig.deserialize(gridConfig);

	ko.applyBindings(deccoboardConfig);

	if(deccoboardConfig.allow_edit() && deccoboardConfig.widgets().length == 0)
	{
		deccoboardConfig.toggleEditing();
	}

	// Setup our update loop
	processUpdates();
	updateTimer = setInterval(processUpdates, 1000);

	// Initialize our modal overlay
	var overlay = $("<div id='lean_overlay'></div>");
	$("body").append(overlay);

	// Fade everything in
	$(".gridster").css("opacity", 1);
});