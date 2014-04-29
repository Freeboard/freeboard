var pubnubDatasource = function (settings, updateCallback) {
    var self = this;
    var currentSettings = {};
    var pubnub;

    this.onPubNubHistory = function (envelope) {
        var messages = envelope[0];
        for (var idx in messages) {
            self.onPubNubMessage(messages[idx]);
        }
    }

    this.onPubNubMessage = function (message) {

        if (_.isString(message)) {
            // Parse as JSON if it's a string
            try {
                var messageObject = JSON.parse(message);

                if (messageObject) {
                    updateCallback(messageObject);
                }
            }
            catch (e) {
            }
        }
        else
        {
            updateCallback(message);
        }
    }

    this.changeChannel = function (newChannel) {

        try {
            pubnub.unsubscribe({
                channel: currentSettings["channel"]
            });
        }
        catch (e) {

        }

        if (newChannel) {
            pubnub.subscribe({
                channel: newChannel,
                message: self.onPubNubMessage
            })
        }
    }

    this.closeConnection = function () {
        self.changeChannel(null);
        // TODO: Find out if there is a close function for pubnub. There isn't one documented.
        pubnub = null;
    }

    this.updateNow = function () {
        pubnub.history({
            channel: currentSettings["channel"],
            callback: self.onPubNubHistory
        })
    }

    this.onDispose = function () {
        self.closeConnection();
    }

    this.onSettingsChanged = function (newSettings) {
        if (newSettings["subscribe_key"] !== currentSettings["subscribe_key"]) {
            pubnub = PUBNUB.init({
                subscribe_key: newSettings["subscribe_key"],
                ssl: true
            });
        }

        if (newSettings["channel"] !== currentSettings["channel"]) {
            self.changeChannel(newSettings["channel"]);
        }

        currentSettings = newSettings;
    }

    self.onSettingsChanged(settings);
};

freeboard.loadDatasourcePlugin({
    "type_name": "pubnub",
    "display_name": "PubNub",
    "external_scripts": [
        "https://cdn.pubnub.com/pubnub.min.js"
    ],
    "settings": [
        {
            "name": "subscribe_key",
            "display_name": "Subscribe Key",
            "type": "text"
        },
        {
            "name": "channel",
            "display_name": "Channel",
            "type": "text"
        },
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
        newInstanceCallback(new pubnubDatasource(settings, updateCallback));
    }
});