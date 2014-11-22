var util = require('../util/test_util.js');

casper.options.viewportSize = {width: 1024, height: 768}
casper.options.onError = function() {
	casper.capture("error_screenshot.png");
};

casper.test.begin('Freeboard smoke test', function testFunction(test)
{
	casper.start(util.FREEBOARD_URL, function()
	{
		// Test initial page load state
		test.assertTitle('freeboard');
		test.assertVisible(util.SELECTORS.adminBar);
		test.assertNotVisible(util.SELECTORS.modalOverlay);
	});

	util.addJSONDatasource(test, 'json_input', 'test/fixtures/input.json');

	casper.then(function() {
		// Click add pane
		test.assertNotVisible(util.SELECTORS.allPanes);
		test.assertVisible(util.SELECTORS.boardTools);
		this.click(util.SELECTORS.addPane);
		test.assertVisible(util.SELECTORS.allPanes);

		// Click add widget
		this.click(util.SELECTORS.addWidget);
		test.assertVisible(util.SELECTORS.pluginTypeDropdown);

		// Select text widget
		util.setValueAndTriggerChange(test, util.SELECTORS.pluginTypeDropdown, 'text_widget');

		// Click datasource autofill
		test.assertVisible(util.SELECTORS.valueValueInput);
		test.assertVisible(util.SELECTORS.autofillDatasource);
		this.click(util.SELECTORS.autofillDatasource);
		test.assertVisible(util.SELECTORS.autofillMenu);
		var valueName = this.fetchText(util.getAutofillMenuItemSelector(1));
		test.assertEquals(valueName, 'json_input');

		// Select the first (and only) datasource
		this.mouseEvent('mousedown', util.getAutofillMenuItemSelector(1));
		test.assertVisible(util.SELECTORS.autofillMenu);

		// Select the "meta" sub-object of the datasource
		valueName = this.fetchText(util.getAutofillMenuItemSelector(4));
		test.assertEquals(valueName, 'meta');
		this.mouseEvent('mousedown', util.getAutofillMenuItemSelector(4));
		test.assertVisible(util.SELECTORS.autofillMenu);

		// Select the "year" field to be displayed
		valueName = this.fetchText(util.getAutofillMenuItemSelector(5));
		test.assertEquals(valueName, 'year');
		this.mouseEvent('mousedown', util.getAutofillMenuItemSelector(5));
		test.assertNotVisible(util.SELECTORS.autofillMenu);
	});

	// Click save
	util.clickModalOK(test);

	casper.then(function() {
		// Assert that the new text widget displays the correct value
		test.assertVisible(util.SELECTORS.singlePaneTextWidget);
		var textValue = this.fetchText(util.SELECTORS.singlePaneTextWidget);
		test.assertEquals(textValue, '2018');

		// Click and confirm delete widget
		this.click(util.SELECTORS.trashWidget);
	});

	util.clickModalOK(test);

	casper.then(function() {
		// Assert widget deleted, pane not deleted
		test.assertNotVisible(util.SELECTORS.allWidgets);
		test.assertVisible(util.SELECTORS.allPanes);

		// Click and confirm delete pane
		this.click(util.SELECTORS.trashPane);
	});

	util.clickModalOK(test);

	casper.then(function() {
		// Confirm pane deleted
		test.assertNotVisible(util.SELECTORS.allPanes);

		// Click and confirm delete datasource
		test.assertVisible(util.SELECTORS.datasourceTable);
		this.click(util.SELECTORS.trashDatasource);
	});

	util.clickModalOK(test);

	casper.then(function() {
		// Confirm datasource deleted
		test.assertNotVisible(util.SELECTORS.datasourceTable);
	});

	casper.run(function() {
		this.reload();
		test.done();
	});
});
