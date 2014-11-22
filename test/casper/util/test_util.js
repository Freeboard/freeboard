var fs = require('fs');

exports.FREEBOARD_URL = fs.workingDirectory + '/index.html';

exports.BOGUS = 'json_input';

var SELECTORS = {
	adminBar : '#admin-bar',
	modelOverlay : '#modal_overlay',
	addDatasource : '#datasources span.text-button',
	pluginTypeDropdown : '#modal_overlay #setting-value-container-plugin-types select',
	nameValueInput : '#modal_overlay #setting-value-container-name input',
	urlValueInput : '#modal_overlay #setting-value-container-url input',
	valueValueInput : '#modal_overlay #setting-value-container-value textarea',
	modalOK : '#modal_overlay #dialog-ok',
	modalValidationError : '#modal_overlay validation-error',
	datasourceTable : '#datasources table#datasources-list',
	datasourceName : '#datasources table#datasources-list span.datasource-name',
	datasoureUpdated : '#datasources table#datasources-list tr td:nth-child(2)',
	allPanes : '#board-content li',
	allWidgets : '#board-content li section',
	boardTools : '#board-tools',
	addPane : '#board-tools #add-pane',
	addWidget : '#board-content li header li i.icon-plus',
	autofillDatasource : '#modal_overlay #setting-value-container-value li i.icon-plus',
	autofillMenu : '#modal_overlay #value-selector',
	autofillMenuItem : '#modal_overlay #value-selector li:nth-child(%s)',
	singlePaneTextWidget : '#board-content li section div.tw-value',
	trashWidget : '#board-content li section i.icon-trash',
	trashPane : '#board-content li header i.icon-trash',
	trashDatasource : '#datasources table#datasources-list i.icon-trash'
};
exports.SELECTORS = SELECTORS;

function setValueAndTriggerChange(test, selector, value) {
	test.assertVisible(selector);
	casper.evaluate(function(selector, value) {
		$(selector).val(value).change();
	}, selector, value);
}
exports.setValueAndTriggerChange = setValueAndTriggerChange;

function clickModalOK(test) {
	casper.then(function() {
		test.assertVisible(SELECTORS.modalOK);
		casper.click(SELECTORS.modalOK);
		test.assertNotVisible(SELECTORS.modalValidationError);
	});
	casper.waitWhileVisible('#modal_overlay');
}
exports.clickModalOK = clickModalOK;

exports.getAutofillMenuItemSelector = function(index) {
	return SELECTORS.autofillMenuItem.replace('%s', index);
}

exports.addJSONDatasource = function(test, name, url) {

	casper.then(function() {
		// Click Add datasource
		casper.click(SELECTORS.addDatasource);

		// Select JSON
		setValueAndTriggerChange(test, SELECTORS.pluginTypeDropdown, 'JSON');

		// Name the datasource "json_input"
		setValueAndTriggerChange(test, SELECTORS.nameValueInput, name);

		// Specify fixtures/input.json as the source
		setValueAndTriggerChange(test, SELECTORS.urlValueInput, url);
	});

	// Click ok
	clickModalOK(test);

	casper.then(function() {
		// Assert that the datasource displays correctly
		test.assertVisible(SELECTORS.datasourceName);
		var datasourceName = casper.fetchText(SELECTORS.datasourceName);
		test.assertEquals(datasourceName, name);
		var datasourceTime = casper.fetchText(SELECTORS.datasourceUpdated);
		test.assertNotEquals(datasourceTime, 'never');
	});
};
