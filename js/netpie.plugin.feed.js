/*  NETPIE Microgear Freeboard plugin                             */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

if (typeof dsstore === "undefined") {
    dsstore = {};
}

(function()
{
    freeboard.loadDatasourcePlugin({
        "type_name"   : "netpie_feed",
        "display_name": "NETPIE Feed",
        "description" : "NETPIE Feed Datasource.",
        "external_scripts" : [
            "https://cdn.netpie.io/microgear.js"
        ],
        "settings"    : [
            {
                "name"         : "feedid",
                "display_name" : "Feed ID",
                "type"         : "text",
                //"description"  : "Feed ID",
                "required" : true
            },
            {
                "name"         : "apikey",
                "display_name" : "API Key",
                "type"         : "text",
                //"description"  : "Key",
                //"required"     : true
            },
            {
                "name"         : "granularity_value",
                "display_name" : "Granularity",
                "type"         : "text",
                "default_value": "5",
                "required"     : false,
            },
            {
                name: "granularity_unit",
                display_name: "",
                type: "option",
                "description"  : "Resolution of the data points.",
                options:[
                    {
                        name: "Second",
                        value: "seconds"
                    },
                    {
                        name: "Minute",
                        value: "minutes"
                    },
                    {
                        name: "Hour",
                        value: "hours"
                    },
                    {
                        name: "Day",
                        value: "days"
                    },
                    {
                        name: "Month",
                        value: "months"
                    },
                    {
                        name: "Year",
                        value: "years"
                    }
                ],
                "default_value": "minutes",
            },
            {
                "name"         : "since_value",
                "display_name" : "Since",
                "type"         : "text",
                "default_value": "6",
                "required"     : false,
            },
            {
                name: "since_unit",
                display_name: "",
                type: "option",
                "description"  : "Display data points since ... ago.",
                options:[
                    {
                        name: "Second",
                        value: "seconds"
                    },
                    {
                        name: "Minute",
                        value: "minutes"
                    },
                    {
                        name: "Hour",
                        value: "hours"
                    },
                    {
                        name: "Day",
                        value: "days"
                    },
                    {
                        name: "Month",
                        value: "months"
                    },
                    {
                        name: "Year",
                        value: "years"
                    }
                ],
                "default_value": "hours",
            },
            {
                "name"          : "interval",
                "display_name"  : "Reload Every",
                "type"          : "text",
                "description"   : "Data reload interval (seconds)",
                "default_value" : "15"
            }

        ],

        newInstance : function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new feedDatasourcePlugin(settings, updateCallback));
        }
    });


    var feedDatasourcePlugin = function(settings, updateCallback) {
        var self = this;
        var apiChanged = false;
        var currentSettings = settings;
        var interval = settings.interval;
        var data = {};

        function reloadhData(s) {
            var apiurl = 'https://api.netpie.io/feed/'+s.feedid+'?apikey='+s.apikey+'&granularity='+s.granularity_value+s.granularity_unit+'&aggregate=avg&since='+s.since_value+s.since_unit;
            $.getJSON( apiurl, function(datajson) {
                data['data'] = datajson;
                updateCallback(data);
            });
        }

        dsstore[currentSettings.name] = {};

        if (currentSettings.interval > 0) {

            setTimeout(function() {
                reloadhData(currentSettings);
            },500);

            dsstore[currentSettings.name]['timer'] = setInterval(function() {
                reloadhData(currentSettings);
            }, currentSettings.interval*1000);
        }

        self.updateNow = function() {

        }

        self.onSettingsChanged = function(newSettings) {
            if (currentSettings.name != newSettings.name) {
                if (dsstore && dsstore[currentSettings.name] && dsstore[currentSettings.name]['timer']) {
                    clearInterval(dsstore[currentSettings.name]['timer']);
                }
                dsstore[newSettings.name] = dsstore[currentSettings.name];
                dsstore[currentSettings.name] = null;
                delete(dsstore[currentSettings.name]);
            }

            if (
                newSettings.interval != currentSettings.interval ||
                newSettings.granularity_value != currentSettings.granularity_value ||
                newSettings.granularity_unit != currentSettings.granularity_unit ||
                newSettings.since_value != currentSettings.since_value ||
                newSettings.since_unit != currentSettings.since_unit ||
//                newSettings.aggregate != currentSettings.aggregate ||
                false ) apiChanged = true;

            if (apiChanged) {
                if (dsstore && dsstore[newSettings.name] && dsstore[newSettings.name]['timer']) {
                    clearInterval(dsstore[newSettings.name]['timer']);
                }

                dsstore[newSettings.name]['timer'] = setInterval(function() {
                    reloadhData(newSettings);
                }, newSettings.interval*1000);
                apiChanged = false;
            }

            currentSettings = newSettings;
            setTimeout(function(){
                reloadhData(currentSettings);
            },500);

        }

        self.onDispose = function() {
            delete(self.mg);
        }

    }
}());
