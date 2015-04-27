freeboard
==========

**free·board** (noun) *\ˈfrē-ˌbȯrd\*

1. the distance between the waterline and the main deck or weather deck of a ship or between the level of the water and the upper edge of the side of a small boat.
2. the act of freeing data from below the "waterline" and exposing it to the world.
3. a damn-sexy, open source real-time dashboard builder/viewer for IOT and other web mashups.

### Demo
http://freeboard.github.io/freeboard

https://freeboard.io

### Screenshots
![Weather](https://raw.github.com/Freeboard/branding/master/screenshots/freeboard-screenshot-1.jpg)

### What is It?

Freeboard is a turn-key HTML-based "engine" for dashboards. Besides a nice looking layout engine, it provides a plugin architecture for creating datasources (which fetch data) and widgets (which display data)— freeboard then does all the work to connect the two together. Another feature of freeboard is its ability to run entirely in the browser as a single-page static web app without the need for a server. The feature makes it extremely attractive as a front-end for embedded devices which may have limited ability to serve complex and dynamic web pages.

The code here is the client-side portion of what you see when you visit a freeboard at http://freeboard.io. It does not include any of the server-side code for user management, saving to a database or public/private functionality— this is left up to you to implement should you want to use freeboard as an online service.

### How to Use

Freeboard can be run entirely from a local hard drive. Simply download/clone the repository and open index.html. When using Chrome, you may run into issues with CORS when accessing JSON based APIs if you load from your local hard-drive— in this case you can switch to using JSONP or load index.html and run from a local or remote web server.

### API

While freeboard runs as a stand-alone app out of the box, you can augment and control it from javascript with a simple API. All API calls are made on the `freeboard` singleton object.

-------

**freeboard.initialize(allowEdit, [callback])**

Must be called first to initialize freeboard.

> **allowEdit** (boolean) - Sets the initial state of freeboard to allow or disallow editing.

> **callback** (function) - Function that will be called back when freeboard has finished initializing.

-------

**freeboard.newDashboard()**

Clear the contents of the freeboard and initialize a new dashboard.

-------

**freeboard.serialize()**

Serializes the current dashboard and returns a javascript object.

-------

**freeboard.loadDashboard(configuration, [callback])**

Load the dashboard from a serialized dashboard object.

> **configuration** (object) - A javascript object containing the configuration of a dashboard. Normally this will be an object that has been created and saved via the `freeboard.serialize()` function.

> **callback** (function) - Function that will be called back when the dashboard has finished loading.

-------

**freeboard.setEditing(editing, animate)**

Programatically control the editing state of the of dashboard.

> **editing** (bool) - Set to true or false to modify the view-only or editing state of the board.

> **animate** (function) - Set to true or false to animate the modification of the editing state. This animates the top-tab dropdown (the part where you can edit datasources and such).

-------

**freeboard.isEditing()**

Returns boolean depending on whether the dashboard is in in the view-only or edit state.

-------

**freeboard.loadDatasourcePlugin(plugin)**

Register a datasource plugin. See http://freeboard.github.io/freeboard/docs/plugin_example.html for information on creating plugins.

> **plugin** (object) - A plugin definition object as defined at http://freeboard.github.io/freeboard/docs/plugin_example.html

-------

**freeboard.loadWidgetPlugin(plugin)**

Register a widget plugin. See http://freeboard.github.io/freeboard/docs/plugin_example.html for information on creating plugins.

> **plugin** (object) - A plugin definition object as defined at http://freeboard.github.io/freeboard/docs/plugin_example.html

-------

**freeboard.showLoadingIndicator(show)**

Show/hide the loading indicator. The loading indicator will display an indicator over the entire board that can be useful when you have some code that takes a while and you want to give a visual indication and to prevent the user from modifying the board.

> **show** (boolean) - Set to true or false to show or hide the loading indicator.

-------

**freeboard.showDialog(contentElement, title, okButtonTitle, cancelButtonTitle, okCallback)**

Show a styled dialog box with custom content.

> **contentElement** (DOM or jquery element) - The DOM or jquery element to display within the content of the dialog box.

> **title** (string) - The title of the dialog box displayed on the top left.

> **okButtonTitle** (string) - The string to display in the button that will be used as the OK button. A null or undefined value will result in no button being displayed.

> **cancelButtonTitle** (string) - The string to display in the button that will be used as the Cancel button. A null or undefined value will result in no button being displayed.

> **okCallback** (function) - A function that will be called if the user presses the OK button.

-------

**freeboard.getDatasourceSettings(datasourceName)**

Returns an object with the current settings for a datasource or null if no datasource with the given name is found.

> **datasourceName** (string) - The name of a datasource in the dashboard.

-------

**freeboard.setDatasourceSettings(datasourceName, settings)**

Updates settings on a datasource.

> **datasourceName** (string) - The name of a datasource in the dashboard.

> **settings** (object) - An object of key-value pairs for the settings of the datasource. The values specified here will be combined with the current settings, so you do not need specify every setting if you only want to update one. To get a list of possible settings for a datasource, consult the datasource documentation or code, or call the freeboard.getDatasourceSettings function.

-------

**freeboard.on(eventName, callback)**

Attach to a global freeboard event.

> **eventName** (string) - The name of a global event. The following events are supported:

> **"dashboard_loaded"** - Occurs after a dashboard has been loaded.

> **"initialized"** - Occurs after freeboard has first been initialized.

> **callback** (function) - The callback function to be called when the event occurs.

-------

### Building Plugins

See http://freeboard.github.io/freeboard/docs/plugin_example.html for info on how to build plugins for freeboard.

### Testing Plugins

Just edit index.html and add a link to your javascript file near the end of the head.js script loader, like:

```javascript
...
"path/to/my/plugin/file.js",
$(function()
{ //DOM Ready
    freeboard.initialize(true);
});
```

### Copyright 

Copyright © 2013 Jim Heising (https://github.com/jheising)<br/>Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)<br/>Licensed under the **MIT** license.

---
