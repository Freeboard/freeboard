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
                "name"         : "topics",
                "display_name" : "Subscribed Topics",
                "type"         : "text",
                "description"  : "Topics of the messages that this datasource will consume, the default is /# which means all messages in this app ID.",
                "default_value": "/#",
                "required"     : false
            },
            {
                "name"          : "onCreatedAction",
                "display_name"  : "onCreated Action",
                "type"          : "text",
                "description"   : "JS code to run after a datasource is created"
            },
            {
                "name"          : "onConnectedAction",
                "display_name"  : "onConnected Action",
                "type"          : "text",
                "description"   : "JS code to run after a microgear datasource is connected to NETPIE"
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
        var aliasList = {};

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
                var modifiedname = newSettings.name.substring(0,16);

                if (newSettings.name != modifiedname) {
                    var text = "The datasource name should not be longer than 16 characters otherwise the associative id will be shorten i.e. now the microgear object is referenced by microgear[\""+modifiedname+"\"] and the microgear device alias is trimmed to \""+modifiedname+"\".";
                    newSettings.name = modifiedname;
                    freeboard.showDialog(text, "Warning", "I understand");
                }

                if (microgear[currentSettings.name]) {
                    delete(microgear[currentSettings.name]);
                }
                microgear[newSettings.name] = self.mg;
  
                self.mg.setAlias(newSettings.name);
            }

            if (currentSettings.topics != newSettings.topics) {
                initSubscribe(currentSettings.topics.trim().split(','), false);
                initSubscribe(newSettings.topics.trim().split(','), true);
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

        if(settings.name !== undefined){
            settings.name = settings.name.replace(' ','_').substring(0,16);
        }
        
        microgear[settings.name] = self.mg;

        self.mg.on('message', function(topic,msg) {
            if (topic && msg) {
                data[topic] = msg;
                updateCallback(data);
            }
        });

        self.mg.on('present', function(m) {
            var mtoken = m.gear;
            var aobj = {
                token : mtoken
            };
            var found = false;
            if (typeof(aliasList[m.alias]) != 'undefined') {
                for (var k=0; k<aliasList[m.alias].length; k++) {
                    if (aliasList[m.alias][k].token == mtoken) {
                        found = true;
                        break;
                    }
                }
            }
            else {
                aliasList[m.alias] = [];
            }
            if (!found) {
                // if the alias changed, remove the old one located under the old alias name
                if (m.type=='aliased') {
                    for (var _alias in aliasList) {
                        for (var k=0; k<aliasList[_alias].length; k++) {
                            if (aliasList[_alias][k].token == mtoken) {
                                aliasList[_alias].splice(k,1);
                            }
                        }
                    }
                }

                aliasList[m.alias].push(aobj);
            }


            for (var _alias in aliasList) {
                if (aliasList[_alias].length == 0) {
                    console.log();
                    delete aliasList[_alias];
                }
            }

            data['alias'] = aliasList;
            updateCallback(data);
        });


        self.mg.on('absent', function(m) {
            var mtoken = m.gear;

            if (typeof(aliasList[m.alias]) != 'undefined') {
                for (var k=0; k<aliasList[m.alias].length; k++) {
                    if (aliasList[m.alias][k].token == mtoken) {
                        aliasList[m.alias].splice(k,1);
                        if (aliasList[m.alias].length == 0) delete aliasList[m.alias];
                        break;
                    }
                }
            }
            data['alias'] = aliasList;
            updateCallback(data);
        });

        self.mg.on('connected', function() {
            aliasList = {};
            data['alias'] = aliasList;
            updateCallback(data);

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
                onConnectedHandler(settings.name);
            }
        })

        self.mg.on('disconnected', function() {
            aliasList = {};
            data['alias'] = aliasList;
            updateCallback(data);
        });

        if (settings.onCreatedAction) {
            eval(settings.onCreatedAction);
        }
    
        self.mg.connect(settings.appid, function(){

        });
    }
}());
