/* * * * * * * * * * * * * * * * * * * * * * * * * ** * * * * * * * * * * *
 * Battery widget plugin for freeboard.
 * Author: Vikas Lamba, https://github.com/vkylamba
 * Licensed under the MIT (http://raphaeljs.com/license.html) license.    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *  * * *
*/
(function () {

  var batteryWidget = function (settings) {

    var self = this;    
    var currentSettings = settings;
    var htmlElement;
    var data = 99;//
    var battHeight = currentSettings.batteryHeight;
    var battWidth = currentSettings.batteryWidth;

    this.render = function (element) {
      console.log('render');


      var battDiv = '<div id="'+currentSettings.id+'" align="center">\
             </div>';
      console.log(battDiv);
      htmlElement = $(battDiv);
      $(element).append(htmlElement);
    }

    this.onSettingsChanged = function (newSettings) {
      currentSettings = newSettings;
    }

    this.onCalculatedValueChanged = function (settingName, newValue) {
      console.log('onCalculatedValueChanged for ' + settingName);

      if (settingName == 'data')
        data = newValue;
        

      //render the battery
      htmlElement.empty();
      //Code to draw battery
      var canvas = '<canvas id="canvas_'+currentSettings.id+'" align="center" width="'+currentSettings.batteryWidth+'" height="'+currentSettings.batteryHeight+'" style="position: center; overflow: visible;">\
              HTML5 Canvas not supported\
             </canvas>';
    htmlElement.append(canvas);
      
      canvas  = document.getElementById('canvas_'+currentSettings.id);
      

      var start_x = 0, start_y = 0;
    var battery_height = currentSettings.batteryHeight;
    var battery_width = currentSettings.batteryWidth;
    var cap_height = battery_height/16;
    var cap_width = battery_width/3;
    var line_width = 2;
    var margin = 1;
    var number_of_blocks = 5;
    
    var context = canvas.getContext("2d");
    context.globalAlpha = 1;
    
    //Drawing the battery cap
    context.fillStyle = "#ffffff";
      context.fillRect(start_x + battery_width/2 - cap_width/2, start_y, cap_width, cap_height);
      
      //Clear the battery area first
    context.fillStyle = "#ffffff";
    context.fillRect(start_x, start_y + cap_height, battery_width, battery_height-cap_height);
      //Drawing body outline
      context.strokeStyle = "#000f00";
    context.lineWidth   = line_width;
    context.strokeRect(start_x, start_y + cap_height, battery_width, battery_height-cap_height);
    //context.fillStyle = "#000000";
    //context.fillRect(start_x + margin, start_y + cap_height + margin, battery_width - margin, battery_height-cap_height-margin);
    //Filling body
    var block_width = battery_width - 2*(line_width + margin);
    var block_height = Math.ceil((battery_height - cap_height - 2*(line_width + margin))/number_of_blocks) - 2*margin;
    var block_start_y = start_y + battery_height - line_width - margin;
    
    var last_block = Math.ceil(number_of_blocks*data[1]/100);
    var green_val = Math.floor(data[1]*255/100);//<49?255:0;


    var red_val = 255 - green_val;
    var linearGradient1 = context.createLinearGradient(start_x + line_width + margin, 
                                      start_y + cap_height + line_width + margin, 
                                      start_x + line_width + margin + block_width, 
                                      start_y + cap_height + line_width + margin);
    linearGradient1.addColorStop(0, 'rgb('+red_val+', '+green_val+', 0)');
    linearGradient1.addColorStop(0.5, 'rgb(0, 0, 0)');
    linearGradient1.addColorStop(1, 'rgb('+red_val+','+green_val+', 0)');
    
    for(var i=1;i <= last_block; i++)
    {
      var y_pos = start_y + block_start_y - i*(block_height + margin);
      
      context.fillStyle = linearGradient1;
      context.fillRect(start_x + line_width + margin, y_pos, block_width, block_height);
      //string += "("+y_pos +","+block_height+")";
    }
    
    //alert(string);
    context.font      = "16px Verdana";
    context.fillStyle = "#ff0000";
    context.fillText(data[0]+"V", start_x + battery_width/4, start_y + battery_height/2-15, battery_width);
    context.fillText(data[1]+"%", start_x + battery_width/4, start_y + battery_height/2+10, battery_width);
    context.fillText(data[2]+"℃", start_x + battery_width/4, start_y + battery_height/2+37, battery_width);
      
     
      
    }

    this.onDispose = function () {
    }

    this.getHeight = function () {
      return Number(currentSettings.height);
    }

    this.onSettingsChanged(settings);
  };

  freeboard.loadWidgetPlugin({
    "type_name": "batteryWidget",
    "display_name": "Battery",    
    "fill_size": true,  
    "settings": [
      {
        "name": "id",
        "display_name": "id",
        "default_value": "battery1",
        "description": "DOM element id of the battery (must be unique)"
      },        
      {
        "name": "data",
        "display_name": "Battery Data array",
        "type": "calculated",
        "description": "The data list of size 3 containing voltage, battery percentage, and battery temperature. ex: [12.3, 45, 34]"
      },    
      {
        "name": "batteryHeight",
        "display_name": "Battery Height (px)",
        "type": "number",
        "default_value": 120,
        "description": "battery height in pixels"
      },
      {
        "name": "batteryWidth",
        "display_name": "Battery Widgth (px)",
        "type": "number",
        "default_value": 80,
        "description": "battery width in pixels"
      },      
      {
        "name": "height",
        "display_name": "Height Blocks",
        "type": "number",
        "default_value": 2,
        "description": "A height block is around 60 pixels"
      }
    ],
    newInstance: function (settings, newInstanceCallback) {
      newInstanceCallback(new batteryWidget(settings));
    }
  });

}());