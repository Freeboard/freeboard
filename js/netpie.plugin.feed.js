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
/*
            {
                "name"         : "from_value",
                "display_name" : "From",
                "type"         : "text",
                "default_value": "",
                "description"  : "Timestamp in milliseconds.",
                "required"     : false,
            },
            {
                "name"         : "to_value",
                "display_name" : "To",
                "type"         : "text",
                "default_value": "",
                "description"  : "Timestamp in milliseconds",
                "required"     : false,
            },
*/
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
        dsstore[currentSettings.name] = {};
        var timelist ={seconds:1000,minutes:1000*60,hours:1000*60*60,days:1000*60*60*24,months:1000*60*60*24*30,years:1000*60*60*24*30*12}

        function reloadhData(s) {
            if(typeof data['data'] !== "undefined"){
                var timenow = new Date().getTime();
                var lasttime;
                for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                    for (var j = 0; j<data['data']['data'][i]['values'].length; j++) {
                        if(typeof data['data']['data'][i]['values'][j] !== "undefined"){
                            if(data['data']['data'][i]['values'][j][0]+s.since_value*timelist[s.since_unit]<timenow){
                                data['data']['data'][i]['values'].splice(j, 1)
                            }
                        }
                    }
                    if(i==0){
                        lasttime = data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0];
                    }else{
                        if(lasttime>data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0]){
                            lasttime = data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0];
                        }
                    }
                }

                var apiurl = 'https://api.netpie.io/feed/'+s.feedid+'?apikey='+s.apikey+'&granularity='+s.granularity_value+s.granularity_unit+'&aggregate=avg&from='+lasttime+'&to='+timenow;
                $.getJSON( apiurl, function(datajson) {
                    if(typeof datajson['lastest_data'] !== "undefined"){
                        for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                            for (var j = 0; j<datajson['data'].length ; j++) {
                                if(data['data']['data'][i].attr==datajson['data'][j].attr){
                                    for (var k = 0; k<datajson['data'][j]['values'].length ; k++) {
                                        if(data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0]<datajson['data'][j]['values'][k][0]){
                                            datajson['data'][j]['values'].splice(0,k)
                                            data['data']['data'][i]['values'] = data['data']['data'][i]['values'].concat(datajson['data'][j]['values']);
                                            break;
                                        }
                                    }
                                    var byTimestamp = data['data']['data'][i]['values'].slice(0);
                                    byTimestamp.sort(function(a,b) {
                                        return a[0] - b[0];
                                    });
                                    data['data']['data'][i]['values'] = byTimestamp;
                                    break;
                                }
                            }
                        }
                        data['data']['to'] = timenow;
                        data['data']['lastest_data'] = datajson['lastest_data'];
                        updateCallback(data);
                    }
                });
            }
            else{
                var apiurl = 'https://api.netpie.io/feed/'+s.feedid+'?apikey='+s.apikey+'&granularity='+s.granularity_value+s.granularity_unit+'&aggregate=avg&since='+s.since_value+s.since_unit;
                $.getJSON( apiurl, function(datajson) {
                    data['data'] = datajson;
                    var newfrom;
                    var newto;
                    if(typeof data['data']['lastest_data'] !== "undefined"){
                        for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                            var timelastitem = data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0];
                            if(data['data']['lastest_data'][i]['values'][0][0]>timelastitem+timelist[data['data']['granularity'][1]]*data['data']['granularity'][0]){
                                if(typeof newfrom === "undefined"){
                                    newfrom = timelastitem+1000;
                                    newto = data['data']['lastest_data'][i]['values'][0][0];
                                }
                                else{
                                    if(newfrom>timelastitem){
                                        newfrom = timelastitem;
                                    }
                                }
                            }
                        }
                    }
                    data['data']['lastest_data'] = datajson['lastest_data'];
                    updateCallback(data);
                    if(typeof newfrom !== "undefined"){
                        reloadjData(s,newfrom,newto)
                    }                
                });
            }
        }
        function reloadiData(s) {
            if(typeof data['data'] !== "undefined"){
                var timenow = new Date().getTime();
                var timelastitem;
                for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                    if(typeof timelastitem === "undefined"){
                        timelastitem = data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0];
                    }
                    else{
                        if(timelastitem<data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0]){
                            timelastitem = data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0];
                        }
                    }
                     
                }
                if(timelastitem+s.granularity_value*timelist[s.granularity_unit]<s.to_value){
                    var apiurl = 'https://api.netpie.io/feed/'+s.feedid+'?apikey='+s.apikey+'&granularity='+s.granularity_value+s.granularity_unit+'&aggregate=avg&from='+timelastitem+'&to='+s.to_value;
                    $.getJSON( apiurl, function(datajson) {
                        if(typeof datajson['lastest_data'] !== "undefined"){
                            for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                                for (var j = 0; j<datajson['data'].length ; j++) {
                                    if(data['data']['data'][i].attr==datajson['data'][j].attr){
                                        for (var k = 0; k<datajson['data'][j]['values'].length ; k++) {
                                            if(data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0]<datajson['data'][j]['values'][k][0]){
                                                datajson['data'][j]['values'].splice(0,k)
                                                data['data']['data'][i]['values'] = data['data']['data'][i]['values'].concat(datajson['data'][j]['values']);
                                                break;
                                            }
                                        }
                                        var byTimestamp = data['data']['data'][i]['values'].slice(0);
                                        byTimestamp.sort(function(a,b) {
                                            return a[0] - b[0];
                                        });
                                        data['data']['data'][i]['values'] = byTimestamp;
                                        break;
                                    }
                                }
                            }
                            data['data']['lastest_data'] = datajson['lastest_data'];
                            updateCallback(data);
                        }
                    });
                }
                
            }
            else{
                var apiurl = 'https://api.netpie.io/feed/'+s.feedid+'?apikey='+s.apikey+'&granularity='+s.granularity_value+s.granularity_unit+'&aggregate=avg&from='+s.from_value+'&to='+s.to_value;
                $.getJSON( apiurl, function(datajson) {
                    data['data'] = datajson;
                    var newfrom;
                    var newto;
                    if(typeof data['data']['lastest_data'] !== "undefined"){
                        for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                            var timelastitem = data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0];
                            if(data['data']['lastest_data'][i]['values'][0][0]>timelastitem+timelist[data['data']['granularity'][1]]*data['data']['granularity'][0]){
                                if(typeof newfrom === "undefined"){
                                    newfrom = timelastitem+1000;
                                    newto = data['data']['lastest_data'][i]['values'][0][0];
                                }
                                else{
                                    if(newfrom>timelastitem){
                                        newfrom = timelastitem;
                                    }
                                }
                            }
                        }
                    }
                    data['data']['lastest_data'] = datajson['lastest_data'];
                    updateCallback(data);
                    if(typeof newfrom !== "undefined"){
                        reloadjData(s,newfrom,newto)
                    }                
                });
            }
        }

        function reloadjData(s,from,to) {
            var apiurl = 'https://api.netpie.io/feed/'+s.feedid+'?apikey='+s.apikey+'&granularity='+s.granularity_value+s.granularity_unit+'&aggregate=avg&from='+from+'&to='+to;
            $.getJSON( apiurl, function(datajson) {
                for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                    data['data']['data'][i]['values'] = data['data']['data'][i]['values'].concat(datajson['data'][i]['values']);
                }
                var newfrom;
                var newto;
                for (var i = 0; i<data['data']['lastest_data'].length ; i++) {
                    var timelastitem = data['data']['data'][i]['values'][data['data']['data'][i]['values'].length-1][0];
                    if(data['data']['lastest_data'][i]['values'][0][0]>timelastitem+timelist[data['data']['granularity'][1]]*data['data']['granularity'][0]){
                        if(typeof newfrom === "undefined"){
                            newfrom = timelastitem+1000;
                            newto = data['data']['lastest_data'][i]['values'][0][0];
                        }
                        else{
                            if(newfrom>timelastitem){
                                newfrom = timelastitem;
                            }
                        }
                    }
                }
                data['data']['lastest_data'] = datajson['lastest_data'];
                updateCallback(data);
                if(typeof newfrom !== "undefined"){
                    reloadjData(s,newfrom,newto)
                }
            });
        }

        if (currentSettings.interval > 0) {

            setTimeout(function() {
                if(typeof currentSettings.from_value !== "undefined" && typeof currentSettings.to_value!== "undefined"){
                    if(currentSettings.from_value.length!=0&&currentSettings.to_value!=0){
                        reloadiData(currentSettings);
                    }
                    else{
                        reloadhData(currentSettings);
                    }
                }
                else{
                    reloadhData(currentSettings);
                }
            },500);

            dsstore[currentSettings.name]['timer'] = setInterval(function() {
                if(typeof currentSettings.from_value !== "undefined" && typeof currentSettings.to_value!== "undefined"){
                    if(currentSettings.from_value.length!=0&&currentSettings.to_value!=0){
                        reloadiData(currentSettings);
                    }
                    else{
                        reloadhData(currentSettings);
                    }
                }
                else{
                    reloadhData(currentSettings);
                }
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
                newSettings.from_value != currentSettings.from_value ||
                newSettings.to_value != currentSettings.to_value ||
                false ) apiChanged = true;

            if (apiChanged) {
                if (dsstore && dsstore[newSettings.name] && dsstore[newSettings.name]['timer']) {
                    clearInterval(dsstore[newSettings.name]['timer']);
                }
                dsstore[newSettings.name]['timer'] = setInterval(function() {
                     if(typeof currentSettings.from_value != 'undefined' && typeof currentSettings.to_value != 'undefined' && currentSettings.from_value.length!=0 &&currentSettings.to_value.length!=0){
                        reloadiData(currentSettings);
                    }
                    else{
                        reloadhData(currentSettings);
                    }
                }, newSettings.interval*1000);
                apiChanged = false;
            }

            currentSettings = newSettings;
            setTimeout(function(){
                data = {};
                if(typeof currentSettings.from_value != 'undefined' && typeof currentSettings.to_value != 'undefined' && currentSettings.from_value.length!=0 &&currentSettings.to_value.length!=0){
                    reloadiData(currentSettings);
                }
                else{
                    reloadhData(currentSettings);
                }
            },500);

        }

        self.onDispose = function() {
            delete(self.mg);
        }

    }
}());
