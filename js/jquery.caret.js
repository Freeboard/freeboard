(function($)
{
	$.fn.insertAtCaret = function(text, opts)
	{
		var element = $(this).get(0);

		if(document.selection)
		{
			element.focus();
			var orig = element.value.replace(/\r\n/g, "\n");
			var range = document.selection.createRange();

			if(range.parentElement() != element)
			{
				return false;
			}

			range.text = text;

			var actual = tmp = element.value.replace(/\r\n/g, "\n");

			for(var diff = 0; diff < orig.length; diff++)
			{
				if(orig.charAt(diff) != actual.charAt(diff)) break;
			}

			for(var index = 0, start = 0; tmp.match(text) && (tmp = tmp.replace(text, "")) && index <= diff; index = start + text.length)
			{
				start = actual.indexOf(text, index);
			}
		}
		else if(element.selectionStart)
		{
			var start = element.selectionStart;
			var end = element.selectionEnd;

			element.value = element.value.substr(0, start) + text + element.value.substr(end, element.value.length);
		}

		if(start)
		{
			setCaretTo(element, start + text.length);
		}
		else
		{
			element.value = text + element.value;
		}

		$(this).change();

		return this;
	}

	$.fn.replaceTextAt = function(start, end, replacementText)
	{
		var element = $(this).get(0);

		var wholeString = $(this).val();
		var prefix = wholeString.substr(0, start);
		var suffix = wholeString.substr(end);

		$(this).val(prefix + replacementText + suffix);

		var newCursorPosition = prefix.length + replacementText.length;

		setCaretTo(element, newCursorPosition);

		$(this).change();

		return this;
	}

	$.fn.setCaretPosition = function(start, end)
	{
		var element = $(this).get(0);
		element.focus();
		setCaretTo(element, start, end);
		return this;
	}


	$.fn.getCaretPosition = function()
	{
		var element = $(this).get(0);
		$(element).focus();
		return getCaretPosition(element);
	}

	$.fn.getSelectedText = function()
	{
		var element = $(this).get(0);

		// workaround for firefox because window.getSelection does not work inside inputs
		if(typeof element.selectionStart == 'number')
		{
			return $(element).val().substr(element.selectionStart, element.selectionEnd - element.selectionStart);
		}
		else if(document.getSelection)
		{
			return document.getSelection();
		}
		else if(window.getSelection)
		{
			return window.getSelection();
		}
	}

	// privates
	function setCaretTo(element, start, end)
	{
		if(element.createTextRange)
		{
			var range = element.createTextRange();
			range.moveStart('character', start);
			range.moveEnd('character', (end || start));
			range.select();
		}
		else if(element.selectionStart)
		{
			element.focus();
			element.setSelectionRange(start, (end || start));
		}
	}

	function getCaretPosition(element)
	{
		if(typeof element.selectionStart == 'number')
		{
			return element.selectionStart;
		}
		else if(document.selection)
		{
			var range = document.selection.createRange();
			var rangeLength = range.text.length;
			range.moveStart('character', -element.value.length);
			return range.text.length - rangeLength;
		}
	}
})(jQuery);