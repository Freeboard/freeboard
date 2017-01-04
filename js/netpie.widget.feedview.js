/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

if (typeof feedview === "undefined") {
    feedview = [];
}

(function() {

    freeboard.loadWidgetPlugin({
        "type_name"   : "FeedView",
        "display_name": "FeedView",
        "description" : "",
        "fill_size" : true,
        "external_scripts" : [
            "js/netpie.feedview.js"
        ],
        "settings"  : [
            {
                 "name"        : "title",
                 "display_name": "Title",
                 "type"        : "text"
            },
            {
                "name"          : "datasource",
                "display_name"  : "Data Source",
                "type"          : "calculated",
                "description"   : ""
            },
            {
                name: "filter",
                display_name: "Filter",
                type: "text",
                "description" : "Data fields separated with comma e.g. temp,humid,light. Blank means display all fields."
            },
            {
                name: "type",
                display_name: "Type of Chart",
                type: "option",
                options:[
                    {
                        name: "Line",
                        value: "line"
                    },
                     {
                        name: "Step",
                        value: "step"
                    }
                ]
            },
            {
                name: "xaxis",
                display_name: "X axis title",
                type: "text",
            },
            {
                name: "yaxis",
                display_name: "Y axis title",
                type: "text",
            },
            {
                name: "yzero",
                display_name: "begin at 0",
                type: "boolean",
            },
            {
                name: "color",
                display_name: "Line Colors",
                type: "text",
                default_value: "",
                "description": "enter the color set separated by comma e.g. #ff0000,#00ff00,#0000ff or leave blank for the default color set"
            },
            {
                name: "marker",
                display_name: "Maker",
                type: "boolean",
                default_value: true
            },
            {
                name: "multipleaxis",
                display_name: "Multiple Axis",
                type: "boolean",
                default_value: true
            },
            {
                name: "autogap",
                display_name: "Auto Gap",
                type: "boolean",
                default_value: false
            },
            {
                name: "height_block",
                display_name: "Height Blocks",
                type: "option",
                options:[
                    {
                        name: "4",
                        value: "240"
                    },
                     {
                        name: "5",
                        value: "300"
                    },
                    {
                        name: "6",
                        value: "360"
                    },
                    {
                        name: "7",
                        value: "420"
                    },
                    {
                        name: "8",
                        value: "480"
                    },
                    {
                        name: "9",
                        value: "540"
                    },
                    {
                        name: "10",
                        value: "600"
                    }
                ]
            },

        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new feedviewWidgetPlugin(settings));
        }
    });

    var feedviewWidgetPlugin = function(settings) {
        var self = this;
        var sizeWidth = {"240":"4","300":"5","360":"6","420":"7","480":"8","540":"9","600":"10"};
        self.widgetID = randomString(16);
        var currentSettings = settings;
        var feedviewElement = $("<div id=\"chart"+self.widgetID+"\"></div>");
        self.render = function(containerElement) {
            currentSettings.height = sizeWidth[currentSettings.height_block];
            $(containerElement).append(feedviewElement);
            feedviewElement.css({
                height:currentSettings.height_block+"px",
            });
        }

        this.getHeight = function () {
            if(currentSettings.height===undefined){
                currentSettings.height = 4;
            }
            return Number(currentSettings.height);
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            insertFeedView();
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
            self.valuejson = newValue;
            insertFeedView();
        }

        self.onDispose = function() {
            for (var i = feedview.length - 1; i >= 0; i--) {
                if(self.widgetID==feedview[i].id){
                    check = true;
                    index = i;
                }
            }
            if(!check){
                feedview.remove(i);
            }
        }

        //this.onSettingsChanged(settings);

        freeboard.on('theme_changed',function() {
            updateChart('chart'+self.widgetID,self.valuejson,self.option);
        });

        var insertFeedView =function() {
            currentSettings.height = sizeWidth[currentSettings.height_block];
            $("#"+'chart'+self.widgetID).css({
                height:currentSettings.height_block+"px",
            });
            if(self.valuejson!==undefined){
                self.option = {
                    title : currentSettings.title,
                    xaxis : currentSettings.xaxis,
                    yaxis : currentSettings.yaxis,
                    multipleaxis : currentSettings.multipleaxis,
                    yzero:currentSettings.yzero,
                    color:currentSettings.color,
                    type : currentSettings.type, //line,step
                    marker : currentSettings.marker, //true,false
                    filter : currentSettings.filter,
                    autogap : currentSettings.autogap
                }
                // jQuery(window).ready(function() {
                updateChart('chart'+self.widgetID,self.valuejson,self.option);
                // });
            }
        }        
    }
}());
