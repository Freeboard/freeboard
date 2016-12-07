/**
 * JustGage - animated gauges using RaphaelJS
 * Check http://www.justgage.com for official releases
 * Licensed under MIT.
 * @author Bojan Djuricic (@Toorshia)
 **/

JustGage = function(config) {

  var obj = this;

  // Helps in case developer wants to debug it. unobtrusive
  if (config === null || config === undefined) {
    console.log('* justgage: Make sure to pass options to the constructor!');
    return false;
  }

  var node;

  if (config.id !== null && config.id !== undefined) {
    node = document.getElementById(config.id);
    if (!node) {
      console.log('* justgage: No element with id : %s found', config.id);
      return false;
    }
  } else if (config.parentNode !== null && config.parentNode !== undefined) {
    node = config.parentNode;
  } else {
    console.log('* justgage: Make sure to pass the existing element id or parentNode to the constructor.');
    return false;
  }

  var dataset = node.dataset ? node.dataset : {};

  // check for defaults
  var defaults = (config.defaults !== null && config.defaults !== undefined) ? config.defaults : false;
  if (defaults !== false) {
    config = extend({}, config, defaults);
    delete config.defaults;
  }

  // configurable parameters
  obj.config = {
    // id : string
    // this is container element id
    id: config.id,

    // value : float
    // value gauge is showing
    value: kvLookup('value', config, dataset, 0, 'float'),

    // defaults : bool
    // defaults parameter to use
    defaults: kvLookup('defaults', config, dataset, 0, false),

    // parentNode : node object
    // this is container element
    parentNode: kvLookup('parentNode', config, dataset, null),

    // width : int
    // gauge width
    width: kvLookup('width', config, dataset, null),

    // height : int
    // gauge height
    height: kvLookup('height', config, dataset, null),

    // title : string
    // gauge title
    title: kvLookup('title', config, dataset, ""),

    // titleFontColor : string
    // color of gauge title
    titleFontColor: kvLookup('titleFontColor', config, dataset, "#999999"),

    // titleFontFamily : string
    // color of gauge title
    titleFontFamily: kvLookup('titleFontFamily', config, dataset, "sans-serif"),

    // titlePosition : string
    // 'above' or 'below'
    titlePosition: kvLookup('titlePosition', config, dataset, "above"),

    // valueFontColor : string
    // color of label showing current value
    valueFontColor: kvLookup('valueFontColor', config, dataset, "#010101"),

    // valueFontFamily : string
    // color of label showing current value
    valueFontFamily: kvLookup('valueFontFamily', config, dataset, "Arial"),

    // symbol : string
    // special symbol to show next to value
    symbol: kvLookup('symbol', config, dataset, ''),

    // min : float
    // min value
    min: kvLookup('min', config, dataset, 0, 'float'),

    // max : float
    // max value
    max: kvLookup('max', config, dataset, 100, 'float'),

    // reverse : bool
    // reverse min and max
    reverse: kvLookup('reverse', config, dataset, false),

    // humanFriendlyDecimal : int
    // number of decimal places for our human friendly number to contain
    humanFriendlyDecimal: kvLookup('humanFriendlyDecimal', config, dataset, 0),


    // textRenderer: func
    // function applied before rendering text
    textRenderer: kvLookup('textRenderer', config, dataset, null),

    // gaugeWidthScale : float
    // width of the gauge element
    gaugeWidthScale: kvLookup('gaugeWidthScale', config, dataset, 1.0),

    // gaugeColor : string
    // background color of gauge element
    gaugeColor: kvLookup('gaugeColor', config, dataset, "#edebeb"),

    // label : string
    // text to show below value
    label: kvLookup('label', config, dataset, ''),

    // labelFontColor : string
    // color of label showing label under value
    labelFontColor: kvLookup('labelFontColor', config, dataset, "#b3b3b3"),

    // shadowOpacity : int
    // 0 ~ 1
    shadowOpacity: kvLookup('shadowOpacity', config, dataset, 0.2),

    // shadowSize: int
    // inner shadow size
    shadowSize: kvLookup('shadowSize', config, dataset, 5),

    // shadowVerticalOffset : int
    // how much shadow is offset from top
    shadowVerticalOffset: kvLookup('shadowVerticalOffset', config, dataset, 3),

    // levelColors : string[]
    // colors of indicator, from lower to upper, in RGB format
    levelColors: kvLookup('levelColors', config, dataset, ["#a9d70b", "#f9c802", "#ff0000"], 'array', ','),

    // startAnimationTime : int
    // length of initial animation
    startAnimationTime: kvLookup('startAnimationTime', config, dataset, 700),

    // startAnimationType : string
    // type of initial animation (linear, >, <,  <>, bounce)
    startAnimationType: kvLookup('startAnimationType', config, dataset, '>'),

    // refreshAnimationTime : int
    // length of refresh animation
    refreshAnimationTime: kvLookup('refreshAnimationTime', config, dataset, 700),

    // refreshAnimationType : string
    // type of refresh animation (linear, >, <,  <>, bounce)
    refreshAnimationType: kvLookup('refreshAnimationType', config, dataset, '>'),

    // donutStartAngle : int
    // angle to start from when in donut mode
    donutStartAngle: kvLookup('donutStartAngle', config, dataset, 90),

    // valueMinFontSize : int
    // absolute minimum font size for the value
    valueMinFontSize: kvLookup('valueMinFontSize', config, dataset, 16),

    // titleMinFontSize
    // absolute minimum font size for the title
    titleMinFontSize: kvLookup('titleMinFontSize', config, dataset, 10),

    // labelMinFontSize
    // absolute minimum font size for the label
    labelMinFontSize: kvLookup('labelMinFontSize', config, dataset, 10),

    // minLabelMinFontSize
    // absolute minimum font size for the minimum label
    minLabelMinFontSize: kvLookup('minLabelMinFontSize', config, dataset, 10),

    // maxLabelMinFontSize
    // absolute minimum font size for the maximum label
    maxLabelMinFontSize: kvLookup('maxLabelMinFontSize', config, dataset, 10),

    // hideValue : bool
    // hide value text
    hideValue: kvLookup('hideValue', config, dataset, false),

    // hideMinMax : bool
    // hide min and max values
    hideMinMax: kvLookup('hideMinMax', config, dataset, false),

    // hideInnerShadow : bool
    // hide inner shadow
    hideInnerShadow: kvLookup('hideInnerShadow', config, dataset, false),

    // humanFriendly : bool
    // convert large numbers for min, max, value to human friendly (e.g. 1234567 -> 1.23M)
    humanFriendly: kvLookup('humanFriendly', config, dataset, false),

    // noGradient : bool
    // whether to use gradual color change for value, or sector-based
    noGradient: kvLookup('noGradient', config, dataset, false),

    // donut : bool
    // show full donut gauge
    donut: kvLookup('donut', config, dataset, false),

    // relativeGaugeSize : bool
    // whether gauge size should follow changes in container element size
    relativeGaugeSize: kvLookup('relativeGaugeSize', config, dataset, false),

    // counter : bool
    // animate level number change
    counter: kvLookup('counter', config, dataset, false),

    // decimals : int
    // number of digits after floating point
    decimals: kvLookup('decimals', config, dataset, 0),

    // customSectors : [] of objects
    // number of digits after floating point
    customSectors: kvLookup('customSectors', config, dataset, []),

    // formatNumber: boolean
    // formats numbers with commas where appropriate
    formatNumber: kvLookup('formatNumber', config, dataset, false),

    // pointer : bool
    // show value pointer
    pointer: kvLookup('pointer', config, dataset, false),

    // pointerOptions : object
    // define pointer look
    pointerOptions: kvLookup('pointerOptions', config, dataset, [])
  };

  // variables
  var
    canvasW,
    canvasH,
    widgetW,
    widgetH,
    aspect,
    dx,
    dy,
    titleFontSize,
    titleX,
    titleY,
    valueFontSize,
    valueX,
    valueY,
    labelFontSize,
    labelX,
    labelY,
    minFontSize,
    minX,
    minY,
    maxFontSize,
    maxX,
    maxY;

  // overflow values
  if (obj.config.value > obj.config.max) obj.config.value = obj.config.max;
  if (obj.config.value < obj.config.min) obj.config.value = obj.config.min;
  obj.originalValue = kvLookup('value', config, dataset, -1, 'float');

  // create canvas
  if (obj.config.id !== null && (document.getElementById(obj.config.id)) !== null) {
    obj.canvas = Raphael(obj.config.id, "100%", "100%");
  } else if (obj.config.parentNode !== null) {
    obj.canvas = Raphael(obj.config.parentNode, "100%", "100%");
  }

  if (obj.config.relativeGaugeSize === true) {
    obj.canvas.setViewBox(0, 0, 200, 150, true);
  }

  // canvas dimensions
  if (obj.config.relativeGaugeSize === true) {
    canvasW = 200;
    canvasH = 150;
  } else if (obj.config.width !== null && obj.config.height !== null) {
    canvasW = obj.config.width;
    canvasH = obj.config.height;
  } else if (obj.config.parentNode !== null) {
    obj.canvas.setViewBox(0, 0, 200, 150, true);
    canvasW = 200;
    canvasH = 150;
  } else {
    canvasW = getStyle(document.getElementById(obj.config.id), "width").slice(0, -2) * 1;
    canvasH = getStyle(document.getElementById(obj.config.id), "height").slice(0, -2) * 1;
  }

  // widget dimensions
  if (obj.config.donut === true) {

    // DONUT *******************************

    // width more than height
    if (canvasW > canvasH) {
      widgetH = canvasH;
      widgetW = widgetH;
      // width less than height
    } else if (canvasW < canvasH) {
      widgetW = canvasW;
      widgetH = widgetW;
      // if height don't fit, rescale both
      if (widgetH > canvasH) {
        aspect = widgetH / canvasH;
        widgetH = widgetH / aspect;
        widgetW = widgetH / aspect;
      }
      // equal
    } else {
      widgetW = canvasW;
      widgetH = widgetW;
    }

    // delta
    dx = (canvasW - widgetW) / 2;
    dy = (canvasH - widgetH) / 2;

    // title
    titleFontSize = ((widgetH / 8) > 10) ? (widgetH / 10) : 10;
    titleX = dx + widgetW / 2;
    titleY = dy + widgetH / 11;

    // value
    valueFontSize = ((widgetH / 6.4) > 16) ? (widgetH / 5.4) : 18;
    valueX = dx + widgetW / 2;
    if (obj.config.label !== '') {
      valueY = dy + widgetH / 1.85;
    } else {
      valueY = dy + widgetH / 1.7;
    }

    // label
    labelFontSize = ((widgetH / 16) > 10) ? (widgetH / 16) : 10;
    labelX = dx + widgetW / 2;
    labelY = valueY + labelFontSize;

    // min
    minFontSize = ((widgetH / 16) > 10) ? (widgetH / 16) : 10;
    minX = dx + (widgetW / 10) + (widgetW / 6.666666666666667 * obj.config.gaugeWidthScale) / 2;
    minY = labelY;

    // max
    maxFontSize = ((widgetH / 16) > 10) ? (widgetH / 16) : 10;
    maxX = dx + widgetW - (widgetW / 10) - (widgetW / 6.666666666666667 * obj.config.gaugeWidthScale) / 2;
    maxY = labelY;

  } else {
    // HALF *******************************

    // width more than height
    if (canvasW > canvasH) {
      widgetH = canvasH;
      widgetW = widgetH * 1.25;
      //if width doesn't fit, rescale both
      if (widgetW > canvasW) {
        aspect = widgetW / canvasW;
        widgetW = widgetW / aspect;
        widgetH = widgetH / aspect;
      }
      // width less than height
    } else if (canvasW < canvasH) {
      widgetW = canvasW;
      widgetH = widgetW / 1.25;
      // if height don't fit, rescale both
      if (widgetH > canvasH) {
        aspect = widgetH / canvasH;
        widgetH = widgetH / aspect;
        widgetW = widgetH / aspect;
      }
      // equal
    } else {
      widgetW = canvasW;
      widgetH = widgetW * 0.75;
    }

    // delta
    dx = (canvasW - widgetW) / 2;
    dy = (canvasH - widgetH) / 2;
    if (obj.config.titlePosition === 'below') {
      // shift whole thing down
      dy -= (widgetH / 6.4);
    }

    // title
    titleFontSize = ((widgetH / 8) > obj.config.titleMinFontSize) ? (widgetH / 10) : obj.config.titleMinFontSize;
    titleX = dx + widgetW / 2;
    titleY = dy + (obj.config.titlePosition === 'below' ? (widgetH * 1.07) : (widgetH / 6.4));

    // value
    valueFontSize = ((widgetH / 6.5) > obj.config.valueMinFontSize) ? (widgetH / 6.5) : obj.config.valueMinFontSize;
    valueX = dx + widgetW / 2;
    valueY = dy + widgetH / 1.275;

    // label
    labelFontSize = ((widgetH / 16) > obj.config.labelMinFontSize) ? (widgetH / 16) : obj.config.labelMinFontSize;
    labelX = dx + widgetW / 2;
    labelY = valueY + valueFontSize / 2 + 5;

    // min
    minFontSize = ((widgetH / 16) > obj.config.minLabelMinFontSize) ? (widgetH / 16) : obj.config.minLabelMinFontSize;
    minX = dx + (widgetW / 10) + (widgetW / 6.666666666666667 * obj.config.gaugeWidthScale) / 2;
    minY = labelY;

    // max
    maxFontSize = ((widgetH / 16) > obj.config.maxLabelMinFontSize) ? (widgetH / 16) : obj.config.maxLabelMinFontSize;
    maxX = dx + widgetW - (widgetW / 10) - (widgetW / 6.666666666666667 * obj.config.gaugeWidthScale) / 2;
    maxY = labelY;
  }

  // parameters
  obj.params = {
    canvasW: canvasW,
    canvasH: canvasH,
    widgetW: widgetW,
    widgetH: widgetH,
    dx: dx,
    dy: dy,
    titleFontSize: titleFontSize,
    titleX: titleX,
    titleY: titleY,
    valueFontSize: valueFontSize,
    valueX: valueX,
    valueY: valueY,
    labelFontSize: labelFontSize,
    labelX: labelX,
    labelY: labelY,
    minFontSize: minFontSize,
    minX: minX,
    minY: minY,
    maxFontSize: maxFontSize,
    maxX: maxX,
    maxY: maxY
  };

  // var clear
  canvasW, canvasH, widgetW, widgetH, aspect, dx, dy, titleFontSize, titleX, titleY, valueFontSize, valueX, valueY, labelFontSize, labelX, labelY, minFontSize, minX, minY, maxFontSize, maxX, maxY = null;

  // pki - custom attribute for generating gauge paths
  obj.canvas.customAttributes.pki = function(value, min, max, w, h, dx, dy, gws, donut, reverse) {

    var alpha, Ro, Ri, Cx, Cy, Xo, Yo, Xi, Yi, path;

    if (donut) {
      alpha = (1 - 2 * (value - min) / (max - min)) * Math.PI;
      Ro = w / 2 - w / 7;
      Ri = Ro - w / 6.666666666666667 * gws;

      Cx = w / 2 + dx;
      Cy = h / 1.95 + dy;

      Xo = w / 2 + dx + Ro * Math.cos(alpha);
      Yo = h - (h - Cy) - Ro * Math.sin(alpha);
      Xi = w / 2 + dx + Ri * Math.cos(alpha);
      Yi = h - (h - Cy) - Ri * Math.sin(alpha);

      path = "M" + (Cx - Ri) + "," + Cy + " ";
      path += "L" + (Cx - Ro) + "," + Cy + " ";
      if (value > ((max - min) / 2)) {
        path += "A" + Ro + "," + Ro + " 0 0 1 " + (Cx + Ro) + "," + Cy + " ";
      }
      path += "A" + Ro + "," + Ro + " 0 0 1 " + Xo + "," + Yo + " ";
      path += "L" + Xi + "," + Yi + " ";
      if (value > ((max - min) / 2)) {
        path += "A" + Ri + "," + Ri + " 0 0 0 " + (Cx + Ri) + "," + Cy + " ";
      }
      path += "A" + Ri + "," + Ri + " 0 0 0 " + (Cx - Ri) + "," + Cy + " ";
      path += "Z ";

      return {
        path: path
      };

    } else {
      alpha = (1 - (value - min) / (max - min)) * Math.PI;
      Ro = w / 2 - w / 10;
      Ri = Ro - w / 6.666666666666667 * gws;

      Cx = w / 2 + dx;
      Cy = h / 1.25 + dy;

      Xo = w / 2 + dx + Ro * Math.cos(alpha);
      Yo = h - (h - Cy) - Ro * Math.sin(alpha);
      Xi = w / 2 + dx + Ri * Math.cos(alpha);
      Yi = h - (h - Cy) - Ri * Math.sin(alpha);

      path = "M" + (Cx - Ri) + "," + Cy + " ";
      path += "L" + (Cx - Ro) + "," + Cy + " ";
      path += "A" + Ro + "," + Ro + " 0 0 1 " + Xo + "," + Yo + " ";
      path += "L" + Xi + "," + Yi + " ";
      path += "A" + Ri + "," + Ri + " 0 0 0 " + (Cx - Ri) + "," + Cy + " ";
      path += "Z ";

      return {
        path: path
      };
    }

    // var clear
    alpha, Ro, Ri, Cx, Cy, Xo, Yo, Xi, Yi, path = null;
  };

  // ndl - custom attribute for generating needle path
  obj.canvas.customAttributes.ndl = function(value, min, max, w, h, dx, dy, gws, donut) {

    var dlt = w * 3.5 / 100;
    var dlb = w / 15;
    var dw = w / 100;

    if (obj.config.pointerOptions.toplength != null && obj.config.pointerOptions.toplength != undefined) dlt = obj.config.pointerOptions.toplength;
    if (obj.config.pointerOptions.bottomlength != null && obj.config.pointerOptions.bottomlength != undefined) dlb = obj.config.pointerOptions.bottomlength;
    if (obj.config.pointerOptions.bottomwidth != null && obj.config.pointerOptions.bottomwidth != undefined) dw = obj.config.pointerOptions.bottomwidth;

    var alpha, Ro, Ri, Cx, Cy, Xo, Yo, Xi, Yi, Xc, Yc, Xz, Yz, Xa, Ya, Xb, Yb, path;

    if (donut) {

      alpha = (1 - 2 * (value - min) / (max - min)) * Math.PI;
      Ro = w / 2 - w / 7;
      Ri = Ro - w / 6.666666666666667 * gws;

      Cx = w / 2 + dx;
      Cy = h / 1.95 + dy;

      Xo = w / 2 + dx + Ro * Math.cos(alpha);
      Yo = h - (h - Cy) - Ro * Math.sin(alpha);
      Xi = w / 2 + dx + Ri * Math.cos(alpha);
      Yi = h - (h - Cy) - Ri * Math.sin(alpha);

      Xc = Xo + dlt * Math.cos(alpha);
      Yc = Yo - dlt * Math.sin(alpha);
      Xz = Xi - dlb * Math.cos(alpha);
      Yz = Yi + dlb * Math.sin(alpha);

      Xa = Xz + dw * Math.sin(alpha);
      Ya = Yz + dw * Math.cos(alpha);
      Xb = Xz - dw * Math.sin(alpha);
      Yb = Yz - dw * Math.cos(alpha);

      path = 'M' + Xa + ',' + Ya + ' ';
      path += 'L' + Xb + ',' + Yb + ' ';
      path += 'L' + Xc + ',' + Yc + ' ';
      path += 'Z ';

      return {
        path: path
      };

    } else {
      alpha = (1 - (value - min) / (max - min)) * Math.PI;
      Ro = w / 2 - w / 10;
      Ri = Ro - w / 6.666666666666667 * gws;

      Cx = w / 2 + dx;
      Cy = h / 1.25 + dy;

      Xo = w / 2 + dx + Ro * Math.cos(alpha);
      Yo = h - (h - Cy) - Ro * Math.sin(alpha);
      Xi = w / 2 + dx + Ri * Math.cos(alpha);
      Yi = h - (h - Cy) - Ri * Math.sin(alpha);

      Xc = Xo + dlt * Math.cos(alpha);
      Yc = Yo - dlt * Math.sin(alpha);
      Xz = Xi - dlb * Math.cos(alpha);
      Yz = Yi + dlb * Math.sin(alpha);

      Xa = Xz + dw * Math.sin(alpha);
      Ya = Yz + dw * Math.cos(alpha);
      Xb = Xz - dw * Math.sin(alpha);
      Yb = Yz - dw * Math.cos(alpha);

      path = 'M' + Xa + ',' + Ya + ' ';
      path += 'L' + Xb + ',' + Yb + ' ';
      path += 'L' + Xc + ',' + Yc + ' ';
      path += 'Z ';

      return {
        path: path
      };
    }

    // var clear
    alpha, Ro, Ri, Cx, Cy, Xo, Yo, Xi, Yi, Xc, Yc, Xz, Yz, Xa, Ya, Xb, Yb, path = null;
  };

  // gauge
  obj.gauge = obj.canvas.path().attr({
    "stroke": "none",
    "fill": obj.config.gaugeColor,
    pki: [
      obj.config.max,
      obj.config.min,
      obj.config.max,
      obj.params.widgetW,
      obj.params.widgetH,
      obj.params.dx,
      obj.params.dy,
      obj.config.gaugeWidthScale,
      obj.config.donut,
      obj.config.reverse
    ]
  });

  // level
  obj.level = obj.canvas.path().attr({
    "stroke": "none",
    "fill": getColor(obj.config.value, (obj.config.value - obj.config.min) / (obj.config.max - obj.config.min), obj.config.levelColors, obj.config.noGradient, obj.config.customSectors),
    pki: [
      obj.config.min,
      obj.config.min,
      obj.config.max,
      obj.params.widgetW,
      obj.params.widgetH,
      obj.params.dx,
      obj.params.dy,
      obj.config.gaugeWidthScale,
      obj.config.donut,
      obj.config.reverse
    ]
  });
  if (obj.config.donut) {
    obj.level.transform("r" + obj.config.donutStartAngle + ", " + (obj.params.widgetW / 2 + obj.params.dx) + ", " + (obj.params.widgetH / 1.95 + obj.params.dy));
  }

  if (obj.config.pointer) {
    // needle
    obj.needle = obj.canvas.path().attr({
      "stroke": (obj.config.pointerOptions.stroke !== null && obj.config.pointerOptions.stroke !== undefined) ? obj.config.pointerOptions.stroke : "none",
      "stroke-width": (obj.config.pointerOptions.stroke_width !== null && obj.config.pointerOptions.stroke_width !== undefined) ? obj.config.pointerOptions.stroke_width : 0,
      "stroke-linecap": (obj.config.pointerOptions.stroke_linecap !== null && obj.config.pointerOptions.stroke_linecap !== undefined) ? obj.config.pointerOptions.stroke_linecap : "square",
      "fill": (obj.config.pointerOptions.color !== null && obj.config.pointerOptions.color !== undefined) ? obj.config.pointerOptions.color : "#000000",
      ndl: [
        obj.config.min,
        obj.config.min,
        obj.config.max,
        obj.params.widgetW,
        obj.params.widgetH,
        obj.params.dx,
        obj.params.dy,
        obj.config.gaugeWidthScale,
        obj.config.donut
      ]
    });

    if (obj.config.donut) {
      obj.needle.transform("r" + obj.config.donutStartAngle + ", " + (obj.params.widgetW / 2 + obj.params.dx) + ", " + (obj.params.widgetH / 1.95 + obj.params.dy));
    }

  }

  // title
  obj.txtTitle = obj.canvas.text(obj.params.titleX, obj.params.titleY, obj.config.title);
  obj.txtTitle.attr({
    "font-size": obj.params.titleFontSize,
    "font-weight": "bold",
    "font-family": obj.config.titleFontFamily,
    "fill": obj.config.titleFontColor,
    "fill-opacity": "1"
  });
  setDy(obj.txtTitle, obj.params.titleFontSize, obj.params.titleY);

  // value
  obj.txtValue = obj.canvas.text(obj.params.valueX, obj.params.valueY, 0);
  obj.txtValue.attr({
    "font-size": obj.params.valueFontSize,
    "font-weight": "bold",
    "font-family": obj.config.valueFontFamily,
    "fill": obj.config.valueFontColor,
    "fill-opacity": "0"
  });
  setDy(obj.txtValue, obj.params.valueFontSize, obj.params.valueY);

  // label
  obj.txtLabel = obj.canvas.text(obj.params.labelX, obj.params.labelY, obj.config.label);
  obj.txtLabel.attr({
    "font-size": obj.params.labelFontSize,
    "font-weight": "normal",
    "font-family": "Arial",
    "fill": obj.config.labelFontColor,
    "fill-opacity": "0"
  });
  setDy(obj.txtLabel, obj.params.labelFontSize, obj.params.labelY);

  // min
  var min = obj.config.min;
  if (obj.config.reverse) {
    min = obj.config.max;
  }

  obj.txtMinimum = min;
  if (obj.config.humanFriendly) {
    obj.txtMinimum = humanFriendlyNumber(min, obj.config.humanFriendlyDecimal);
  } else if (obj.config.formatNumber) {
    obj.txtMinimum = formatNumber(min);
  }
  obj.txtMin = obj.canvas.text(obj.params.minX, obj.params.minY, obj.txtMinimum);
  obj.txtMin.attr({
    "font-size": obj.params.minFontSize,
    "font-weight": "normal",
    "font-family": "Arial",
    "fill": obj.config.labelFontColor,
    "fill-opacity": (obj.config.hideMinMax || obj.config.donut) ? "0" : "1"
  });
  setDy(obj.txtMin, obj.params.minFontSize, obj.params.minY);

  // max
  var max = obj.config.max;
  if (obj.config.reverse) {
    max = obj.config.min;
  }
  obj.txtMaximum = max;
  if (obj.config.humanFriendly) {
    obj.txtMaximum = humanFriendlyNumber(max, obj.config.humanFriendlyDecimal);
  } else if (obj.config.formatNumber) {
    obj.txtMaximum = formatNumber(max);
  }
  obj.txtMax = obj.canvas.text(obj.params.maxX, obj.params.maxY, obj.txtMaximum);
  obj.txtMax.attr({
    "font-size": obj.params.maxFontSize,
    "font-weight": "normal",
    "font-family": "Arial",
    "fill": obj.config.labelFontColor,
    "fill-opacity": (obj.config.hideMinMax || obj.config.donut) ? "0" : "1"
  });
  setDy(obj.txtMax, obj.params.maxFontSize, obj.params.maxY);

  var defs = obj.canvas.canvas.childNodes[1];
  var svg = "http://www.w3.org/2000/svg";

  if (ie !== 'undefined' && ie < 9) {
    // VML mode - no SVG & SVG filter support
  } else if (ie !== 'undefined') {
    onCreateElementNsReady(function() {
      obj.generateShadow(svg, defs);
    });
  } else {
    obj.generateShadow(svg, defs);
  }

  // var clear
  defs, svg = null;

  // set value to display
  if (obj.config.textRenderer) {
    obj.originalValue = obj.config.textRenderer(obj.originalValue);
  } else if (obj.config.humanFriendly) {
    obj.originalValue = humanFriendlyNumber(obj.originalValue, obj.config.humanFriendlyDecimal) + obj.config.symbol;
  } else if (obj.config.formatNumber) {
    obj.originalValue = formatNumber(obj.originalValue) + obj.config.symbol;
  } else {
    obj.originalValue = (obj.originalValue * 1).toFixed(obj.config.decimals) + obj.config.symbol;
  }

  if (obj.config.counter === true) {
    //on each animation frame
    eve.on("raphael.anim.frame." + (obj.level.id), function() {
      var currentValue = obj.level.attr("pki")[0];
      if (obj.config.reverse) {
        currentValue = (obj.config.max * 1) + (obj.config.min * 1) - (obj.level.attr("pki")[0] * 1);
      }
      if (obj.config.textRenderer) {
        obj.txtValue.attr("text", obj.config.textRenderer(Math.floor(currentValue)));
      } else if (obj.config.humanFriendly) {
        obj.txtValue.attr("text", humanFriendlyNumber(Math.floor(currentValue), obj.config.humanFriendlyDecimal) + obj.config.symbol);
      } else if (obj.config.formatNumber) {
        obj.txtValue.attr("text", formatNumber(Math.floor(currentValue)) + obj.config.symbol);
      } else {
        obj.txtValue.attr("text", (currentValue * 1).toFixed(obj.config.decimals) + obj.config.symbol);
      }
      setDy(obj.txtValue, obj.params.valueFontSize, obj.params.valueY);
      currentValue = null;
    });
    //on animation end
    eve.on("raphael.anim.finish." + (obj.level.id), function() {
      obj.txtValue.attr({
        "text": obj.originalValue
      });
      setDy(obj.txtValue, obj.params.valueFontSize, obj.params.valueY);
    });
  } else {
    //on animation start
    eve.on("raphael.anim.start." + (obj.level.id), function() {
      obj.txtValue.attr({
        "text": obj.originalValue
      });
      setDy(obj.txtValue, obj.params.valueFontSize, obj.params.valueY);
    });
  }

  // animate gauge level, value & label
  var rvl = obj.config.value;
  if (obj.config.reverse) {
    rvl = (obj.config.max * 1) + (obj.config.min * 1) - (obj.config.value * 1);
  }
  obj.level.animate({
    pki: [
      rvl,
      obj.config.min,
      obj.config.max,
      obj.params.widgetW,
      obj.params.widgetH,
      obj.params.dx,
      obj.params.dy,
      obj.config.gaugeWidthScale,
      obj.config.donut,
      obj.config.reverse
    ]
  }, obj.config.startAnimationTime, obj.config.startAnimationType);

  if (obj.config.pointer) {
    obj.needle.animate({
      ndl: [
        rvl,
        obj.config.min,
        obj.config.max,
        obj.params.widgetW,
        obj.params.widgetH,
        obj.params.dx,
        obj.params.dy,
        obj.config.gaugeWidthScale,
        obj.config.donut
      ]
    }, obj.config.startAnimationTime, obj.config.startAnimationType);
  }

  obj.txtValue.animate({
    "fill-opacity": (obj.config.hideValue) ? "0" : "1"
  }, obj.config.startAnimationTime, obj.config.startAnimationType);
  obj.txtLabel.animate({
    "fill-opacity": "1"
  }, obj.config.startAnimationTime, obj.config.startAnimationType);
};

/** Refresh gauge level */
JustGage.prototype.refresh = function(val, max) {

  var obj = this;
  var displayVal, color, max = max || null;

  // set new max
  if (max !== null) {
    obj.config.max = max;
    // TODO: update customSectors

    obj.txtMaximum = obj.config.max;
    if (obj.config.humanFriendly) {
      obj.txtMaximum = humanFriendlyNumber(obj.config.max, obj.config.humanFriendlyDecimal);
    } else if (obj.config.formatNumber) {
      obj.txtMaximum = formatNumber(obj.config.max);
    }
    if (!obj.config.reverse) {
      obj.txtMax.attr({
        "text": obj.txtMaximum
      });
      setDy(obj.txtMax, obj.params.maxFontSize, obj.params.maxY);
    } else {
      obj.txtMin.attr({
        "text": obj.txtMaximum
      });
      setDy(obj.txtMin, obj.params.minFontSize, obj.params.minY);
    }
  }

  // overflow values
  displayVal = val;
  if ((val * 1) > (obj.config.max * 1)) {
    val = (obj.config.max * 1);
  }
  if ((val * 1) < (obj.config.min * 1)) {
    val = (obj.config.min * 1);
  }

  color = getColor(val, (val - obj.config.min) / (obj.config.max - obj.config.min), obj.config.levelColors, obj.config.noGradient, obj.config.customSectors);

  if (obj.config.textRenderer) {
    displayVal = obj.config.textRenderer(displayVal);
  } else if (obj.config.humanFriendly) {
    displayVal = humanFriendlyNumber(displayVal, obj.config.humanFriendlyDecimal) + obj.config.symbol;
  } else if (obj.config.formatNumber) {
    displayVal = formatNumber((displayVal * 1).toFixed(obj.config.decimals)) + obj.config.symbol;
  } else {
    displayVal = (displayVal * 1).toFixed(obj.config.decimals) + obj.config.symbol;
  }
  obj.originalValue = displayVal;
  obj.config.value = val * 1;

  if (!obj.config.counter) {
    obj.txtValue.attr({
      "text": displayVal
    });
    setDy(obj.txtValue, obj.params.valueFontSize, obj.params.valueY);
  }

  var rvl = obj.config.value;
  if (obj.config.reverse) {
    rvl = (obj.config.max * 1) + (obj.config.min * 1) - (obj.config.value * 1);
  }
  obj.level.animate({
    pki: [
      rvl,
      obj.config.min,
      obj.config.max,
      obj.params.widgetW,
      obj.params.widgetH,
      obj.params.dx,
      obj.params.dy,
      obj.config.gaugeWidthScale,
      obj.config.donut,
      obj.config.reverse
    ],
    "fill": color
  }, obj.config.refreshAnimationTime, obj.config.refreshAnimationType);

  if (obj.config.pointer) {
    obj.needle.animate({
      ndl: [
        rvl,
        obj.config.min,
        obj.config.max,
        obj.params.widgetW,
        obj.params.widgetH,
        obj.params.dx,
        obj.params.dy,
        obj.config.gaugeWidthScale,
        obj.config.donut
      ]
    }, obj.config.refreshAnimationTime, obj.config.refreshAnimationType);
  }

  // var clear
  obj, displayVal, color, max = null;
};

/** Generate shadow */
JustGage.prototype.generateShadow = function(svg, defs) {

  var obj = this;
  var sid = "inner-shadow-" + obj.config.id;
  var gaussFilter, feOffset, feGaussianBlur, feComposite1, feFlood, feComposite2, feComposite3;

  // FILTER
  gaussFilter = document.createElementNS(svg, "filter");
  gaussFilter.setAttribute("id", sid);
  defs.appendChild(gaussFilter);

  // offset
  feOffset = document.createElementNS(svg, "feOffset");
  feOffset.setAttribute("dx", 0);
  feOffset.setAttribute("dy", obj.config.shadowVerticalOffset);
  gaussFilter.appendChild(feOffset);

  // blur
  feGaussianBlur = document.createElementNS(svg, "feGaussianBlur");
  feGaussianBlur.setAttribute("result", "offset-blur");
  feGaussianBlur.setAttribute("stdDeviation", obj.config.shadowSize);
  gaussFilter.appendChild(feGaussianBlur);

  // composite 1
  feComposite1 = document.createElementNS(svg, "feComposite");
  feComposite1.setAttribute("operator", "out");
  feComposite1.setAttribute("in", "SourceGraphic");
  feComposite1.setAttribute("in2", "offset-blur");
  feComposite1.setAttribute("result", "inverse");
  gaussFilter.appendChild(feComposite1);

  // flood
  feFlood = document.createElementNS(svg, "feFlood");
  feFlood.setAttribute("flood-color", "black");
  feFlood.setAttribute("flood-opacity", obj.config.shadowOpacity);
  feFlood.setAttribute("result", "color");
  gaussFilter.appendChild(feFlood);

  // composite 2
  feComposite2 = document.createElementNS(svg, "feComposite");
  feComposite2.setAttribute("operator", "in");
  feComposite2.setAttribute("in", "color");
  feComposite2.setAttribute("in2", "inverse");
  feComposite2.setAttribute("result", "shadow");
  gaussFilter.appendChild(feComposite2);

  // composite 3
  feComposite3 = document.createElementNS(svg, "feComposite");
  feComposite3.setAttribute("operator", "over");
  feComposite3.setAttribute("in", "shadow");
  feComposite3.setAttribute("in2", "SourceGraphic");
  gaussFilter.appendChild(feComposite3);

  // set shadow
  if (!obj.config.hideInnerShadow) {
    obj.canvas.canvas.childNodes[2].setAttribute("filter", "url(#" + sid + ")");
    obj.canvas.canvas.childNodes[3].setAttribute("filter", "url(#" + sid + ")");
  }

  // var clear
  gaussFilter, feOffset, feGaussianBlur, feComposite1, feFlood, feComposite2, feComposite3 = null;
};

//
// tiny helper function to lookup value of a key from two hash tables
// if none found, return defaultvalue
//
// key: string
// tablea: object
// tableb: DOMStringMap|object
// defval: string|integer|float|null
// datatype: return datatype
// delimiter: delimiter to be used in conjunction with datatype formatting
//
function kvLookup(key, tablea, tableb, defval, datatype, delimiter) {
  var val = defval;
  var canConvert = false;
  if (!(key === null || key === undefined)) {
    if (tableb !== null && tableb !== undefined && typeof tableb === "object" && key in tableb) {
      val = tableb[key];
      canConvert = true;
    } else if (tablea !== null && tablea !== undefined && typeof tablea === "object" && key in tablea) {
      val = tablea[key];
      canConvert = true;
    } else {
      val = defval;
    }
    if (canConvert === true) {
      if (datatype !== null && datatype !== undefined) {
        switch (datatype) {
          case 'int':
            val = parseInt(val, 10);
            break;
          case 'float':
            val = parseFloat(val);
            break;
          default:
            break;
        }
      }
    }
  }
  return val;
};

/** Get color for value */
function getColor(val, pct, col, noGradient, custSec) {

  var no, inc, colors, percentage, rval, gval, bval, lower, upper, range, rangePct, pctLower, pctUpper, color;
  var noGradient = noGradient || custSec.length > 0;

  if (custSec.length > 0) {
    for (var i = 0; i < custSec.length; i++) {
      if (val > custSec[i].lo && val <= custSec[i].hi) {
        return custSec[i].color;
      }
    }
  }

  no = col.length;
  if (no === 1) return col[0];
  inc = (noGradient) ? (1 / no) : (1 / (no - 1));
  colors = [];
  for (i = 0; i < col.length; i++) {
    percentage = (noGradient) ? (inc * (i + 1)) : (inc * i);
    rval = parseInt((cutHex(col[i])).substring(0, 2), 16);
    gval = parseInt((cutHex(col[i])).substring(2, 4), 16);
    bval = parseInt((cutHex(col[i])).substring(4, 6), 16);
    colors[i] = {
      pct: percentage,
      color: {
        r: rval,
        g: gval,
        b: bval
      }
    };
  }

  if (pct === 0) {
    return 'rgb(' + [colors[0].color.r, colors[0].color.g, colors[0].color.b].join(',') + ')';
  }

  for (var j = 0; j < colors.length; j++) {
    if (pct <= colors[j].pct) {
      if (noGradient) {
        return 'rgb(' + [colors[j].color.r, colors[j].color.g, colors[j].color.b].join(',') + ')';
      } else {
        lower = colors[j - 1];
        upper = colors[j];
        range = upper.pct - lower.pct;
        rangePct = (pct - lower.pct) / range;
        pctLower = 1 - rangePct;
        pctUpper = rangePct;
        color = {
          r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
          g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
          b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
        };
        return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
      }
    }
  }

}

/** Fix Raphael display:none tspan dy attribute bug */
function setDy(elem, fontSize, txtYpos) {
  if ((!ie || ie > 9) && elem.node.firstChild.attributes.dy) {
    elem.node.firstChild.attributes.dy.value = 0;
  }
}

/** Random integer  */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**  Cut hex  */
function cutHex(str) {
  return (str.charAt(0) == "#") ? str.substring(1, 7) : str;
}

/**  Human friendly number suffix - From: http://stackoverflow.com/questions/2692323/code-golf-friendly-number-abbreviator */
function humanFriendlyNumber(n, d) {
  var p, d2, i, s;

  p = Math.pow;
  d2 = p(10, d);
  i = 7;
  while (i) {
    s = p(10, i-- * 3);
    if (s <= n) {
      n = Math.round(n * d2 / s) / d2 + "KMGTPE" [i];
    }
  }
  return n;
}

/** Format numbers with commas - From: http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript */
function formatNumber(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**  Get style  */
function getStyle(oElm, strCssRule) {
  var strValue = "";
  if (document.defaultView && document.defaultView.getComputedStyle) {
    strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
  } else if (oElm.currentStyle) {
    strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
      return p1.toUpperCase();
    });
    strValue = oElm.currentStyle[strCssRule];
  }
  return strValue;
}

/**  Create Element NS Ready  */
function onCreateElementNsReady(func) {
  if (document.createElementNS !== undefined) {
    func();
  } else {
    setTimeout(function() {
      onCreateElementNsReady(func);
    }, 100);
  }
}

/**  Get IE version  */
// ----------------------------------------------------------
// A short snippet for detecting versions of IE in JavaScript
// without resorting to user-agent sniffing
// ----------------------------------------------------------
// If you're not in IE (or IE version is less than 5) then:
// ie === undefined
// If you're in IE (>=5) then you can determine which version:
// ie === 7; // IE7
// Thus, to detect IE:
// if (ie) {}
// And to detect the version:
// ie === 6 // IE6
// ie > 7 // IE8, IE9 ...
// ie < 9 // Anything less than IE9
// ----------------------------------------------------------
// UPDATE: Now using Live NodeList idea from @jdalton
var ie = (function() {

  var undef,
    v = 3,
    div = document.createElement('div'),
    all = div.getElementsByTagName('i');

  while (
    div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
    all[0]
  );
  return v > 4 ? v : undef;
}());

// extend target object with second object
function extend(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i])
      continue;

    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key))
        out[key] = arguments[i][key];
    }
  }

  return out;
};
