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
        var gconf = {
            key: settings.key,
            secret: settings.secret
        }
        if (settings.alias) gconf.alias = settings.alias;

        var data = {};

        self.updateNow = function() {
        }

        self.mg = Microgear.create(gconf);

        microgear[settings.microgearRef] = self.mg;
        self.mg.on('message', function(topic,msg) {
            //console.log(topic+' : '+msg);
            if (topic && msg) {
                data[topic] = msg;
                updateCallback(data);
            }
        });

        self.mg.on('connected', function() {
            var topt = settings.topics.trim();
            if (topt && topt.length>0) {
                var topics = topt.split(',');
                for (var i=0; i< topics.length; i++) {
                    self.mg.subscribe(topics[i]);
                }
            }

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
