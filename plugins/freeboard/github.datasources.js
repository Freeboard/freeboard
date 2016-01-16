// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ GitHub Data Source Plugin                                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2015 Fergus Noble                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
	var jsonDatasource = function (settings, updateCallback) {
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
			var auth = currentSettings.auth ?
				"?client_id=" + currentSettings.client_id +
				"&client_secret=" + currentSettings.client_secret : "";
			var path = currentSettings.user + "/" + currentSettings.repo;

			$.when(
				$.get("https://api.github.com/repos/" + path + auth),
				$.get("https://api.github.com/repos/" + path + "/pulls" + auth),
				currentSettings.use_travis ? $.get("https://api.travis-ci.org/repos/" + path + "/branches/" + currentSettings.branch) : null,
				currentSettings.use_coveralls ? $.get("http://cors.io/?u=https://coveralls.io/github/" + path + ".json?branch=" + currentSettings.branch) : null
			).then(function(github, github_pr, travis, coveralls) {

				var data = {};
				data["num_pull_requests"] = github_pr[0].length;
				data["pull_requests"] = github_pr[0];
				data["num_open_issues"] = github[0]['open_issues_count'];
				data["github_repo"] = github[0];
				if (travis) {
					data["build_status"] = travis[0]['branch']['state'];
					data["travis"] = travis[0];
				}
				if (coveralls) {
					data["coveralls"] = JSON.parse(coveralls[0]);
					var cc = data["coveralls"]["covered_percent"];
					data["code_coverage"] = Number(Math.round(cc+'e2')+'e-2');
				}
				updateCallback(data);

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

	freeboard.loadDatasourcePlugin({
		type_name: "GitHub",
		settings: [
			{
				name: "user",
				display_name: "GitHub user / organization",
				type: "text"
			},
			{
				name: "repo",
				display_name: "GitHub repo",
				type: "text"
			},
			{
				name: "auth",
				display_name: "Use Authentication",
				type: "boolean",
				default_value: false
			},
			{
				name: "client_id",
				display_name: "Client ID",
				description: 'GitHub Application Client ID',
				type: "text"
			},
			{
				name: "client_secret",
				display_name: "Client Secret",
				description: 'GitHub Application Client Secret',
				type: "text"
			},
			{
				name: "use_travis",
				display_name: "Use Travis",
				description: 'Pull CI status from TravisCI',
				type: "boolean",
				default_value: true
			},
			{
				name: "use_coveralls",
				display_name: "Use Coveralls",
				description: 'Pull code coverage from Coveralls',
				type: "boolean",
				default_value: true
			},
			{
				name: "branch",
				display_name: "Branch",
				description: 'Branch for build and coverage status',
				type: "text",
				default_value: "master"
			},
			{
				name: "refresh",
				display_name: "Refresh Every",
				type: "number",
				suffix: "seconds",
				default_value: 120
			},
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new jsonDatasource(settings, updateCallback));
		}
	});

}());
