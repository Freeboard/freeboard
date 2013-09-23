// SWITCH/CASE binding for Knockout http://knockoutjs.com/
// (c) Michael Best
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
// Version 1.2.3

(function(root, factory)
{
	if(typeof define === 'function' && define.amd)
	{
		// AMD. Register as an anonymous module.
		define(['knockout'], factory);
	}
	else
	{
		// Browser globals
		factory(root.ko);
	}
}(this, function(ko)
{

	var undefined;

	// If used with the non-debug version, ko.virtualElements isn't exported
	if(!ko.virtualElements)
		ko.virtualElements = { allowedBindings: ko.allowedVirtualElementBindings };
	if(!ko.nativeTemplateEngine.instance)
		ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
	if(!ko.bindingRewriteValidators)
		ko.bindingRewriteValidators = ko.jsonExpressionRewriting.bindingRewriteValidators;
	if(!ko.bindingFlags)
		ko.bindingFlags = {};

	var defaultvalue = {}, initSwitchNodes, bindSwitchNodes;
	if(ko.virtualElements.firstChild)
	{
		// Code for Knockout 2.1+
		initSwitchNodes = function()
		{
		};
		bindSwitchNodes = function(element, bindingContext, switchBindings)
		{
			var node, nextInQueue = ko.virtualElements.firstChild(element);
			while(node = nextInQueue)
			{
				nextInQueue = ko.virtualElements.nextSibling(node);
				switch (node.nodeType)
				{
					case 1:
					case 8:
						var newContext = bindingContext.extend(switchBindings);
						ko.applyBindings(newContext, node);
						break;
				}
			}
		};
	}
	else
	{
		// Code for Knockout 2.0
		initSwitchNodes = function(element)
		{
			if(element.nodeType == 8)
			{    // if comment node, contents have been saved as a template
				// add the copied nodes back in
				var nodesArray = ko.nativeTemplateEngine.instance.renderTemplateSource(new ko.templateSources.anonymousTemplate(element)), endCommentNode = element.nextSibling, parent = element.parentNode;
				for(var i = 0, j = nodesArray.length; i < j; i++)
					parent.insertBefore(nodesArray[i], endCommentNode);
				return nodesArray;
			}
			else
			{
				return element.childNodes;
			}
		};
		bindSwitchNodes = function(element, bindingContext, switchBindings, nodesArray)
		{
			// node loop logic copied from src/templating.js
			var parent = nodesArray.length ? nodesArray[0].parentNode : null;
			for(var i = 0, n = nodesArray.length; i < n; i++)
			{
				var node = nodesArray[i];
				if(node.parentNode !== parent) // Skip anything that has been removed during binding
					continue;
				switch (node.nodeType)
				{
					case 1:
					case 8:
						var newContext = ko.utils.extend(ko.utils.extend(new bindingContext.constructor(), bindingContext), switchBindings);
						ko.applyBindings(newContext, node);
						break;
				}
			}
		};
	}

	ko.bindingHandlers['switch'] = {
		flags     : ko.bindingFlags.contentBind | ko.bindingFlags.canUseVirtual | ko.bindingFlags.noValue,
		init      : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			var nodesArray = initSwitchNodes(element);
			var value = ko.utils.unwrapObservable(valueAccessor()), switchSkipNextArray = [], switchBindings = {
					// these properties are internal
					$switchIndex        : undefined,
					$switchSkipNextArray: switchSkipNextArray,
					$switchValueAccessor: valueAccessor,
					$switchDefault      : ko.observable(true),
					// these properties are public
					$default            : defaultvalue,
					$else               : defaultvalue,
					$value              : value
				};
			// Each child element gets a new binding context so it can have it's own $switchIndex property.
			// The other properties will be shared since they're objects.
			bindSwitchNodes(element, bindingContext, switchBindings, nodesArray);
			return { controlsDescendantBindings: true };
		},
		preprocess: function(value)
		{
			return value || 'true';
		}
	};
	ko.bindingRewriteValidators['switch'] = false; // Can't rewrite control flow bindings
	ko.virtualElements.allowedBindings['switch'] = true;

	function checkCase(value, bindingContext)
	{
		// Check value and determine result:
		//  If the control value is boolean, the result is the matching truthiness of the value
		//  If value is boolean, the result is the value (allows expressions instead of just simple matching)
		//  If value is an array, the result is true if the control value matches (strict) an item in the array
		//  Otherwise, the result is true if value matches the control value (loose)
		var switchValue = ko.utils.unwrapObservable(bindingContext.$switchValueAccessor());
		return (typeof switchValue == 'boolean') ? (value ? switchValue : !switchValue) : (typeof value == 'boolean') ? value : (value instanceof Array) ? (ko.utils.arrayIndexOf(value, switchValue) !== -1) : (value == switchValue);
	}

	function checkNotCase(value, bindingContext)
	{
		return !checkCase(value, bindingContext);
	}

	function makeTemplateValueAccessor(ifValue)
	{
		return function()
		{
			return { 'if': ifValue, templateEngine: ko.nativeTemplateEngine.instance }
		};
	}

	function makeOtherValueAccessor(ifValue)
	{
		return function()
		{
			return ifValue
		};
	}

	function makeCaseHandler(binding, isNot, makeValueAccessor)
	{
		var checkFunction = isNot ? checkNotCase : checkCase;
		binding = binding || 'template';
		makeValueAccessor = makeValueAccessor || (binding == 'template' ? makeTemplateValueAccessor : makeOtherValueAccessor);

		return {
			// Inherit flags from the binding we're wrapping (but we don't want the contentSet from template)
			flags: ko.bindingHandlers[binding].flags ^ ko.bindingFlags.contentSet,

			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
			{
				if(!bindingContext.$switchSkipNextArray)
					throw Error("case binding must only be used with a switch binding");
				if(bindingContext.$switchIndex !== undefined)
					throw Error("case binding cannot be nested");
				// Initialize $switchIndex and push a new observable to $switchSkipNextArray
				bindingContext.$switchIndex = bindingContext.$switchSkipNextArray.push(ko.observable(false)) - 1;
				// Call init()
				if(ko.bindingHandlers[binding].init)
					return ko.bindingHandlers[binding].init(element, function()
					{
						return {};
					});
			},

			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
			{
				var index = bindingContext.$switchIndex, isLast = (index === bindingContext.$switchSkipNextArray.length - 1), result, skipNext, noDefault;

				if(index && bindingContext.$switchSkipNextArray[index - 1]())
				{
					// An earlier case binding matched: skip this one (and subsequent ones)
					result = false;
					skipNext = true;
				}
				else
				{
					var value = ko.utils.unwrapObservable(valueAccessor());
					if(value === bindingContext.$else)
					{
						// If value is the special object $else, the result depends on the other case values.
						// If we're the last *case* item, the value must be true. $switchDefault will get
						// updated to *true* below, but that won't necessarily update us because it would
						// require a recursive update.
						result = bindingContext.$switchDefault() || isLast;
						skipNext = false;
					}
					else
					{
						// If result is true, we will skip the subsequent cases (and any default cases)
						noDefault = skipNext = result = checkFunction(value, bindingContext);
					}
				}
				// Call update() with calculated value
				ko.bindingHandlers[binding].update(element, makeValueAccessor(result), allBindingsAccessor, viewModel, bindingContext);

				// Update the observable "skip next" value; if the value is changed, this will update the
				// subsequent case item.
				bindingContext.$switchSkipNextArray[index](skipNext);

				// Update $switchDefault to false if a non-default case item has matched.
				// Update it to true if we're the last item and none of items have matched.
				// (Initially, every item will be the last, but it doesn't matter.)
				if(noDefault)
					bindingContext.$switchDefault(false);
				else if(!skipNext && isLast)
					bindingContext.$switchDefault(true);
			}
		};
	}

	ko.bindingHandlers['case'] = makeCaseHandler('template');
	ko.bindingRewriteValidators['case'] = false; // Can't rewrite control flow bindings
	ko.virtualElements.allowedBindings['case'] = true;

	ko.bindingHandlers['casenot'] = makeCaseHandler('template', true);
	ko.bindingRewriteValidators['casenot'] = false; // Can't rewrite control flow bindings
	ko.virtualElements.allowedBindings['casenot'] = true;

	// Support dynamically creating new case binding when using key.subkey plugin
	function makeSubkeyHandler(baseKey, subKey, bindingKey)
	{
		if(ko.virtualElements.allowedBindings[subKey])
			ko.virtualElements.allowedBindings[bindingKey] = true;
		return makeCaseHandler(subKey, baseKey === 'casenot');
	}

	ko.bindingHandlers['case'].makeSubkeyHandler = makeSubkeyHandler;
	ko.bindingHandlers['casenot'].makeSubkeyHandler = makeSubkeyHandler;

	ko.bindingHandlers['case.visible'] = makeCaseHandler('visible');
	ko.bindingHandlers['casenot.visible'] = makeCaseHandler('visible', true);

	ko.bindingHandlers['switch'].makeCaseHandler = makeCaseHandler;

}));