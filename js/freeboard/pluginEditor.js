var ko = require('ko');
ko.bindingHandlers.pluginEditor = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    var options = ko.unwrap(valueAccessor());

    var types = {};
    var settings;
    var title = '';

    if(options.type == 'datasource') {
      types = datasourcePlugins;
      title = 'Datasource';
    }
    else if(options.type == 'widget') {
      types = widgetPlugins;
      title = 'Widget';
    }
    else if(options.type == 'pane') {
      title = 'Pane';
    }

    $(element).click(function(event) {
      if(options.operation == 'delete') {
        var phraseElement = $('<p>Are you sure you want to delete this ' + title + '?</p>');
        createDialogBox(phraseElement, 'Confirm Delete', 'Yes', 'No', function() {

          if(options.type == 'datasource') {
            theFreeboardModel.deleteDatasource(viewModel);
          }
          else if(options.type == 'widget') {
            theFreeboardModel.deleteWidget(viewModel);
          }
          else if(options.type == 'pane') {
            theFreeboardModel.deletePane(viewModel);
          }

        });
      }
      else {
        var instanceName = undefined;
        var instanceType = undefined;

        if(options.type == 'datasource') {
          if(options.operation == 'add') {
            settings = {};
            instanceName = '';
          }
          else {
            instanceName = viewModel.name();
            instanceType = viewModel.type();
            settings = viewModel.settings();
          }
        }
        else if(options.type == 'widget') {
          if(options.operation == 'add') {
            settings = {};
          }
          else {
            instanceType = viewModel.type();
            settings = viewModel.settings();
          }
        }
        else if(options.type == 'pane') {
          settings = {};

          if(options.operation == 'edit') {
            settings.title = viewModel.title();
          }

          types = {
            settings: {
              settings: [ {
                name        : 'title',
                display_name: 'Title',
                type        : 'text'
              }
              ]
            }
          };
        }

        createPluginEditor(title, types, instanceName, instanceType, settings, function(newSettings) {
          if(options.operation == 'add') {
            if(options.type == 'datasource') {
              var newViewModel = new DatasourceModel();
              theFreeboardModel.addDatasource(newViewModel);

              newViewModel.settings(newSettings.settings);
              newViewModel.name(newSettings.name);
              newViewModel.type(newSettings.type);
            }
            else if(options.type == 'widget') {
              var newViewModel = new WidgetModel();
              newViewModel.settings(newSettings.settings);
              newViewModel.type(newSettings.type);

              viewModel.widgets.push(newViewModel);

              attachWidgetEditIcons(element);
            }
          }
          else if(options.operation == 'edit') {
            if(options.type == 'pane') {
              viewModel.title(newSettings.settings.title);
            }
            else {
              if(viewModel.name) {
                viewModel.name(newSettings.name);
              }

              viewModel.type(newSettings.type);
              viewModel.settings(newSettings.settings);
            }
          }
        });
      }
    });
  }
}

