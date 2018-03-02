/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

(function() {
    var bcolor = {red:["#FFF","#e74c3c"],green:["#FFF","#2ecc71"],blue:["#FFF","#3498db"],yellow:["#FFF","#f1c40f"],white:["#454545","#ecf0f1"],grey:["#FFF","#bdc3c7"]};
    
    freeboard.loadWidgetPlugin({
        "type_name"   : "Shoutbox",
        "display_name": "Shoutbox",
        "description" : "A simple textbox for sent message widget that can perform Javascript action.",
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "label",
                "display_name": "Label Text",
                "type"        : "text"
            },
            {
                "name"        : "caption",
                "display_name": "Shoutbox Caption",
                "type"        : "text"
            },
            {
                "name"        : "color",
                "display_name": "Shoutbox Color",
                "type"        : "option",
                "options"     : [
                    {
                        "name" : "White",
                        "value": "white"
                    },
                    {
                        "name" : "Red",
                        "value": "red"
                    },
                    {
                        "name" : "Green",
                        "value": "green"
                    },
                    {
                        "name" : "Blue",
                        "value": "blue"
                    },
                    {
                        "name" : "Yellow",
                        "value": "yellow"
                    },
                    {
                        "name" : "Grey",
                        "value": "grey"
                    }

                ]
            },
            {
                "name"          : "clearValue",
                "display_name"  : "Clear value",
                "type"          : "boolean",
                "default_value" : 0
            },
            {
                "name"        : "onClick",
                "display_name": "onClick action",
                "type"        : "text",
                "description" : "Add some Javascript here. You can chat and publish with a datasource's microgear like this : microgear[\"mygear\"].chat(\"mylamp\", value), where \"mygear\" is a datasource name."
            },
            {
                "name"          : "onCreatedAction",
                "display_name"  : "onCreated Action",
                "type"          : "text",
                "description"   : "JS code to run after a Shoutbox is created"
            }

        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new shoutboxWidgetPlugin(settings));
        }
    });

    var shoutboxWidgetPlugin = function(settings) {
        var self = this;
        var currentSettings = settings;

        self.widgetID = randomString(16);

        var labelElement = $('<label>'+(settings.label?settings.label:"")+'</label><br>');
        var inputElement = $('<input id="v'+self.widgetID+'" type="text" value="" style="width: 55%;">');
        var buttonElement = $('<input id="'+self.widgetID+'"  type="button" value="'+settings.caption+'" style="margin-left: 10px; margin-top: 5px; width: 36%; height: 30px;" onClick="runCode(globalStore[\''+self.widgetID+'\'][\'onClick\'])">');

        globalStore[self.widgetID] = {};

        function updateShoutboxColor(color) {
            if (bcolor[color]) {
                buttonElement.css({
                    "color" : bcolor[color][0],
                    "background-color" : bcolor[color][1]
                });
            }
        }

        function setOnAction(settings) {
            globalStore[self.widgetID]['onClick'] = 'var value=document.getElementById("v'+self.widgetID+'").value;'+(settings.clearValue?'document.getElementById("v'+self.widgetID+'").value="";':'')+settings.onClick;
        }

        updateShoutboxColor(settings.color);

        self.render = function(containerElement) {
            $(containerElement).append(labelElement).append(inputElement).append(buttonElement);
            setOnAction(settings);
        }

        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            labelElement.text(newSettings.label?newSettings.label:"");
            document.getElementById(self.widgetID).value = newSettings.caption;
            updateShoutboxColor(newSettings.color);
            setOnAction(newSettings);
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if(settingName == "caption") {
                $(buttonElement).val(newValue);
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
