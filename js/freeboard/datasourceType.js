var ko = require('ko');

ko.virtualElements.allowedBindings.datasourceTypeSettings = true;

ko.bindingHandlers.datasourceTypeSettings = {
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    processPluginSettings(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
  }
};
