function WidgetModel(theFreeboardModel, widgetPlugins) {
	function disposeWidgetInstance() {
		if (!_.isUndefined(self.widgetInstance)) {
			if (_.isFunction(self.widgetInstance.onDispose)) {
				self.widgetInstance.onDispose();
			}

			self.widgetInstance = undefined;
		}
	}

	var self = this;

	this.datasourceRefreshNotifications = {};
	this.calculatedSettingScripts = {};

	this.title = ko.observable();
	this.fillSize = ko.observable(false);

	this.type = ko.observable();
	this.type.subscribe(function (newValue) {
		disposeWidgetInstance();

		if ((newValue in widgetPlugins) && _.isFunction(widgetPlugins[newValue].newInstance)) {
			var widgetType = widgetPlugins[newValue];

			function finishLoad() {
				widgetType.newInstance(self.settings(), function (widgetInstance) {

					self.fillSize((widgetType.fill_size === true));
					self.widgetInstance = widgetInstance;
					self.shouldRender(true);
					self._heightUpdate.valueHasMutated();

				});
			}

			// Do we need to load any external scripts?
			if (widgetType.external_scripts) {
				head.js(widgetType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
			}
			else {
				finishLoad();
			}
		}
	});

	this.settings = ko.observable({});
	this.settings.subscribe(function (newValue) {
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSettingsChanged)) {
			self.widgetInstance.onSettingsChanged(newValue);
		}

		self.updateCalculatedSettings();
		self._heightUpdate.valueHasMutated();
	});

	this.processDatasourceUpdate = function (datasourceName) {
		var refreshSettingNames = self.datasourceRefreshNotifications[datasourceName];

		if (_.isArray(refreshSettingNames)) {
			_.each(refreshSettingNames, function (settingName) {
				self.processCalculatedSetting(settingName);
			});
		}
	}

	this.callValueFunction = function (theFunction) {
		return theFunction.call(undefined, theFreeboardModel.datasourceData);
	}

	this.processSizeChange = function () {
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSizeChanged)) {
			self.widgetInstance.onSizeChanged();
		}
	}

	this.processCalculatedSetting = function (settingName) {
		if (_.isFunction(self.calculatedSettingScripts[settingName])) {
			var returnValue = undefined;

			try {
				returnValue = self.callValueFunction(self.calculatedSettingScripts[settingName]);
			}
			catch (e) {
				var rawValue = self.settings()[settingName];

				// If there is a reference error and the value just contains letters and numbers, then
				if (e instanceof ReferenceError && (/^\w+$/).test(rawValue)) {
					returnValue = rawValue;
				}
			}

			if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onCalculatedValueChanged) && !_.isUndefined(returnValue)) {
				try {
					self.widgetInstance.onCalculatedValueChanged(settingName, returnValue);
				}
				catch (e) {
					console.log(e.toString());
				}
			}
		}
	}

	this.updateCalculatedSettings = function () {
		self.datasourceRefreshNotifications = {};
		self.calculatedSettingScripts = {};

		if (_.isUndefined(self.type())) {
			return;
		}

		// Check for any calculated settings
		var settingsDefs = widgetPlugins[self.type()].settings;
		var datasourceRegex = new RegExp("datasources.([\\w_-]+)|datasources\\[['\"]([^'\"]+)", "g");
		var currentSettings = self.settings();

		_.each(settingsDefs, function (settingDef) {
			if (settingDef.type == "calculated") {
				var script = currentSettings[settingDef.name];

				if (!_.isUndefined(script)) {

					if(_.isArray(script)) {
						script = "[" + script.join(",") + "]";
					}

					// If there is no return, add one
					if ((script.match(/;/g) || []).length <= 1 && script.indexOf("return") == -1) {
						script = "return " + script;
					}

					var valueFunction;

 					try {
						valueFunction = new Function("datasources", script);
					}
					catch (e) {
						var literalText = currentSettings[settingDef.name].replace(/"/g, '\\"').replace(/[\r\n]/g, ' \\\n');

						// If the value function cannot be created, then go ahead and treat it as literal text
						valueFunction = new Function("datasources", "return \"" + literalText + "\";");
					}

					self.calculatedSettingScripts[settingDef.name] = valueFunction;
					self.processCalculatedSetting(settingDef.name);

					// Are there any datasources we need to be subscribed to?
					var matches;

					while (matches = datasourceRegex.exec(script)) {
						var dsName = (matches[1] || matches[2]);
						var refreshSettingNames = self.datasourceRefreshNotifications[dsName];

						if (_.isUndefined(refreshSettingNames)) {
							refreshSettingNames = [];
							self.datasourceRefreshNotifications[dsName] = refreshSettingNames;
						}

						if(_.indexOf(refreshSettingNames, settingDef.name) == -1) // Only subscribe to this notification once.
						{
							refreshSettingNames.push(settingDef.name);
						}
					}
				}
			}
		});
	}

	this._heightUpdate = ko.observable();
	this.height = ko.computed({
		read: function () {
			self._heightUpdate();

			if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.getHeight)) {
				return self.widgetInstance.getHeight();
			}

			return 1;
		}
	});

	this.shouldRender = ko.observable(false);
	this.render = function (element) {
		self.shouldRender(false);
		if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.render)) {
			self.widgetInstance.render(element);
			self.updateCalculatedSettings();
		}
	}

	this.dispose = function () {

	}

	this.serialize = function () {
		return {
			title: self.title(),
			type: self.type(),
			settings: self.settings()
		};
	}

	this.deserialize = function (object) {
		self.title(object.title);
		self.settings(object.settings);
		self.type(object.type);
	}
}
