var gridConfig = {
	"allow_edit"  : true,
	"datasources": [
        {
            name   : "Weather1",
            type   : "jsonp",
            url    : "http://api.openweathermap.org/data/2.5/weather?q=London,uk",
            refresh: 5
        },
        {
	        name   : "Weather2",
	        type   : "jsonp",
	        url    : "http://api.openweathermap.org/data/2.5/weather?q=London,uk",
	        refresh: 5
        }
	],
	"widgets"    : [
        {
            "title"   : "Status",
            "width"   : 1,
            "row"     : 1,
            "col"     : 1,
            "sections": [
                {
                    "type"   : "big-text",
                    "value"  : 'javascript: datasources.Weather.wind.speed',
                    "refresh": "Weather",
                    "units"  : "MPH"
                },
                {
	                "type"   : "text-with-sparkline",
	                "value"  : 'javascript: datasources.Weather.wind.speed',
	                "refresh": "Weather",
	                "units"  : "MPH"
                },
                {
	                "title"  : "Power",
	                "type"   : "gauge",
	                "value"  : 'javascript: datasources.Weather.wind.speed',
	                "refresh": "Weather",
	                "units"  : "MPH",
	                "min" : 0,
	                "max" : 200
                }
            ]
        }
	]
}