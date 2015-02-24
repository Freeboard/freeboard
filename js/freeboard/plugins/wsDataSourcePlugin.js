// ## A Web Socket Datasource Plugin for the Freeboard Dashboard
 
(function() {
 
    var wsDatasource = function(settings, updateCallback) {
        var server = window.location.hostname;
        var wsUri, ws;
 
        var self = this;
        var currentSettings = settings;
 
        function wsStart(wsUri) {
            ws = new WebSocket(wsUri);
 
            ws.onopen = function(evt) {
                console.log("ws : connected");
            };
 
            ws.onclose = function(evt) {
                console.log("ws : disconnected");
                setTimeout(function(){wsStart(wsUri)}, 3000); // try to reconnect every 3 secs...
            }
 
            ws.onmessage = function (evt) {
                try {
                    var da = JSON.parse(evt.data);
                    updateCallback(da);
                } catch (e) {
                    console.log("ws : bad parse",evt.data);
                }
            }
 
            ws.onerror = function(evt) {
                console.log("ws : error",evt);
            }
        }
 
        this.updateNow = function() {
            console.log("Update now");
        }
 
        this.onDispose = function() {
            console.log("Disposed");
        }
 
        this.onSettingsChanged = function(newSettings) {
            if (ws) ws.close();
            currentSettings = newSettings;
            wsUri = currentSettings.ws_uri;
            wsStart(wsUri);
        }
 
        self.onSettingsChanged(settings);
    };
 
    freeboard.loadDatasourcePlugin({
        type_name   : "web_socket",
        display_name: "Web Socket",
        settings    : [
            {
                name        : "ws_uri",
                display_name: "WS URI",
                description : "Example: ws://server:port/path",
                type        : "text"
            }
        ],
        newInstance : function(settings, newInstanceCallback, updateCallback)
        {
            newInstanceCallback(new wsDatasource(settings, updateCallback));
        }
    });
}());
