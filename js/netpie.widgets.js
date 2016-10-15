/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

if (typeof globalStore === "undefined") {
    globalStore = {};
}

if (typeof sliderObject == "undefined") {
    sliderObject = {};
}

function randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

function runCode(cmd) {
    eval(eval(cmd));
}

function onConnectedHandler(microgearRef) {
    /* add code th handle microgearRef connected event */
}

(function() {
    var bcolor = {red:["#FFF","#e74c3c"],green:["#FFF","#2ecc71"],blue:["#FFF","#3498db"],yellow:["#FFF","#f1c40f"],white:["#454545","#ecf0f1"],grey:["#FFF","#bdc3c7"]};

    freeboard.loadWidgetPlugin({
        "type_name"   : "Button",
        "display_name": "Button",
        "description" : "A simple button widget that can perform Javascript action.",
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
            },
            {
                "name"          : "onCreatedAction",
                "display_name"  : "onCreated Action",
                "type"          : "text",
                "description"   : "JS code to run after a button is created"
            }

        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new buttonWidgetPlugin(settings));
        }
    });

    var buttonWidgetPlugin = function(settings) {
        var self = this;
        var currentSettings = settings;

        self.widgetID = randomString(16);

        var buttonElement = $("<input type=\"button\" class=\"netpie-button\" id=\""+self.widgetID+"\" value=\""+settings.caption+"\" onClick=\"runCode('globalStore[\\'"+self.widgetID+"\\'][\\'onClick\\']')\">");
        var textElement = $("<div class=\"netpie-button-text\">"+(settings.text?settings.text:"")+"</div>");

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

        updateButtonColor(settings.color);

        self.render = function(containerElement) {
            $(containerElement).append(buttonElement).append(textElement);
        }

        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            updateButtonColor(newSettings.color);
            textElement.text(newSettings.text?newSettings.text:"");
            globalStore[self.widgetID]['onClick'] = newSettings.onClick;
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

    /***** Slider *********************************************************************************************/

    freeboard.loadWidgetPlugin({
        "type_name"   : "Slider",
        "display_name": "Slider",
        "description" : "A slider widget that can perform Javascript action.",
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "caption",
                "display_name": "Slider Caption",
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

                ],
                "default_value" : "grey"
            },
            {
                "name"          : "showvalue",
                "display_name"  : "Display value",
                "type"          : "boolean",
                "default_value" : 1
            },
            {
                "name"          : "min",
                "display_name"  : "Min Value",
                "type"          : "text",
                "default_value" : 0
            },
            {
                "name"          : "max",
                "display_name"  : "Max Value",
                "type"          : "text",
                "default_value" : 100
            },
            {
                "name"          : "step",
                "display_name"  : "Step",
                "type"          : "text",
                "default_value" : 1
            },
            {
                "name"          : "initialvalue",
                "display_name"  : "Initial Value",
                "type"          : "text",
                "default_value" : "0"
            },                      
            {
                "name"          : "autovaluesource",
                "display_name"  : "Auto Updated Value",
                "type"          : "calculated",
            },                      
            {
                "name"        : "onStart",
                "display_name": "onStart action",
                "type"        : "calculated",
                "description" : "Add some Javascript here. You can access to a slider attribute using variables 'value' and 'percent'."
            },
            {
                "name"        : "onSlide",
                "display_name": "onSlide action",
                "type"        : "calculated",
                "description" : "Add some Javascript here. You can access to a slider attribute using variables 'value' and 'percent'."
            },
            {
                "name"        : "onStop",
                "display_name": "onStop action",
                "type"        : "calculated",
                "description" : "Add some Javascript here. You can access to a slider attribute using variables 'value' and 'percent'."
            },
            {
                "name"          : "onCreatedAction",
                "display_name"  : "onCreated Action",
                "type"          : "text",
                "description"   : "JS code to run after a button is created"
            }

        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new sliderWidgetPlugin(settings));
        }
    });

    var sliderWidgetPlugin = function(settings) {
        var self = this;
        var currentSettings = settings;

        self.widgetID = randomString(16);

        var sliderElement = $("<input id=\""+self.widgetID+"\" type=\"range\" min=\""+settings.min+"\" max=\""+settings.max+"\" step=\""+settings.step+"\" value=\""+(settings.initialvalue || 0)+"\" />");
        self.autoValue = 0;

        var textElement = $("<span style=\"float:left;\">"+(settings.caption?settings.caption:"")+"</span>");
        var valueElement = $("<span style=\"float:right;\">"+(settings.initialvalue || 0)+"</span>");

        if (settings.showvalue) valueElement.show();
        else valueElement.hide();

        self.linkAutoValue = (settings.autovaluesource && settings.autovaluesource.length > 0);

        globalStore[self.widgetID] = {};

        globalStore[self.widgetID]['onStart'] = settings.onStart;
        globalStore[self.widgetID]['onStop'] = settings.onStop;
        globalStore[self.widgetID]['onSlide'] = settings.onSlide;

        function updateSliderColor(color) {
            if (bcolor[color]) {
                if (document.getElementById(self.widgetID)) {
                    sliderObject[self.widgetID].setFillColor(bcolor[color][1]);
                    /*
                    var c = hexToRgb(bcolor[color][1]);
                    sliderObject[self.widgetID].setBackgroundColor('rgba('+c.r+','+c.g+','+c.b+',0.14)');
                    */
                }
            }
        }

        self.render = function(containerElement) {
            $(containerElement).append(textElement).append(valueElement).append(sliderElement);

            self.lastSlideCallback = 0;
            self.nextSlideCallbackTimer = 0;
            self.maxCallbackDuration = 200;  //ms

            (function () {
                var elements = document.getElementById(self.widgetID);
                // Basic rangeSlider initialization
                sliderObject[self.widgetID] = rangeSlider.create(elements, {
                    // Callback function
                    onInit: function () {
                        self.controlling = false;
                    },

                    // Callback function
                    onSlideStart: function (value, percent, position) {
                        self.controlling = true;
                        valueElement.text(value);
                        if (globalStore[self.widgetID]['onStart'])
                            eval('var value='+value+'; var percent='+percent+';'+globalStore[self.widgetID]['onStart']);
                        //console.info('onSlideStart', 'value: ' + value, 'percent: ' + percent, 'position: ' + position);
                    },

                    // Callback function
                    onSlide: function (value, percent, position) {
                        self.controlling = true;
                        valueElement.text(value);
                        if (globalStore[self.widgetID]['onSlide']) {
                            if (Date.now() - self.lastSlideCallback > self.maxCallbackDuration) {
                                eval('var value='+value+'; var percent='+percent+';'+globalStore[self.widgetID]['onSlide']);
                                self.lastSlideCallback = Date.now();
                            }
                            else {
                                if (self.nextSlideCallbackTimer==0) {
                                    self.nextSlideCallbackTimer = setTimeout( function() {
                                        eval('var value='+value+'; var percent='+percent+';'+globalStore[self.widgetID]['onSlide']);
                                        self.lastSlideCallback = Date.now();
                                        self.nextSlideCallbackTimer=0;
                                    },self.maxCallbackDuration-(Date.now()-self.lastSlideCallback));
                                }
                            }
                        }
                    },

                    // Callback function
                    onSlideEnd: function (value, percent, position) {
                        valueElement.text(value);
                        if (globalStore[self.widgetID]['onStop'])
                            eval('var value='+value+'; var percent='+percent+';'+globalStore[self.widgetID]['onStop']);

                            if (self.linkAutoValue) {
                                setTimeout(function() {
                                    sliderObject[self.widgetID].update({value: self.autoValue});
                                    valueElement.text(sliderObject[self.widgetID].value);
                                    self.controlling = false;
                                },500);
                            }
                            else {
                                self.controlling = false;
                            }
                    }
                });
            })();

            updateSliderColor(settings.color);
        }

        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            updateSliderColor(newSettings.color);
            textElement.text(newSettings.caption?newSettings.caption:"");

            if (newSettings.showvalue) valueElement.show();
            else valueElement.hide();

            globalStore[self.widgetID]['onStart'] = newSettings.onStart;
            globalStore[self.widgetID]['onStop'] = newSettings.onStop;
            globalStore[self.widgetID]['onSlide'] = newSettings.onSlide;

            var oldvalue = sliderObject[self.widgetID].value;

            /* have to update in 2 steps */
            sliderObject[self.widgetID].update({min: Number(newSettings.min||0), max: Number(newSettings.max||100), step: Number(newSettings.step||1)});
            sliderObject[self.widgetID].update({value: oldvalue});

            valueElement.text(sliderObject[self.widgetID].value);

            self.linkAutoValue = (newSettings.autovaluesource && newSettings.autovaluesource.length > 0);
            if (self.linkAutoValue) {
                sliderObject[self.widgetID].update({value: self.autoValue});
                valueElement.text(sliderObject[self.widgetID].value);
            }
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if(settingName == "autovaluesource") {
                if (self.controlling) {
                    self.autoValue = newValue;
                }
                else {
                    self.autoValue = newValue;
                    sliderObject[self.widgetID].update({value: newValue});
                    valueElement.text(sliderObject[self.widgetID].value);
                }
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


