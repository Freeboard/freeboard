function toggletheme() {
    var stylesheet = document.getElementById('netpie-theme-css');
    if(stylesheet!=null){
        stylesheet.parentNode.removeChild(stylesheet);
        np_theme = "default";
    }
    else{
        var  theme = document.createElement('link');
        theme.id = 'netpie-theme-css';
        theme.href = 'css/netpie.theme.css';
        theme.rel = 'stylesheet';
        document.head.appendChild(theme);
        np_theme = "netpie";
    }
    if (typeof feedview !== "undefined") {
        for (var i = feedview.length - 1; i >= 0; i--) {
            updateChart('chart'+feedview[i].id,feedview[i].datajson,feedview[i].settings);
        }
    }
    saveTheme();
}

if (typeof np_theme === "undefined") {
    np_theme = "default";
}

function saveTheme(){
    var data = window.localStorage.getItem("netpie.freeboard.dashboard");
    if(data!==null){
        var datajson = JSON.parse(data);
        datajson.theme = np_theme;
        window.localStorage.setItem("netpie.freeboard.dashboard", JSON.stringify(datajson));
    }    
}

(function()
{
    var stylesheet = document.getElementById('netpie-theme-css');
    var data = window.localStorage.getItem("netpie.freeboard.dashboard");
    var datajson = JSON.parse(data);
    if(datajson!==null){
        if(datajson.theme===null || datajson.theme=="default"){
            if(stylesheet!=null){
                stylesheet.parentNode.removeChild(stylesheet);
            }
            np_theme = "default";
            document.getElementById('theme-toggle').checked = false;
        }
        if(datajson.theme=="netpie"){
            var  theme = document.createElement('link');
            theme.id = 'netpie-theme-css';
            theme.href = 'css/netpie.theme.css';
            theme.rel = 'stylesheet';
            document.head.appendChild(theme);
            np_theme = "netpie";
            document.getElementById('theme-toggle').checked = true;
        }
    }
    else{
        np_theme = "default";
        document.getElementById('theme-toggle').checked = false;
    }
    saveTheme();
}());