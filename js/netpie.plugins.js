/*  NETPIE Microgear Freeboard plugin                             */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

if (typeof microgear === "undefined") {
    microgear = {};
}

if (typeof dsstore === "undefined") {
    dsstore = {};
}

(function()
{
    freeboard.loadDatasourcePlugin({
        "type_name"   : "netpie_microgear",
        "display_name": "NETPIE Microgear",
        "description" : "Connect to NETPIE as a microgear to communicate real-time with other microgears in the same App ID. The microgear of this datasource is referenced by microgear[DATASOURCENAME]",
        "external_scripts" : [
            "https://cdn.netpie.io/microgear.js"
        ],
        "settings"    : [
            {
                "name"         : "appid",
                "display_name" : "App ID",
                "type"         : "text",
                "description"  : "NETPIE App ID obtained from https://netpie.io/app",
                "required" : true
            },
            {
                "name"         : "key",
                "display_name" : "Key",
                "type"         : "text",
                "description"  : "Key",
                "required"     : true
            },
            {
                "name"        : "secret",
                "display_name" : "Secret",
                "type"         : "text",
                "description"  : "Secret",
                "type"         : "text",
                "required"     : true
            },
            {
                "name"         : "alias",
                "display_name" : "Microgear Alias",
                "type"         : "text",
                "description"  : "A nick name of this freeboard that other device can chat to",
                "type"         : "text",
                "default_value": "freeboard",
                "required"     : false
            },
/*
            {
                "name"         : "microgearRef",
                "display_name" : "Microgear Reference",
                "type"         : "text",
                "description"  : "Define a reference for a microgear of this datasource. For example if you set this to 'mygear' you can access the microgear object by microgear['mygear']",
                "type"         : "text",
                "required"     : false
            },
*/
            {
                "name"         : "topics",
                "display_name" : "Subscribed Topics",
                "type"         : "text",
                "description"  : "Topics of the messages that this datasource will consume, the default is /# which means all messages in this app ID.",
                "default_value": "/#",
                "required"     : false
            },
            {
                "name"          : "onConnectedAction",
                "display_name"  : "onConnected Action",
                "type"          : "text",
                "description"   : "JS code to run after a microgear datasource is connected"
            }

        ],

        newInstance : function(settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new netpieDatasourcePlugin(settings, updateCallback));
        }
    });


    var netpieDatasourcePlugin = function(settings, updateCallback) {
        var self = this;
        var currentSettings = settings;
        var gconf = {
            key: settings.key,
            secret: settings.secret
        }
        if (settings.alias) gconf.alias = settings.alias;

        var data = {};

        function initSubscribe(toparr, toSub) {
            if (toparr && toparr.length>0) {
                for (var i=0; i< toparr.length; i++) {
                    if (toSub) {
                        self.mg.subscribe(toparr[i]);
                    }
                    else {
                        self.mg.unsubscribe(toparr[i]);
                    }
                }
            }
        }

        self.updateNow = function() {

        }

        self.onSettingsChanged = function(newSettings) {
            if (currentSettings.name && (currentSettings.name != newSettings.name)) {
                newSettings.name = newSettings.name.replace(' ','_').substring(0,16);

                if (microgear[currentSettings.name])
                    delete(microgear[currentSettings.name]);
                microgear[newSettings.name] = self.mg;
            }

            if (currentSettings.alias != newSettings.alias) {
                self.mg.setAlias(newSettings.alias);
            }

            if (currentSettings.topics != newSettings.topics) {
                initSubscribe(currentSettings.topics.trim().split(','), false);
                initSubscribe(newSettings.topics.trim().split(','), true);
            }

            /*
            if (newSettings.microgearRef && currentSettings.microgearRef && (currentSettings.microgearRef != newSettings.microgearRef)) {
                if (microgear[currentSettings.microgearRef])
                    delete(microgear[currentSettings.microgearRef]);
                microgear[newSettings.microgearRef] = self.mg;
            }
            */

            if (currentSettings.appid != newSettings.appid || currentSettings.key != newSettings.key || currentSettings.secret != newSettings.secret) {
                freeboard.showDialog("Reconfigure AppID, Key or Secret needs a page reloading. Make sure you save the current configuration before processding.", "Warning", "OK", "CANCEL", function() {
                    location.reload(true);
                })
            }
            currentSettings = newSettings;
        }

        self.onDispose = function() {
            delete(self.mg);
        }

        self.mg = Microgear.create(gconf);

        //microgear[settings.microgearRef] = self.mg;

        settings.name = settings.name.replace(' ','_').substring(0,16);
        microgear[settings.name] = self.mg;

        self.mg.on('message', function(topic,msg) {
            if (topic && msg) {
                data[topic] = msg;
                updateCallback(data);
            }
        });

        self.mg.on('connected', function() {
            initSubscribe(settings.topics.trim().split(','), true);
            if (gconf.alias) {
                self.mg.setAlias(gconf.alias);
            }
            else if (settings.name) {
                self.mg.setAlias(settings.name);
            }

            if (settings.onConnectedAction) {
                var timer = setInterval(function() {
                    if (Object.getOwnPropertyNames(microgear).length > 0) {
                        clearInterval(timer);
                        eval(settings.onConnectedAction);
                    }
                },200);
            }

            if (typeof(onConnectedHandler) != 'undefined') {
                //onConnectedHandler(settings.microgearRef);
                onConnectedHandler(settings.name);
            }
        })

        self.mg.connect(settings.appid, function(){

        });
    }
}());


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
                "default_value": "1",
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
                ]
            },
            {
                name: "aggregate",
                display_name: "Aggregate",
                type: "option",
                "description"  : "Aggregation method e.g. how to calculate each data point.",
                options:[
                    {
                        name: "Average",
                        value: "avg"
                    },
                    {
                        name: "Rate",
                        value: "rate"
                    }
                ]
            },
            {
                "name"         : "since_value",
                "display_name" : "Since",
                "type"         : "text",
                "default_value": "1",
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
                ]
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
            var apiurl = 'https://api2.netpie.io/feed/'+s.feedid+'?apikey='+s.apikey+'&granularity='+s.granularity_value+s.granularity_unit+'&aggregate='+s.aggregate+'&since='+s.since_value+s.since_unit;
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
                newSettings.aggregate != currentSettings.aggregate ||
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
