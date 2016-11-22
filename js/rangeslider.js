(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    }
    else if (typeof module === 'object' && module !== null && module.exports) {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        /* jshint ignore:start */
        window['rangeSlider'] = factory();
        /* jshint ignore:end */
    }
}(function () {
        'use strict';

        var EVENT_LISTENER_LIST = 'eventListenerList';
        var newLineAndTabRegexp = new RegExp('/[\\n\\t]/', 'g');
        var MAX_SET_BY_DEFAULT = 100;
        var HANDLE_RESIZE_DELAY = 300;
        var HANDLE_RESIZE_DEBOUNCE = 50;

        /**
         * Range feature detection
         * @return {Boolean}
         */
        function supportsRange() {
            var input = document.createElement('input');
            input.setAttribute('type', 'range');
            return input.type !== 'text';
        }

        var pluginName = 'rangeSlider',
            pluginIdentifier = 0,
            inputrange = supportsRange(),
            defaults = {
                polyfill: true,
                rangeClass: 'rangeSlider',
                disabledClass: 'rangeSlider--disabled',
                fillClass: 'rangeSlider__fill',
                bufferClass: 'rangeSlider__buffer',
                handleClass: 'rangeSlider__handle',
                startEvent: ['mousedown', 'touchstart', 'pointerdown'],
                moveEvent: ['mousemove', 'touchmove', 'pointermove'],
                endEvent: ['mouseup', 'touchend', 'pointerup'],
                min: null,
                max: null,
                step: null,
                value: null,
                buffer: null,
                stick: null,
                borderRadius: 10
            };

        /**
         * Delays a function for the given number of milliseconds, and then calls
         * it with the arguments supplied.
         *
         * @param  {Function} fn   [description]
         * @param  {Number}   wait [description]
         * @return {Function}
         */
        function delay(fn, wait) {
            var args = Array.prototype.slice.call(arguments, 2);
            return setTimeout(function () {
                return fn.apply(null, args);
            }, wait);
        }

        /**
         * Returns a debounced function that will make sure the given
         * function is not triggered too much.
         *
         * @param  {Function} fn Function to debounce.
         * @param  {Number}   debounceDuration OPTIONAL. The amount of time in milliseconds for which we will debounce the function. (defaults to 100ms)
         * @return {Function}
         */
        function debounce(fn, debounceDuration) {
            debounceDuration = debounceDuration || 100;
            return function () {
                if (!fn.debouncing) {
                    var args = Array.prototype.slice.apply(arguments);
                    fn.lastReturnVal = fn.apply(window, args);
                    fn.debouncing = true;
                }
                clearTimeout(fn.debounceTimeout);
                fn.debounceTimeout = setTimeout(function () {
                    fn.debouncing = false;
                }, debounceDuration);
                return fn.lastReturnVal;
            };
        }

        /**
         * Check if a `element` is visible in the DOM
         *
         * @param  {Element}  element
         * @return {Boolean}
         */
        function isHidden(element) {
            return !!(element.offsetWidth === 0 || element.offsetHeight === 0 || element.open === false);

        }

        /**
         * Get hidden parentNodes of an `element`
         *
         * @param  {Element} element
         * @return {[type]}
         */
        function getHiddenParentNodes(element) {
            var parents = [],
                node = element.parentNode;

            while (isHidden(node)) {
                parents.push(node);
                node = node.parentNode;
            }
            return parents;
        }

        /**
         * Returns dimensions for an element even if it is not visible in the DOM.
         *
         * @param  {Element} element
         * @param  {string}  key     (e.g. offsetWidth …)
         * @return {Number}
         */
        function getDimension(element, key) {
            var hiddenParentNodes = getHiddenParentNodes(element),
                hiddenParentNodesLength = hiddenParentNodes.length,
                displayProperty = [],
                dimension = element[key];

            // Used for native `<details>` elements
            function toggleOpenProperty(element) {
                if (typeof element.open !== 'undefined') {
                    element.open = (element.open) ? false : true;
                }
            }

            if (hiddenParentNodesLength) {
                for (var i = 0; i < hiddenParentNodesLength; i++) {
                    // Cache the display property to restore it later.
                    displayProperty[i] = hiddenParentNodes[i].style.display;

                    hiddenParentNodes[i].style.display = 'block';
                    hiddenParentNodes[i].style.height = '0';
                    hiddenParentNodes[i].style.overflow = 'hidden';
                    hiddenParentNodes[i].style.visibility = 'hidden';
                    toggleOpenProperty(hiddenParentNodes[i]);
                }

                dimension = element[key];

                for (var j = 0; j < hiddenParentNodesLength; j++) {
                    toggleOpenProperty(hiddenParentNodes[j]);
                    hiddenParentNodes[j].style.display = displayProperty[j];
                    hiddenParentNodes[j].style.height = '';
                    hiddenParentNodes[j].style.overflow = '';
                    hiddenParentNodes[j].style.visibility = '';
                }
            }
            return dimension;
        }

        function isString(obj) {
            return obj === '' + obj;
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        }

        function isNumberLike(obj) {
            return (obj !== null && obj !== undefined && (isString(obj) && isFinite(parseFloat(obj)) || (isFinite(obj))));
        }

        function getFirsNumberLike() {
            if (!arguments.length) {
                return null;
            }
            for (var i = 0, len = arguments.length; i < len; i++) {
                if (isNumberLike(arguments[i])) {
                    return arguments[i];
                }
            }
        }

        function isObject(obj) {
            return Object.prototype.toString.call(obj) === '[object Object]';
        }

        function simpleExtend(defaultOpt, options) {
            var opt = {}, key;
            for (key in defaultOpt) {
                opt[key] = defaultOpt[key];
            }
            for (key in options) {
                opt[key] = options[key];
            }

            return opt;
        }

        /**
         *
         * @param {HTMLElement} el
         * @param {Object} cssObj
         * @returns {*}
         */
        function setCss(el, cssObj) {
            for (var key in cssObj) {
                el.style[key] = cssObj[key];
            }
            return el.style;
        }

        /**
         *
         * @param {HTMLElement} elem
         * @param {string} className
         */
        function hasClass(elem, className) {
            return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
        }

        /**
         *
         * @param {HTMLElement} elem
         * @param {string} className
         */
        function addClass(elem, className) {
            if (!hasClass(elem, className)) {
                elem.className += ' ' + className;
            }
        }

        /**
         *
         * @param {HTMLElement} elem
         * @param {string} className
         */
        function removeClass(elem, className) {
            var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, ' ') + ' ';
            if (hasClass(elem, className)) {
                while (newClass.indexOf(' ' + className + ' ') >= 0) {
                    newClass = newClass.replace(' ' + className + ' ', ' ');
                }
                elem.className = newClass.replace(/^\s+|\s+$/g, '');
            }
        }


        /**
         *
         * @param {HTMLElement} el
         * @callback callback
         * @param {boolean} andForElement - apply callback for el
         * @returns {HTMLElement}
         */
        function forEachAncestors(el, callback, andForElement) {
            if (andForElement) {
                callback(el);
            }

            while (el.parentNode && !callback(el)) {
                el = el.parentNode;
            }

            return el;
        }

        /**
         *
         * @param {HTMLElement} el
         * @param {string} name event name
         * @param {Object} data
         */
        function triggerEvent(el, name, data) {
            if (!isString(name)) {
                throw new TypeError('event name must be String');
            }
            if (!(el instanceof HTMLElement)) {
                throw new TypeError('element must be HTMLElement');
            }
            name = name.trim();
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(name, false, false, data);
            el.dispatchEvent(event);
        }

        /**
         * @param {Object} referenceNode after this
         * @param {Object} newNode insert this
         */
        function insertAfter(referenceNode, newNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }

        /**
         * Add event listeners and push them to el[EVENT_LISTENER_LIST]
         * @param {HTMLElement} el DOM element
         * @param {Array} events
         * @callback listener
         */
        function addEventListeners(el, events, listener) {
            events.forEach(function (eventName) {
                if (!el[EVENT_LISTENER_LIST]) {
                    el[EVENT_LISTENER_LIST] = {};
                }
                if (!el[EVENT_LISTENER_LIST][eventName]) {
                    el[EVENT_LISTENER_LIST][eventName] = [];
                }

                el.addEventListener(
                    eventName,
                    listener,
                    false
                );
                if (el[EVENT_LISTENER_LIST][eventName].indexOf(listener) < 0) {
                    el[EVENT_LISTENER_LIST][eventName].push(listener);
                }
            });
        }

        /**
         * Remove event listeners and remove them from el[EVENT_LISTENER_LIST]
         * @param {HTMLElement} el DOM element
         * @param {Array} events
         * @callback listener
         */
        function removeEventListeners(el, events, listener) {
            events.forEach(function (eventName) {
                el.removeEventListener(
                    eventName,
                    listener,
                    false
                );

                var index;
                if (el[EVENT_LISTENER_LIST] && el[EVENT_LISTENER_LIST][eventName] &&
                    (index = el[EVENT_LISTENER_LIST][eventName].indexOf(listener)) > -1
                ) {
                    el[EVENT_LISTENER_LIST][eventName].splice(index, 1);
                }
            });
        }

        /**
         * Remove ALL event listeners which exists in el[EVENT_LISTENER_LIST]
         * @param {HTMLElement} el DOM element
         */
        function removeAllListenersFromEl(el) {
            if (!el[EVENT_LISTENER_LIST]) {
                return;
            }
            /* jshint ignore:start */
            var instance = this;

            /**
             *
             * @callback listener
             * @this {Object} event name
             */
            function rm(listener) {
                if (listener === instance._startEventListener) {
                    this.el.removeEventListener(this.eventName, listener, false);
                }
            }

            for (var eventName in el[EVENT_LISTENER_LIST]) {
                el[EVENT_LISTENER_LIST][eventName].forEach(rm, {eventName: eventName, el: el});
            }

            el[EVENT_LISTENER_LIST] = {};
            /* jshint ignore:end */
        }


        /**
         * Plugin
         * @param {HTMLElement} element
         * @param {this} options
         */
        function Plugin(element, options) {
            var minSetByDefault, maxSetByDefault, stepSetByDefault,
                stickAttribute,
                stickValues;
            this.element = element;
            this.options = simpleExtend(defaults, options);
            this.polyfill = this.options.polyfill;
            this.onInit = this.options.onInit;
            this.onSlide = this.options.onSlide;
            this.onSlideStart = this.options.onSlideStart;
            this.onSlideEnd = this.options.onSlideEnd;
            this.onSlideEventsCount = -1;
            this.isInteractsNow = false;
            this.needTriggerEvents = false;

            // Plugin should only be used as a polyfill
            if (!this.polyfill) {
                // Input range support?
                if (inputrange) {
                    return false;
                }
            }

            this.options.buffer = this.options.buffer || parseFloat(this.element.getAttribute('data-buffer'));

            this.identifier = 'js-' + pluginName + '-' + (pluginIdentifier++);
            this.min = getFirsNumberLike(this.options.min, parseFloat(this.element.getAttribute('min')), (minSetByDefault = 0));
            this.max = getFirsNumberLike(this.options.max, parseFloat(this.element.getAttribute('max')), (maxSetByDefault = MAX_SET_BY_DEFAULT));
            this.value = getFirsNumberLike(this.options.value, this.element.value,
                parseFloat(this.element.value || this.min + (this.max - this.min) / 2));
            this.step = getFirsNumberLike(this.options.step,
                parseFloat(this.element.getAttribute('step')) || (stepSetByDefault = 1));
            this.percent = null;
            if (isArray(this.options.stick) && this.options.stick.length >= 1) {
                this.stick = this.options.stick;
            } else if ((stickAttribute = this.element.getAttribute('stick'))) {
                stickValues = stickAttribute.split(' ');
                if (stickValues.length >= 1) {
                    this.stick = stickValues.map(parseFloat);
                }
            }
            if (this.stick && this.stick.length === 1) {
                this.stick.push(this.step * 1.5);
            }
            this._updatePercentFromValue();

            this.toFixed = this._toFixed(this.step);


            this.fill = document.createElement('div');
            this.fill.className = this.options.fillClass;

            this.handle = document.createElement('div');
            this.handle.className = this.options.handleClass;

            this.range = document.createElement('div');
            this.range.className = this.options.rangeClass;
            this.range.id = this.identifier;
            this.range.appendChild(this.handle);
            this.range.appendChild(this.fill);


            if (this.options.bufferClass) {
                this.buffer = document.createElement('div');
                this.buffer.className = this.options.bufferClass;
                this.range.appendChild(this.buffer);
            }

            if (isNumberLike(this.options.value)) {
                this._setValue(this.options.value, true);
                this.element.value = this.options.value;
            }

            if (isNumberLike(this.options.buffer)) {
                this.element.setAttribute('data-buffer', this.options.buffer);
            }

            if (isNumberLike(this.options.min) || minSetByDefault) {
                this.element.setAttribute('min', '' + this.min);
            }

            if (isNumberLike(this.options.max) || maxSetByDefault) {
                this.element.setAttribute('max', '' + this.max);
            }

            if (isNumberLike(this.options.step) || stepSetByDefault) {
                this.element.setAttribute('step', '' + this.step);
            }

            insertAfter(this.element, this.range);

            // visually hide the input
            setCss(this.element, {
                'position': 'absolute',
                'width': '1px',
                'height': '1px',
                'overflow': 'hidden',
                'opacity': '0'
            });

            // Store context
            this._handleDown = this._handleDown.bind(this);
            this._handleMove = this._handleMove.bind(this);
            this._handleEnd = this._handleEnd.bind(this);
            this._startEventListener = this._startEventListener.bind(this);
            this._changeEventListener = this._changeEventListener.bind(this);
            this._handleResize = this._handleResize.bind(this);

            this._init();

            //// Attach Events
            window.addEventListener('resize', this._handleResize, false);

            addEventListeners(document, this.options.startEvent, this._startEventListener);

            // Listen to programmatic value changes
            this.element.addEventListener('change', this._changeEventListener, false);
        }

        Plugin.prototype.constructor = Plugin;

        Plugin.prototype._toFixed = function (step) {
            return (step + '').replace('.', '').length - 1;
        };


        Plugin.prototype._init = function () {
            if (this.onInit && typeof this.onInit === 'function') {
                this.onInit();
            }
            this._update();
        };

        Plugin.prototype._updatePercentFromValue = function () {
            this.percent = (this.value - this.min) / (this.max - this.min);
        };

        /**
         * This method check if this.identifier exists in ev.target's ancestors
         * @param ev
         * @param data
         */
        Plugin.prototype._startEventListener = function (ev, data) {
            var _this = this;
            var el = ev.target;
            var isEventOnSlider = false;
            forEachAncestors(el, function (el) {
                return (isEventOnSlider = el.id === _this.identifier && !hasClass(el, _this.options.disabledClass));
            }, true);
            if (isEventOnSlider) {
                this._handleDown(ev, data);
            }
        };

        Plugin.prototype._changeEventListener = function (ev, data) {
            if (data && data.origin === this.identifier) {
                return;
            }

            var value = ev.target.value,
                pos = this._getPositionFromValue(value);
            this._setPosition(pos);
        };

        Plugin.prototype._update = function () {
            this.handleWidth = getDimension(this.handle, 'offsetWidth');
            this.rangeWidth = getDimension(this.range, 'offsetWidth');
            this.maxHandleX = this.rangeWidth - this.handleWidth;
            this.grabX = this.handleWidth / 2;
            this.position = this._getPositionFromValue(this.value);

            // Consider disabled state
            if (this.element.disabled) {
                addClass(this.range, this.options.disabledClass);
            } else {
                removeClass(this.range, this.options.disabledClass);
            }

            this._setPosition(this.position);
            if (this.options.bufferClass && this.options.buffer) {
                this._setBufferPosition(this.options.buffer);
            }
            this._updatePercentFromValue();
            triggerEvent(this.element, 'change', {origin: this.identifier});
        };


        Plugin.prototype._handleResize = function () {
            var _this = this;
            return debounce(function () {
                // Simulate resizeEnd event.
                delay(function () {
                    _this._update();
                }, HANDLE_RESIZE_DELAY);
            }, HANDLE_RESIZE_DEBOUNCE)();
        };

        Plugin.prototype._handleDown = function (e) {
            this.isInteractsNow = true;
            e.preventDefault();
            addEventListeners(document, this.options.moveEvent, this._handleMove);
            addEventListeners(document, this.options.endEvent, this._handleEnd);

            // If we click on the handle don't set the new position
            if ((' ' + e.target.className + ' ').replace(newLineAndTabRegexp, ' ').indexOf(this.options.handleClass) > -1) {
                return;
            }

            var posX = this._getRelativePosition(e),
                rangeX = this.range.getBoundingClientRect().left,
                handleX = this._getPositionFromNode(this.handle) - rangeX;

            this._setPosition(posX - this.grabX);

            if (posX >= handleX && posX < handleX + this.handleWidth) {
                this.grabX = posX - handleX;
            }
            this._updatePercentFromValue();
        };

        Plugin.prototype._handleMove = function (e) {
            this.isInteractsNow = true;
            e.preventDefault();
            var posX = this._getRelativePosition(e);
            this._setPosition(posX - this.grabX);
            //this.isInteractsNow = false;
        };

        Plugin.prototype._handleEnd = function (e) {
            e.preventDefault();
            removeEventListeners(document, this.options.moveEvent, this._handleMove);
            removeEventListeners(document, this.options.endEvent, this._handleEnd);

            // Ok we're done fire the change event
            triggerEvent(this.element, 'change', {origin: this.identifier});

            if (this.isInteractsNow || this.needTriggerEvents) {
                if (this.onSlideEnd && typeof this.onSlideEnd === 'function') {
                    this.onSlideEnd(this.value, this.percent, this.position);
                }
            }
            this.onSlideEventsCount = 0;
            this.isInteractsNow = false;
        };

        Plugin.prototype._cap = function (pos, min, max) {
            if (pos < min) {
                return min;
            }
            if (pos > max) {
                return max;
            }
            return pos;
        };
    
        Plugin.prototype.setHandleColor = function(color) {
            this.handle.style.background = color;
        }

        Plugin.prototype.setFillColor = function(color) {
            this.fill.style.background = color;
        }

       Plugin.prototype.setBackgroundColor = function(color) {
            this.range.style.background = color;
        }

        Plugin.prototype._setPosition = function (pos) {
            var value, left,
                stickTo, stickRadius,
                restFromValue;

            // Snapping steps
            value = this._getValueFromPosition(this._cap(pos, 0, this.maxHandleX));

            // Stick to stick[0] in radius stick[1]
            if (this.stick) {
                stickTo = this.stick[0];
                stickRadius = this.stick[1] || 0.1;
                restFromValue = value % stickTo;
                if (restFromValue < stickRadius) {
                    value = value - restFromValue;
                } else if (Math.abs(stickTo - restFromValue) < stickRadius) {
                    value = value - restFromValue + stickTo;
                }
            }
            left = this._getPositionFromValue(value);

            // Update ui
            this.fill.style.width = (left + this.grabX) + 'px';
            this.handle.style.left = left + 'px';
            this._setValue(value);

            // Update globals
            this.position = left;
            this.value = value;
            this._updatePercentFromValue();

            if (this.isInteractsNow || this.needTriggerEventss) {
                if (this.onSlideStart && typeof this.onSlideStart === 'function' && this.onSlideEventsCount === 0) {
                    this.onSlideStart(this.value, this.percent, this.position);
                }

                if (this.onSlide && typeof this.onSlide === 'function') {
                    this.onSlide(this.value, this.percent, this.position);
                }
            }

            this.onSlideEventsCount++;
        };

        Plugin.prototype._setBufferPosition = function (pos) {
            var isPercent = true,
                bufferWidth,
                paddingWidth,
                bufferWidthWithPadding;
            if (isFinite(pos)) {
                pos = parseFloat(pos);
            } else if (isString(pos)) {
                if (pos.indexOf('px') > 0) {
                    isPercent = false;
                }
                pos = parseFloat(pos);
            } else {
                console.warn('New position must be XXpx or XX%');
                return;
            }

            if (isNaN(pos)) {
                console.warn('New position is NaN');
                return;
            }
            if (!this.options.bufferClass) {
                console.warn('You disabled buffer, it\'s className is empty');
                return;
            }
            bufferWidth = isPercent ? pos : (pos / this.rangeWidth * 100);
            if (bufferWidth < 0) {
                bufferWidth = 0;
            }
            if (bufferWidth > 100) {
                bufferWidth = 100;
            }
            this.options.buffer = bufferWidth;

            paddingWidth = this.options.borderRadius / this.rangeWidth * 100;
            bufferWidthWithPadding = bufferWidth - paddingWidth;
            if (bufferWidthWithPadding < 0) {
                bufferWidthWithPadding = 0;
            }

            this.buffer.style.width = bufferWidthWithPadding + '%';
            this.buffer.style.left = paddingWidth * 0.5 + '%';
            this.element.setAttribute('data-buffer', bufferWidth);
        };

        // Returns element position relative to the parent
        Plugin.prototype._getPositionFromNode = function (node) {
            var i = 0;
            while (node !== null) {
                i += node.offsetLeft;
                node = node.offsetParent;
            }
            return i;
        };

        /**
         *
         * @param {(MouseEvent|TouchEvent)}e
         * @returns {number}
         */
        Plugin.prototype._getRelativePosition = function (e) {
            // Get the offset left relative to the viewport
            var rangeX = this.range.getBoundingClientRect().left,
                pageX = 0;

            if (typeof e.pageX !== 'undefined') {
                pageX = (e.touches && e.touches.length) ? e.touches[0].pageX : e.pageX;
            }
            else if (typeof e.originalEvent !== 'undefined') {
                if (typeof e.originalEvent.clientX !== 'undefined') {
                    pageX = e.originalEvent.clientX;
                }
                else if (e.originalEvent.touches && e.originalEvent.touches[0] && typeof e.originalEvent.touches[0].clientX !== 'undefined') {
                    pageX = e.originalEvent.touches[0].clientX;
                }
            }
            else if (e.touches && e.touches[0] && typeof e.touches[0].clientX !== 'undefined') {
                pageX = e.touches[0].clientX;
            }
            else if (e.currentPoint && typeof e.currentPoint.x !== 'undefined') {
                pageX = e.currentPoint.x;
            }

            return pageX - rangeX;
        };

        Plugin.prototype._getPositionFromValue = function (value) {
            var percentage, pos;
            percentage = (value - this.min) / (this.max - this.min);
            pos = percentage * this.maxHandleX;
            return pos;
        };

        Plugin.prototype._getValueFromPosition = function (pos) {
            var percentage, value;
            percentage = ((pos) / (this.maxHandleX || 1));
            value = this.step * Math.round(percentage * (this.max - this.min) / this.step) + this.min;
            return Number(Number(value).toFixed(this.toFixed));
        };

        Plugin.prototype._setValue = function (value, force) {
            if (value === this.value && !force) {
                return;
            }

            // Set the new value and fire the `input` event
            this.element.value = value;
            this.value = value;
            triggerEvent(this.element, 'input', {origin: this.identifier});
        };


        /**
         *
         * @param {Object} obj like {min : Number, max : Number, value : Number, step : Number, buffer : [String|Number]}
         * @param {Boolean} triggerEvents
         * @returns {Plugin}
         */
        Plugin.prototype.update = function (obj, triggerEvents) {
            if (triggerEvents) {
                this.needTriggerEvents = true;
            }
            if (isObject(obj)) {
                if (isNumberLike(obj.min)) {
                    this.element.setAttribute('min', '' + obj.min);
                    this.min = obj.min;
                }

                if (isNumberLike(obj.max)) {
                    this.element.setAttribute('max', '' + obj.max);
                    this.max = obj.max;
                }

                if (isNumberLike(obj.step)) {
                    this.element.setAttribute('step', '' + obj.step);
                    this.step = obj.step;
                    this.toFixed = this._toFixed(obj.step);
                }

                if (isNumberLike(obj.buffer)) {
                    this._setBufferPosition(obj.buffer);
                }

                if (isNumberLike(obj.value)) {
                    this._setValue(obj.value);
                }
            }
            this._update();
            this.onSlideEventsCount = 0;
            this.needTriggerEvents = false;
            return this;
        };

        Plugin.prototype.destroy = function () {
            removeAllListenersFromEl.call(this, document);
            window.removeEventListener('resize', this._handleResize, false);
            this.element.removeEventListener('change', this._changeEventListener, false);

            this.element.style.cssText = '';
            delete this.element[pluginName];

            // Remove the generated markup
            if (this.range) {
                this.range.parentNode.removeChild(this.range);
            }
        };

        // A really lightweight plugin wrapper around the constructor,
        // preventing against multiple instantiations

        Plugin.create = function (el, options) {
            function createInstance(el) {
                var data = el[pluginName];

                // Create a new instance.
                if (!data) {
                    data = new Plugin(el, options);
                    el[pluginName] = data;
                }
                return data;
            }

            if (el.length) {
                Array.prototype.slice.call(el).forEach(function (el) {
                    return createInstance(el);
                });
            } else {
                return createInstance(el);
            }
        };

        return Plugin;

    }
));
