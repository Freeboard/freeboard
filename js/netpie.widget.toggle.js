/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

(function() {

    freeboard.loadWidgetPlugin({
        "type_name"   : "Toggle",
        "display_name": "Toggle",
        "description" : "A simple toggle widget that can perform Javascript action.",
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "caption",
                "display_name": "Toggle Caption",
                "type"        : "text"
            },
            {
                "name"          : "state",
                "display_name"  : "Toggle State",
                "type"          : "calculated",
                "description"   : "Add a condition to switch a toggle state here. Otherwise it just toggle by click."
            },
            {
                "name"          : "ontext",
                "display_name"  : "On Text",
                "type"          : "text",
                "default_value" : "ON"
            },
            {
                "name"          : "offtext",
                "display_name"  : "Off Text",
                "type"          : "text",
                "default_value" : "OFF"
            },
            {
                "name"          : "onaction",
                "display_name"  : "onToggleOn Action",
                "type"          : "text",
                "description"   : "JS code to run when a toggle is switched to ON"
            },
            {
                "name"          : "offaction",
                "display_name"  : "onToggleOff Action",
                "type"          : "text",
                "description"   : "JS code to run when a toggle is switched to OFF"
            },
            {
                "name"          : "onCreatedAction",
                "display_name"  : "onCreated Action",
                "type"          : "text",
                "description"   : "JS code to run after a toggle is created"
            }

        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new toggleWidgetPlugin(settings));
        }
    });

    var toggleWidgetPlugin = function(settings) {
        var self = this;
        self.widgetID = randomString(16);

        var currentSettings = settings;
        var toggleElement = $("<div class=\"netpie-toggle\"><input type=\"checkbox\" name=\"toggle\" class=\"netpie-toggle-checkbox\" id=\""+self.widgetID+"\" onClick=\"runCode(globalStore['"+self.widgetID+"'][this.checked?'onaction':'offaction']); if(typeof(globalStore['"+self.widgetID+"']['statesource'])!='undefined' && globalStore['"+self.widgetID+"']['statesource']!='') {this.checked = !this.checked} ; \"><label class=\"netpie-toggle-label\" for=\""+self.widgetID+"\"><span class=\"netpie-toggle-inner\" ontext=\""+(settings.ontext||'')+"\" offtext=\""+(settings.offtext||'')+"\" id=\""+self.widgetID+"_inner\"></span><span class=\"netpie-toggle-switch\"></span></label></div><div class=\"netpie-toggle-text\" id=\""+self.widgetID+"_toggleText\">"+(settings.caption||"")+"</div>");

        globalStore[self.widgetID] = {};
        globalStore[self.widgetID]['onaction'] = settings.onaction;
        globalStore[self.widgetID]['offaction'] = settings.offaction;
        globalStore[self.widgetID]['statesource'] = settings.state;

        self.render = function(containerElement) {
            $(containerElement).append(toggleElement);
        }

        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;

            globalStore[self.widgetID]['onaction'] = newSettings.onaction;
            globalStore[self.widgetID]['offaction'] = newSettings.offaction;
            globalStore[self.widgetID]['statesource'] = newSettings.state;
            $('#'+self.widgetID+'_inner').attr('ontext',newSettings.ontext||'');
            $('#'+self.widgetID+'_inner').attr('offtext',newSettings.offtext||'');
            document.getElementById(self.widgetID+'_toggleText').innerHTML = newSettings.caption||'';
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if (settingName == 'state') {
                document.getElementById(self.widgetID).checked = newValue;
            }
        }

        self.onDispose = function() {
        }

        if (settings.onCreatedAction) {
            var timer = setInterval(function() {
                if (Object.getOwnPropertyNames(microgear).length > 0) {
                    clearInterval(timer);
                    eval(settings.onCreatedAction);
                }
            },200);
        }

    }

}());
