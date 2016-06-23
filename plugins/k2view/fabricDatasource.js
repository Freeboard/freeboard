
freeboard.loadDatasourcePlugin({
	type_name: "Fabric DS",
	settings: [
	           {
	        	   name: "luName",
	        	   display_name: "LU Name",
	        	   type: "text"
	           },
	           {
	        	   name: "query",
	        	   display_name: "Query",
	        	   type: "text"
	           },
	           {
	        	   name: "refresh",
	        	   display_name: "Refresh Every",
	        	   type: "number",
	        	   suffix: "seconds",
	        	   default_value: 60
	           }
	           ],
	           newInstance: function (settings, newInstanceCallback, updateCallback) {
	        	   newInstanceCallback(new fabricDatasource(settings, updateCallback));
	           }
});

var getQueryString = function ( field , url) {
	var href = url ? url : window.location.href;
	var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
	var string = reg.exec(href);
	return string ? string[1] : null;
};


var fabricDatasource = function (settings, updateCallback) {
	var self = this;
	var updateTimer = null;
	var currentSettings = settings;

	function updateRefresh(refreshTime) {
		if (updateTimer) {
			clearInterval(updateTimer);
		}

		updateTimer = setInterval(function () {
			self.updateNow();
		}, refreshTime);
	}

	updateRefresh(currentSettings.refresh * 1000);

	this.updateNow = function () {
		var inputQuery = currentSettings.query;
		var luName =  currentSettings.luName;
		var hostname = window.location.hostname;
		var requestUrl = "http://"+hostname+":3213/queryFabric?token="
			+getQueryString('token')+"&lu="+luName+"&iid="+getQueryString('iid')+"&sql="+inputQuery;

		$.ajax({
			url: requestUrl,
			dataType: "JSON",
			type: "GET",
			success: function (data) {
				updateCallback(data);
			},
			error: function (xhr, status, error) {
				//TODO
			}
		});
	}

	this.onDispose = function () {
		clearInterval(updateTimer);
		updateTimer = null;
	}

	this.onSettingsChanged = function (newSettings) {
		currentSettings = newSettings;
		updateRefresh(currentSettings.refresh * 1000);
		self.updateNow();
	}
};

