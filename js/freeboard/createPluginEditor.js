var $ = require('jquery');
var _ = require('underscore');
function createPluginEditor(title, pluginTypes, currentInstanceName, currentTypeName, currentSettingsValues, settingsSavedCallback) {
  var newSettings = {
    name    : currentInstanceName,
    type    : currentTypeName,
    settings: {}
  };

  function createSettingRow(name, displayName) {
    var tr = $('<div id="setting-row-' + name + '" class="form-row"></div>').appendTo(form);

    tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
    return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);
  }


  var form = $('<div></div>');

  var pluginDescriptionElement = $('<div id="plugin-description"></div>').hide();
  form.append(pluginDescriptionElement);

  function createSettingsFromDefinition(settingsDefs) {
    _.each(settingsDefs, function(settingDef) {
      // Set a default value if one doesn't exist
      if(!_.isUndefined(settingDef.default_value) && _.isUndefined(currentSettingsValues[settingDef.name])) {
        currentSettingsValues[settingDef.name] = settingDef.default_value;
      }

      var displayName = settingDef.name;

      if(!_.isUndefined(settingDef.display_name)) {
        displayName = settingDef.display_name;
      }

      var valueCell = createSettingRow(settingDef.name, displayName);

      var settingTypes = {
        'array': function () {
          var subTableDiv = $('<div class="form-table-value-subtable"></div>').appendTo(valueCell);

          var subTable = $('<table class="table table-condensed sub-table"></table>').appendTo(subTableDiv);
          var subTableHead = $('<thead></thead>').hide().appendTo(subTable);
          var subTableHeadRow = $('<tr></tr>').appendTo(subTableHead);
          var subTableBody = $('<tbody></tbody>').appendTo(subTable);

          var currentSubSettingValues = [];

          // Create our headers
          _.each(settingDef.settings, function(subSettingDef) {
            var subsettingDisplayName = subSettingDef.name;

            if(!_.isUndefined(subSettingDef.display_name)) {
              subsettingDisplayName = subSettingDef.display_name;
            }

            $('<th>' + subsettingDisplayName + '</th>').appendTo(subTableHeadRow);
          });

          if(settingDef.name in currentSettingsValues) {
            currentSubSettingValues = currentSettingsValues[settingDef.name];
          }

          function processHeaderVisibility() {
            if(newSettings.settings[settingDef.name].length > 0) {
              subTableHead.show();
            }
            else {
              subTableHead.hide();
            }
          }

          function createSubsettingRow(subsettingValue) {
            var subsettingRow = $('<tr></tr>').appendTo(subTableBody);

            var newSetting = {};

            if(!_.isArray(newSettings.settings[settingDef.name])) {
              newSettings.settings[settingDef.name] = [];
            }

            newSettings.settings[settingDef.name].push(newSetting);

            _.each(settingDef.settings, function(subSettingDef) {
              var subsettingCol = $('<td></td>').appendTo(subsettingRow);
              var subsettingValueString = '';

              if(!_.isUndefined(subsettingValue[subSettingDef.name])) {
                subsettingValueString = subsettingValue[subSettingDef.name];
              }

              newSetting[subSettingDef.name] = subsettingValueString;

              $('<input class="table-row-value" type="text">').appendTo(subsettingCol).val(subsettingValueString).change(function() {
                newSetting[subSettingDef.name] = $(this).val();
              });
            });

            subsettingRow.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($('<li></li>').append($('<i class="icon-trash icon-white"></i>').click(function() {
              var subSettingIndex = newSettings.settings[settingDef.name].indexOf(newSetting);

              if(subSettingIndex !== -1) {
                newSettings.settings[settingDef.name].splice(subSettingIndex, 1);
                subsettingRow.remove();
                processHeaderVisibility();
              }
            })))));

            subTableDiv.scrollTop(subTableDiv[0].scrollHeight);

            processHeaderVisibility();
          }

          $('<div class="table-operation text-button">ADD</div>').appendTo(valueCell).click(function() {
            var newSubsettingValue = {};

            _.each(settingDef.settings, function(subSettingDef) {
              newSubsettingValue[subSettingDef.name] = '';
            });

            createSubsettingRow(newSubsettingValue);
          });

          // Create our rows
          _.each(currentSubSettingValues, function(currentSubSettingValue, subSettingIndex) {
            createSubsettingRow(currentSubSettingValue);
          });
        },
        'boolean': function () {
          newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

          var onOffSwitch = $('<div class="onoffswitch"><label class="onoffswitch-label" for="' + settingDef.name + '-onoff"><div class="onoffswitch-inner"><span class="on">YES</span><span class="off">NO</span></div><div class="onoffswitch-switch"></div></label></div>').appendTo(valueCell);

          var input = $('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + settingDef.name + '-onoff">').prependTo(onOffSwitch).change(function() {
            newSettings.settings[settingDef.name] = this.checked;
          });

          if(settingDef.name in currentSettingsValues) {
            input.prop('checked', currentSettingsValues[settingDef.name]);
          }

        },
        'options': function () {
          var defaultValue = currentSettingsValues[settingDef.name];

          var input = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(valueCell)).change(function() {
            newSettings.settings[settingDef.name] = $(this).val();
          });

          _.each(settingDef.options, function(option) {

            var optionName;
            var optionValue;

            if(_.isObject(option)) {
              optionName = option.name;
              optionValue = option.value;
            }
            else {
              optionName = option;
            }

            if(_.isUndefined(optionValue)) {
              optionValue = optionName;
            }

            if(_.isUndefined(defaultValue)) {
              defaultValue = optionValue;
            }

            $('<option></option>').text(optionName).attr('value', optionValue).appendTo(input);
          });

          newSettings.settings[settingDef.name] = defaultValue;

          if(settingDef.name in currentSettingsValues) {
            input.val(currentSettingsValues[settingDef.name]);
          }
        },
        'default': function () {
          newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];


          if(settingDef.type == 'calculated') {
            var input = $('<textarea></textarea>').appendTo(valueCell).change(function() {
              newSettings.settings[settingDef.name] = $(this).val();
            });

            if(settingDef.name in currentSettingsValues) {
              input.val(currentSettingsValues[settingDef.name]);
            }

            createValueEditor(input);

            var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');

            var datasourceTool = $('<li><i class="icon-plus icon-white"></i><label>DATASOURCE</label></li>').mousedown(function(e) {
              e.preventDefault();
              $(input).focus();
              $(input).insertAtCaret('datasources[\'');
              $(input).trigger('freeboard-eval');
            });

            $(valueCell).append(datasourceToolbox.append(datasourceTool));
          }
          else {
            var input = $('<input type="text">').appendTo(valueCell).change(function() {
              if(settingDef.type == 'number') {
                newSettings.settings[settingDef.name] = Number($(this).val());
              }
              else {
                newSettings.settings[settingDef.name] = $(this).val();
              }
            });

            if(settingDef.name in currentSettingsValues) {
              input.val(currentSettingsValues[settingDef.name]);
            }
          }
        }
      };

      var setupSettingFunc = settingTypes[settingDef.type] || settingTypes['default'];
      setupSettingFunc();


      if(!_.isUndefined(settingDef.suffix)) {
        valueCell.append($('<div class="input-suffix">' + settingDef.suffix + '</div>'));
      }

      if(!_.isUndefined(settingDef.description)) {
        valueCell.append($('<div class="setting-description">' + settingDef.description + '</div>'));
      }
    });
  }

  function displayValidationError(settingName, errorMessage) {
    var errorElement = $('<div class="validation-error"></div>').html(errorMessage);
    $("#setting-value-container-" + settingName).append(errorElement);
  }

  function removeSettingsRows() {
    if($("#setting-row-instance-name").length) {
      $("#setting-row-instance-name").nextAll().remove();
    }
    else {
      $("#setting-row-plugin-types").nextAll().remove();
    }
  }

  createDialogBox(form, title, "Save", "Cancel", function() {
    $(".validation-error").remove();

    // Validate our new settings
    if(!_.isUndefined(currentInstanceName) && newSettings.name == "") {
      displayValidationError("instance-name", "A name is required.");
      return true;
    }

    if(_.isFunction(settingsSavedCallback)) {
      settingsSavedCallback(newSettings);
    }
  });

  // Create our body
  var pluginTypeNames = _.keys(pluginTypes);
  var typeSelect;

  if(pluginTypeNames.length > 1) {
    var typeRow = createSettingRow("plugin-types", "Type");
    typeSelect = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(typeRow));

    typeSelect.append($("<option>Select a type...</option>").attr("value", "undefined"));

    _.each(pluginTypes, function(pluginType) {
      typeSelect.append($("<option></option>").text(pluginType.display_name).attr("value", pluginType.type_name));
    });

    typeSelect.change(function() {
      newSettings.type = $(this).val();
      newSettings.settings = {};

      // Remove all the previous settings
      removeSettingsRows();

      var currentType = pluginTypes[typeSelect.val()];

      if(_.isUndefined(currentType)) {
        $("#setting-row-instance-name").hide();
        $("#dialog-ok").hide();
      }
      else {
        $("#setting-row-instance-name").show();

        if(currentType.description && currentType.description.length > 0) {
          pluginDescriptionElement.html(currentType.description).show();
        }
        else {
          pluginDescriptionElement.hide();
        }

        $("#dialog-ok").show();
        createSettingsFromDefinition(currentType.settings);
      }
    });
  }
  else if(pluginTypeNames.length == 1) {
    createSettingsFromDefinition(pluginTypes[pluginTypeNames[0]].settings);
  }

  if(!_.isUndefined(currentInstanceName)) {
    createSettingRow("instance-name", "Name").append($('<input type="text">').val(currentInstanceName).change(function() {
      newSettings.name = $(this).val();
    }));
  }

  if(typeSelect) {
    if(_.isUndefined(currentTypeName)) {
      $("#setting-row-instance-name").hide();
      $("#dialog-ok").hide();
    }
    else {
      $("#dialog-ok").show();
      typeSelect.val(currentTypeName).trigger("change");
    }
  }
}

