var SPARKLINE_HISTORY_LENGTH = 100;

var deccoboardConfig;
var editing = false;
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
			widget_base_dimensions: [300, 100]
		}).data("gridster");

		grid.disable();
	}
}

ko.bindingHandlers.widget = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		grid.add_widget(element, viewModel.width(), viewModel.height(), viewModel.col(), viewModel.row());
		showWidgetEditIcons(true);
	},
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		if(deccoboardConfig.widgets.indexOf(viewModel) == -1)
		{
			grid.remove_widget(element);
		}
	}
}

ko.bindingHandlers.valueScript = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		$(element).append('<script type="text/javascript">' + viewModel.valueScript() + '</script>');
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

			deccoboardConfig.currentCRUDOperation(options.operation);
			deccoboardConfig.currentCRUDTemplate(options.template);

			openCRUDModal();

			e.preventDefault();
		});
	}
};

function DeccoboardModel()
{
	var self = this;

	this.currentCRUDTemplate = ko.observable("empty-crud-template");
	this.currentCRUDObject = ko.observable();
	this.currentCRUDOperation = ko.observable();

	this.datasources = ko.observableArray();
	this.widgets = ko.observableArray();
	this.datasourceData = {};

	this.datasourceTypes = [
		"json"
	];

	this.deserialize = function(object)
	{
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
		ko.utils.arrayForEach(widget.sections(), function(section)
		{
			section._dataSubscription.dispose();
		});

		self.widgets.remove(widget);
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
		}
		else
		{
			commitCRUDObject(crudObject);
		}

		self.cancelCurrentCRUD();
	}

	this.cancelCurrentCRUD = function()
	{
		closeCRUDModal();

		self.currentCRUDObject();
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

	this.height = ko.computed({
		read: function()
		{
			return Math.max(1, self.sections().length);
		}
	});

	this.deserialize = function(object)
	{
		self.title(object.title);
		self.width(object.width);
		//self.height(object.height);
		self.row(object.row);
		self.col(object.col);

		_.each(object.sections, function(sectionConfig)
		{
			var section = new SectionModel();
			section.deserialize(sectionConfig);
			self.sections.push(section);
		});
	}
}

var sectionID = 0;
function SectionModel()
{
	var self = this;

	this.sectionID = ++sectionID;
	this.title = ko.observable();
	this.type = ko.observable();
	this.value = ko.observable("");
	this.units = ko.observable();

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

		var valueElement = $("#section-" + self.sectionID + "-value");
		var value;

		// If an error existed here before, destroy it
		//valueElement.popover('destroy');

		var valueFunction = window["getSection" + self.sectionID + "Value"];

		if(_.isUndefined(valueFunction))
		{
			return "";
		}

		try
		{
			value = window["getSection" + self.sectionID + "Value"](deccoboardConfig.datasourceData);
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

		if(self.type() == "text-with-sparkline" || self.type() == "sparkline")
		{
			updateSparkline("#section-" + self.sectionID + "-sparkline", SPARKLINE_HISTORY_LENGTH, value);
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

		return 'function getSection' + sectionID + 'Value(data){ ' + script + ' }';
	});

	this.update = function()
	{
		self._updateDummy.valueHasMutated();
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
	this.refresh = ko.observable(0);
	this.last_updated = ko.observable("never");
	this.data = ko.observable();

	this.deserialize = function(object)
	{
		self.name(object.name);
		self.type(object.type);
		self.url(object.url);
		self.refresh(object.refresh);
	}

	this.update = function()
	{
		switch (self.type())
		{
			case "json":
			{
				$.getJSON(self.url()).done(function(data)
				{
					deccoboardConfig.datasourceData[self.name()] = data;
					self.data(data);

					var now = new Date();
					self.last_updated(now.toLocaleTimeString());
				});

				break;
			}
		}
	}
}

function processUpdates()
{
	var now = new Date();
	var nowSeconds = Math.round(now.getTime() / 1000);

	ko.utils.arrayForEach(deccoboardConfig.datasources(), function(datasource)
	{
		var elapsedSeconds = nowSeconds - (datasource.last_update_time || 0);

		if(elapsedSeconds >= datasource.refresh())
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

function toggleEdit()
{
	editing = !editing;

	if(!editing)
	{
		$("#main-header").animate({top: "-280px"}, 250);
		$(".gridster").animate({"margin-top": "20px"}, 250);
		$("#main-header").data().shown = false;

		grid.disable();
	}
	else
	{
		$("#main-header").animate({top: "0px"}, 250);
		$(".gridster").animate({"margin-top": "300px"}, 250);
		$("#main-header").data().shown = true;

		grid.enable();
	}

	showWidgetEditIcons(editing);
}

$(function()
{ //DOM Ready
	// Load our configuration
	deccoboardConfig = new DeccoboardModel();
	deccoboardConfig.deserialize(gridConfig);
	ko.applyBindings(deccoboardConfig);

	$("#toggle-header").on("click", toggleEdit);

	// Setup our update loop
	processUpdates();
	updateTimer = setInterval(processUpdates, 1000);

	// Initialize our modal overlay
	var overlay = $("<div id='lean_overlay'></div>");
	$("body").append(overlay);

	// Fade everything in
	$(".gridster").css("opacity", 1);
});