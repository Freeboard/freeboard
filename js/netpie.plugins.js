/*  NETPIE Microgear Freeboard plugin                             */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

if (typeof microgear === "undefined") {
    microgear = {};
}

(function()
{
    freeboard.loadDatasourcePlugin({
        "type_name"   : "netpie_microgear",
        "display_name": "NETPIE Microgear",
        "description" : "Connect to NETPIE as a microgear to communicate real-time with other microgears in the same App ID.",
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
                "display_name" : "Device Alias",
                "type"         : "text", 
                "description"  : "A nick name of this freeboard that other device can chat to",
                "type"         : "text",
                "required"     : false
            },
            {
                "name"         : "microgearRef",
                "display_name" : "Microgear Reference",
                "type"         : "text", 
                "description"  : "Define a reference for a microgear of this datasource. For example if you set this to 'mygear' you can access the microgear object by microgear['mygear']",
                "type"         : "text",
                "required"     : false
            },
            {
                "name"         : "topics",
                "display_name" : "Subscribed Topics",
                "type"         : "text", 
                "description"  : "Topics of the messages that this datasource will consume, the default is /# which means all messages in this app ID.",
                "default_value": "/#",
                "required"     : false
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
            if (currentSettings.alias != newSettings.alias) {
                self.mg.setAlias(newSettings.alias);
            }

            if (currentSettings.topics != newSettings.topics) {
                initSubscribe(currentSettings.topics.trim().split(','), false);
                initSubscribe(newSettings.topics.trim().split(','), true);
            }

            if (currentSettings.microgearRef != newSettings.microgearRef) {
                delete(microgear[currentSettings.microgearRef]);
                microgear[newSettings.microgearRef] = self.mg;
            }

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

        microgear[settings.microgearRef] = self.mg;

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
        })

        self.mg.connect(settings.appid, function(){

        });
    }
}());
