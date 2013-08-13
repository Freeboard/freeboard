var gridConfig = {
	"datasources" : [
		{
			name : "bunker_still",
			type : "json",
			url : "http://ops.bunkerstills.com/things/1291d1ffb033/status?access_code=355272e39ec44198bf0dec6f58a003b7&callback=?",
			refresh : 5
		}
	],
	"widgets" : [
		{
			"title" : "Status",
			"width" : 2,
			"height": 2,
			"row" : 1,
			"col" : 1,
			"sections" :
				[
					{
						"title" : "Now",
						"type" : "big-text",
						"value" : "datasource: bunker_still.status.components.ambientPressure.value",
						"refresh" : "bunker_still"
					}
				]
		}
	]
}