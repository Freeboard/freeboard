
var arr = [];
$.ajax({
	url: 'http://'+window.location.hostname+':3213/GetLutList',
	dataType: "JSON",
	type: "GET",
	success: function (jsonObj) {
		var luOptions = "";
		for(var i=0;i < jsonObj["data"].length; i++){
			var map = {'name':jsonObj["data"][i],'value':jsonObj["data"][i]};
			arr.push(map);
		}
	},
	error: function (xhr, status, error) {
		alert("Error: Unable to fetch LU list !");
	}
});


freeboard.loadDatasourcePlugin({
	type_name: "Fabric DS",
	settings: [    
	           {
             	  "name": "luName",
             	  "display_name": "LU Name",
             	  "type": "option",
             	  "options"     : arr
               },
	           {
	        	   name: "query",
	        	   display_name: "SELECT Query",
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
		alert(inputQuery);
		var luName =  currentSettings.luName;
		var hostname = window.location.hostname;
		var requestUrl = "http://"+hostname+":3213/queryFabric?token="
			+getQueryString('token')+"&lu="+encodeURIComponent(luName)
			+"&iid="+getQueryString('iid')+"&sql="+encodeURIComponent(inputQuery);
		alert(encodeURIComponent(inputQuery));
		$.ajax({
			url: requestUrl,
			dataType: "JSON",
			type: "GET",
			success: function (data) {
				$('.modal-content-mymodal p').text(""); 
				$( '#myModal' ).css("display", "none");
				updateCallback(data);
			},
			error: function (xhr, status, error) {
				$('.modal-content-mymodal p').text(xhr.responseText); 
				$( '#myModal' ).fadeIn();
				//empty DS widgets/Gauges
				updateCallback({"results":[]});
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

