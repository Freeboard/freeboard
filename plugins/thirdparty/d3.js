// # D3.js Visualization Plugin
//
// The D3.js visualization plugin lets you leverage the power of d3.js and the simplicity of the freeboard design.
//
// -------------------

(function()
{

  // ## A plugin that uses D3.js to visualise some data.
  //
  // -------------------
  // ### D3.js visualization
  //
  // -------------------
  freeboard.loadWidgetPlugin({
    "type_name"   : "mach_d3_plugin",
    "display_name": "D3.js Visualization",
    "description" : "Uses D3.js to visualize data",
    // **external_scripts** : Use the D3.js
    "external_scripts" : [
      "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"
    ],
    "fill_size" : false,
    "settings"    : [
      {
        "name"        : "data",
        "display_name": "Data",
        "description"  : "Bind the widget to a data source.",
        "type"        : "calculated"
      },
      {
        "name"        : "style",
        "display_name": "CSS",
        "description" : "Stylesheet rules to add to the whole page.",
        "type"        : "text"
      },
      {
        "name"        : "html",
        "display_name": "HTML",
        "description" : "The HTML to render in the widget.",
        "type"        : "text"
      },
      {
        "name"        : "code",
        "display_name": "D3.js Code",
        // We want the js editor so we can edit the d3.js code. However, we will not be accessing any of the data sources here.
        // Assume that there is a property called 'data' passed into the method, which is the result of the 'data' setting above.
        // Write the d3 code to visualize what is in the data argument.
        "description" : "Write the d3.js code to update the visualization.",
        "type"        : "calculated"
      },
      {
        "name"        : "sizeInBlocks",
        "display_name": "Size in Blocks (fractions are allowed)",
        "description" : "Fractions are allowed. eg: 1.5",
        "type"        : "number",
        // Fractions are allowed. Use this to set the appropriate height for the visualiation.
        // This value is in blocks (which is about 60px each).
        "default_value" : 1
      }
    ],
    newInstance   : function(settings, newInstanceCallback)
    {
      newInstanceCallback(new myWidgetPlugin(settings));
    }
  });

  // ### D3.js Implementation
  //
  // -------------------
  var myWidgetPlugin = function(settings)
  {
    var self = this;
    var currentSettings = settings;
    var container;

    // Create a variable for the created stylesheet:
    var styleSheet = null;

    self.render = function(containerElement)
    {
      // Here we append our text element to the widget container element.
      container = containerElement;

      // Load the settings:
      self.onSettingsChanged(currentSettings);
    }

    self.getHeight = function()
    {
      return currentSettings.sizeInBlocks ? currentSettings.sizeInBlocks : 1.0;
    }

    self.onSettingsChanged = function(newSettings)
    {
      // Normally we'd update our text element with the value we defined in the user settings above (the_text), but there is a special case for settings that are of type **"calculated"** -- see below.
      currentSettings = newSettings;

      // Check whether we specified some html:
      if(currentSettings.html)
      {
        // Insert the html:
        container.innerHTML = currentSettings.html;
      }

      // Check whether we specified a CSS stylesheet for the visualization:
      if(currentSettings.style)
      {
        // Check whether we already have a style for this component:
        if (self.styleSheet)
        {
          // We already have a stylesheet for this component.
          // Remove it:
          // http://www.w3.org/wiki/Dynamic_style_-_manipulating_CSS_with_JavaScript
          var sheetParent = self.styleSheet.parentNode;
          sheetParent.removeChild(self.styleSheet);
        }
        // Now we have removed any stylesheets from before if we had any.

        // Code for dynamically adding stylesheets.
        // http://davidwalsh.name/add-rules-stylesheets
        // http://www.w3.org/wiki/Dynamic_style_-_manipulating_CSS_with_JavaScript
        var createStyleSheet = function() {
          // Create the <style> tag
          var style = document.createElement("style");

          // Add a media (and/or media query) here if you'd like!
          // style.setAttribute("media", "screen")
          // style.setAttribute("media", "only screen and (max-width : 1024px)")

          // WebKit hack :(
          style.appendChild(document.createTextNode(""));

          // Add the <style> element to the page
          document.head.appendChild(style);

          return style;
        };

        // Create a new style sheet:
        self.styleSheet = createStyleSheet();

        // Add the rule to the style sheet:
        self.styleSheet.innerHTML = currentSettings.style;
      }
    }

    self.onCalculatedValueChanged = function(settingName, newValue)
    {
      // Remember we defined "the_text" up above in our settings.
      if(settingName == "data")
      {
        // Get the code that we want to run:
        var code = currentSettings.code;

        // Set the data:
        var data = newValue;

        // Evaluate the code:
        eval(code);
      }
    }

    self.onDispose = function()
    {
    }
  }
}());