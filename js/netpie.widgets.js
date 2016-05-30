/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

if (typeof globalStore === "undefined") {
    globalStore = {};
}

function runCode(cmd) {
    eval(eval(cmd));
}

(function() {
    var bcolor = {red:["#551111","#ee8888"],green:["#115511","#88ee88"],blue:["#111155","#8888ee"],yellow:["#555511","#eeee88"],white:["#222222","#FFFFFF"],grey:["#000000","#666666"]};

    freeboard.loadWidgetPlugin({
        "type_name"   : "Button",
        "display_name": "Button",
        "description" : "A simple button widget that can perform Javascript action.",
        /*"external_scripts": [
        ],*/
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "caption",
                "display_name": "Button Caption",
                "type"        : "text"
            },
            {
                "name"        : "text",
                "display_name": "Label Text",
                "type"        : "text"
            },
            {
                "name"        : "color",
                "display_name": "Button Color",
                "type"        : "option",
                "options"     : [
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
                        "name" : "White",
                        "value": "white"
                    },
                    {
                        "name" : "Grey",
                        "value": "grey"
                    }

                ]
            },
            {
                "name"        : "onClick",
                "display_name": "onClick action",
                "type"        : "calculated",
                "description" : "Add some Javascript here. You can chat and publish with a datasource's microgear like this : microgear[\"mygear\"].chat(\"mylamp\",\"ON\"), where \"mygear\" is a microgear reference." 
            }
        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new buttonWidgetPlugin(settings));
        }
    });


    function randomString(length) {
        return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
    }

    var buttonWidgetPlugin = function(settings) {
        var self = this;
        var currentSettings = settings;

        self.widgetID = randomString(16);
        var buttonElement = $("<input type=\"button\" id=\""+self.widgetID+"\" value=\""+settings.caption+"\" onClick=\"runCode('globalStore[\\'"+self.widgetID+"\\'][\\'onClick\\']')\">");
        var textElement = $("<div>"+(settings.text?settings.text:"")+"</div>");

        globalStore[self.widgetID] = {};
        globalStore[self.widgetID]['onClick'] = settings.onClick;
     
        function updateButtonColor(color) {
            if (bcolor[color]) {
                buttonElement.css({
                    "color" : bcolor[color][0],
                    "background-color" : bcolor[color][1]
                });
            }
        }

        buttonElement.css({
            "height" : "36px",
            "width" : "55%",
            "box-shadow" : "0px 1px 0px 1px #333333",
            "text-decoration" : "none",
            "border-radius" : "4px",
            "text-align" : "center",
            "outline" : "none",
            "font-size" : "125%",
            "display" : "inline-block",
            "float" : "left",
        });

        textElement.css({
            "vertical-align" : "bottom",
            "padding" : "8px 0px 0px 10px",
            "float" : "left"
        });

        updateButtonColor(settings.color);

        self.render = function(containerElement) {
            $(containerElement).append(buttonElement).append(textElement);
        }

        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;

            document.getElementById(self.widgetID).value = newSettings.caption;

            updateButtonColor(newSettings.color);
            textElement.text(newSettings.text?newSettings.text:"");

            globalStore[self.widgetID]['onClickAction'] = newSettings.onClickAction;
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if(settingName == "caption") {
                $(buttonElement).val(newValue);
            }
        }

        self.onDispose = function() {
        }
    }

}());
