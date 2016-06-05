/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

if (typeof globalStore === "undefined") {
    globalStore = {};
}

function runCode(cmd) {
    eval(eval(cmd));
}

function togglePIE(id, delay) {
    document.getElementById(id).disabled = true;

    if (document.getElementById(id).checked) {
        runCode("globalStore['" + id + "']['active']");
    } else {
        runCode("globalStore['" + id + "']['deactivate']");
    }

    setTimeout(function() {
        document.getElementById(id).disabled = false;
    }, (delay*1000));
}

(function() {
    var bcolor = {red:["#FFF","#e74c3c"],green:["#FFF","#2ecc71"],blue:["#FFF","#3498db"],yellow:["#FFF","#f1c40f"],white:["#454545","#ecf0f1"],grey:["#FFF","#bdc3c7"]};

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
            "text-shadow" : "0 1px 2px rgba(0, 0, 0, 0.25)",
            "text-decoration" : "none",
            "text-align" : "center",
            "outline" : "none",
            "font-size" : "125%",
            "display" : "inline-block",
            "float" : "left",
            "border" : "0",
            "border-bottom" : "2px solid",
            "margin-top" : "5px"
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

freeboard.loadWidgetPlugin({
        "type_name"   : "Toggle",
        "display_name": "Toggle",
        "description" : "A simple toggle widget that can perform Javascript action.",
        /*"external_scripts": [
        ],*/
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "title",
                "display_name": "Title",
                "type"        : "text"
            },
            {
                "name"          : "delay",
                "display_name"  : "Dalay",
                "type"          : "text",
                "default_value" : "0",
                "description"   : "delay for next toggle."
            },
            {
                "name"        : "gear",
                "display_name": "MICROGEAR",
                "type"        : "text",
                "description" : "microgear reference of datasource."
            },
            {
                "name"        : "alias",
                "display_name": "ALIAS",
                "type"        : "text",
                "description" : "alias of device."
            }
        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new toggleWidgetPlugin(settings));
        }
    });

    var toggleWidgetPlugin = function(settings) {
        var self = this;
        self.widgetID = randomString(16);

        var titleElement = $("<h2 class=\"section-title\">"+(settings.title?settings.title:"")+"</h2>");
        var toggleElement = $("<center><div class=\"toggle\"><input type=\"checkbox\" name=\"toggle\" class=\"toggle-checkbox\" id=\""+self.widgetID+"\" onClick=\"togglePIE(this.id, "+settings.delay+")\"><label class=\"toggle-label\" for=\""+self.widgetID+"\"><span class=\"toggle-inner\"></span><span class=\"toggle-switch\"></span></label></div></center>");
        var currentSettings = settings;

        globalStore[self.widgetID] = {};
        globalStore[self.widgetID]['active'] = "microgear['"+ settings.gear +"'].chat('"+ settings.alias +"', '1')";
        globalStore[self.widgetID]['deactivate'] = "microgear['"+ settings.gear +"'].chat('"+ settings.alias +"', '0')";

        self.render = function(containerElement) {
            $(containerElement).append(titleElement).append(toggleElement);
        }

        self.getHeight = function() {
            return 1.2;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));

            if(!newSettings.delay)
                newSettings.delay = 0;

            toggleElement.html("<center><div class=\"toggle\"><input type=\"checkbox\" name=\"toggle\" class=\"toggle-checkbox\" id=\""+self.widgetID+"\" onClick=\"togglePIE(this.id, "+newSettings.delay+")\"><label class=\"toggle-label\" for=\""+self.widgetID+"\"><span class=\"toggle-inner\"></span><span class=\"toggle-switch\"></span></label></div></center>");
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
        }

        self.onDispose = function() {
        }
    }
}());
