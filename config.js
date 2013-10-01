/*var gridConfig = {
	"allowEdit": true,
	"datasources": [
		{
			name   : "bunker_still",
			type   : "json",
			url    : "http://ops.bunkerstills.com/things/1291d1ffb033/status?access_code=355272e39ec44198bf0dec6f58a003b7&callback=?",
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
					"title"  : "Now",
					"type"   : "text-with-sparkline",
					"value"  : "datasource: bunker_still.status.components.ambientPressure.value",
					"refresh": "bunker_still",
					"units" : "kpa"
				},
				{
					"title"  : "Now",
					"type"   : "text-with-sparkline",
					"value"  : "datasource: bunker_still.status.components.ambientPressure.value",
					"refresh": "bunker_still",
					"units"  : "kpa"
				}
			]
		}
	]
}*/

var gridConfig = {
	"allow_edit"  : true,
	"datasources": [
		/*{
			name   : "Bug",
			type   : "json",
			url    : "http://api.bugswarm.net/stream?swarm_id=69df1aea11433b3f85d2ca6e9c3575a9c86f8182&resource_id=c907c8bb15914a829b256c908aab2c54af48f5f3",
			refresh: 0,
			chunked: true,
			headers : {
				"x-bugswarmapikey" : "bc60aa60d80f7c104ad1e028a5223e7660da5f8c"
			}
		},*/
        {
            name   : "Weather",
            type   : "jsonp",
            url    : "http://api.openweathermap.org/data/2.5/weather?q=London,uk",
            refresh: 5
        }
	],
	"widgets"    : [
		/*{
			"title"   : "Status",
			"width"   : 1,
			"row"     : 1,
			"col"     : 1,
			"sections": [
				{
					"title"  : "Potentiometer",
					"type"   : "text-with-sparkline",
					"value"  : 'javascript: return (datasources.Bug.message && datasources.Bug.message.from.resource == "b3758d7e719bce152c785d4ef653452c1c9ccb31" && datasources.Bug.message.payload.name == "Potentiometer") ? datasources.Bug.message.payload.feed.Raw : this.current_value',
					"refresh": "Bug",
					"units"  : "Ohms"
				},
                {
                    "title"  : "Potentiometer",
                    "type"   : "text-with-sparkline",
                    "value"  : 'javascript: return (datasources.Bug.message && datasources.Bug.message.from.resource == "b3758d7e719bce152c785d4ef653452c1c9ccb31" && datasources.Bug.message.payload.name == "Potentiometer") ? datasources.Bug.message.payload.feed.Raw : this.current_value',
                    "refresh": "Bug",
                    "units"  : "Ohms"
                }
			]
        },*/
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
	                "title"  : "Wind Speed",
	                "type"   : "text-with-sparkline",
	                "value"  : 'javascript: datasources.Weather.wind.speed',
	                "refresh": "Weather",
	                "units"  : "MPH"
                },
                {
	                "title"  : "Wind Speed",
	                "type"   : "text-with-sparkline",
	                "value"  : 'javascript: datasources.Weather.wind.speed',
	                "refresh": "Weather",
	                "units"  : "MPH"
                },
                {
	                "title"  : "Wind Speed",
	                "type"   : "text-with-sparkline",
	                "value"  : 'javascript: datasources.Weather.wind.speed',
	                "refresh": "Weather",
	                "units"  : "MPH"
                },
                {
	                "title"  : "Wind Speed",
	                "type"   : "text-with-sparkline",
	                "value"  : 'javascript: datasources.Weather.wind.speed',
	                "refresh": "Weather",
	                "units"  : "MPH"
                }
            ]
        }
	]
}