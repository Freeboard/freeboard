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

> *allowEdit* (boolean) - Sets the initial state of freeboard to allow or disallow editing.

> *callback* (function) - Function that will be called back when freeboard has finished initializing.

-------

**freeboard.newDashboard()**

Clear the contents of the freeboard and initialize a new dashboard.

-------

**freeboard.serialize()**

Serializes the current dashboard and returns a javascript object.

-------

**freeboard.loadDashboard(configuration, [callback])**

Load the dashboard from a serialized dashboard object.

*configuration* (object) - A javascript object containing the configuration of a dashboard. Normally this will be an object that has been created and saved via the `freeboard.serialize()` function.

*callback* (function) - Function that will be called back when the dashboard has finished loading.

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
