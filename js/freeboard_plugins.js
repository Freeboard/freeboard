var allow = false;
var np;

function DialogBox(a, b, c, d, e) {
    function f() {
        g.fadeOut(200, function() {
            $(this).remove()
        })
    }
    var g = $('<div id="modal_overlay" style="display:none;"></div>'),
        h = $('<div class="modal"></div>');
    h.append('<header><h2 class="title">' + b + "</h2></header>"), $("<section></section>").appendTo(h).append(a);
    var i = $("<footer></footer>").appendTo(h);
    c && $('<span id="dialog-ok" class="text-button">' + c + "</span>").appendTo(i).click(function() {
        var a = !1;
        _.isFunction(e) && (a = e()), a || f()
    }), d && $('<span id="dialog-cancel" class="text-button">' + d + "</span>").appendTo(i).click(function() {
        f()
    }), g.append(h), $("body").append(g), g.fadeIn(200)
}

function FreeboardModel(a, b, c) {
    var d = this,
        e = 1;
    this.version = 0, this.isEditing = ko.observable(!1), this.allow_edit = ko.observable(!1), this.allow_edit.subscribe(function(a) {
        a ? $("#main-header").show() : $("#main-header").hide()
    }), this.header_image = ko.observable(), this.plugins = ko.observableArray(), this.datasources = ko.observableArray(), this.panes = ko.observableArray(), this.datasourceData = {}, this.processDatasourceUpdate = function(a, b) {
        var c = a.name();
        d.datasourceData[c] = b, _.each(d.panes(), function(a) {
            _.each(a.widgets(), function(a) {
                a.processDatasourceUpdate(c)
            })
        }), this.saveLocalstorage()
    }, this._datasourceTypes = ko.observable(), this.datasourceTypes = ko.computed({
        read: function() {
            d._datasourceTypes()
            var b = [];
            return _.each(a, function(a) {
                var c = a.type_name,
                    d = c;
                _.isUndefined(a.display_name) || (d = a.display_name), b.push({
                    name: c,
                    display_name: d
                })
            }), b
        }
    }), this._widgetTypes = ko.observable(), this.widgetTypes = ko.computed({
        read: function() {
            d._widgetTypes()
            var a = [];
            return _.each(b, function(b) {
                var c = b.type_name,
                    d = c;
                _.isUndefined(b.display_name) || (d = b.display_name), a.push({
                    name: c,
                    display_name: d
                })
            }), a
        }
    }), this.addPluginSource = function(a) {
        a && -1 == d.plugins.indexOf(a) && d.plugins.push(a)
    }, this.serialize = function() {
        var a = [];
        _.each(d.panes(), function(b) {
            a.push(b.serialize())
        });
        var b = [];
        var data = window.localStorage.getItem("netpie.freeboard.dashboard");
        var theme = "default"
        var datajson = JSON.parse(data);
        if(datajson!==null){
            if(datajson.theme!==undefined){
                theme = datajson.theme
            }
        }
        return _.each(d.datasources(), function(a) {
            b.push(a.serialize())
        }), {
            version: e,
            header_image: d.header_image(),
            allow_edit: d.allow_edit(),
            plugins: d.plugins(),
            panes: a,
            datasources: b,
            columns: c.getUserColumns(),
            theme:theme
        }
    }, this.deserialize = function(e, f) {
        function g() {
            c.setUserColumns(e.columns), _.isUndefined(e.allow_edit) ? d.allow_edit(!0) : d.allow_edit(e.allow_edit), d.version = e.version || 0, d.header_image(e.header_image), _.each(e.datasources, function(b) {
                var c = new DatasourceModel(d, a);
                c.deserialize(b), d.addDatasource(c)
            });
            var g = _.sortBy(e.panes, function(a) {
                return c.getPositionForScreenSize(a).row
            });
            _.each(g, function(a) {
                var c = new PaneModel(d, b);
                c.deserialize(a), d.panes.push(c)
            }), d.allow_edit() && 0 == d.panes().length && d.setEditing(!0), _.isFunction(f) && f(), c.processResize(!0)
        }
        d.clearDashboard(), _.each(e.plugins, function(a) {
            d.addPluginSource(a)
        }), _.isArray(e.plugins) && e.plugins.length > 0 ? head.js(e.plugins, function() {
            g()
        }) : g()
    }, this.clearFreeboard = function() {
        window.localStorage.removeItem("netpie.freeboard.dashboard");
        d.clearDashboard();
    }, this.clearDashboard = function() {
        c.removeAllPanes(), _.each(d.datasources(), function(a) {
            a.dispose()
        }), _.each(d.panes(), function(a) {
            a.dispose()
        }), d.plugins.removeAll(), d.datasources.removeAll(), d.panes.removeAll()
    }, this.loadDashboard = function(a, b) {
        c.showLoadingIndicator(!0), d.deserialize(a, function() {
            c.showLoadingIndicator(!1), _.isFunction(b) && b(), freeboard.emit("dashboard_loaded")
        })
    }, this.loadDashboardFromLocalFile = function() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var a = document.createElement("input");
            a.type = "file", $(a).on("change", function(a) {
                var b = a.target.files;
                if (b && b.length > 0) {
                    var c = b[0],
                        e = new FileReader;
                    e.addEventListener("load", function(a) {
                        var b = a.target,
                            c = JSON.parse(b.result);
                        window.localStorage.setItem("netpie.freeboard.dashboard", JSON.stringify(c));

                        d.loadDashboard(c), d.setEditing(!1)
                        freeboard.emit('load_theme');
                    }), e.readAsText(c)
                }
            }), $(a).trigger("click")
        } else
            alert("Unable to load a file in this browser.")
    }, this.saveDashboardClicked = function() {
        var a = $(event.currentTarget),
            b = a.data("siblings-shown") || !1;
        b ? $(event.currentTarget).siblings("label").fadeOut("slow") : $(event.currentTarget).siblings("label").fadeIn("slow"), a.data("siblings-shown", !b)
    }, this.saveDashboard = function(a, b) {
        var c = $(b.currentTarget).data("pretty"),
            e = "application/octet-stream",
            f = document.createElement("a");
        var g = new Blob([JSON.stringify(d.serialize())], {
            type: e
        });
        document.body.appendChild(f), f.href = window.URL.createObjectURL(g);
        $.get(f.href, function(data) {
            window.localStorage.setItem("netpie.freeboard.dashboard", data);
        });
        if (c) {
            var g = new Blob([JSON.stringify(d.serialize(), null, " ")], {
                type: e
            });
            f.href = window.URL.createObjectURL(g);
            f.download = "dashboard.json", f.target = "_self", f.click();
        }
    }, this.saveLocalstorage = function() {
        e = "application/octet-stream", f = document.createElement("a");
        var g = new Blob([JSON.stringify(d.serialize())], {
            type: e
        });
        document.body.appendChild(f), f.href = window.URL.createObjectURL(g);
        $.get(f.href, function(data) {
            window.localStorage.setItem("netpie.freeboard.dashboard", data);
        });
    }, this.addDatasource = function(a) {
        d.datasources.push(a)
    }, this.deleteDatasource = function(a) {
        delete d.datasourceData[a.name()], a.dispose(), d.datasources.remove(a), this.saveLocalstorage()
    }, this.createPane = function() {
        var a = new PaneModel(d, b);
        d.addPane(a)
    }, this.addGridColumnLeft = function() {
        c.addGridColumnLeft()
    }, this.addGridColumnRight = function() {
        c.addGridColumnRight()
    }, this.subGridColumnLeft = function() {
        c.subGridColumnLeft()
    }, this.subGridColumnRight = function() {
        c.subGridColumnRight()
    }, this.addPane = function(a) {
        d.panes.push(a)
    }, this.deletePane = function(a) {
        a.dispose(), d.panes.remove(a)
    }, this.deleteWidget = function(a) {
        ko.utils.arrayForEach(d.panes(), function(b) {
            b.widgets.remove(a)
        }), a.dispose()
    }, this.setEditing = function(a, b) {
        if (d.allow_edit() || !a) {
            d.isEditing(a), _.isUndefined(b) && (b = !0);
            var e = b ? 250 : 0,
                f = $("#admin-bar").outerHeight();
            a ? ($("#toggle-header-icon").addClass("icon-chevron-up").removeClass("icon-wrench"), $(".gridster .gs_w").css({
                cursor: "pointer"
            }), $("#main-header").animate({
                top: "0px"
            }, e), $("#board-content").animate({
                top: f + 20 + "px"
            }, e), $("#main-header").data().shown = !0, c.attachWidgetEditIcons($(".sub-section")), c.enableGrid()) : ($("#toggle-header-icon").addClass("icon-wrench").removeClass("icon-chevron-up"), $(".gridster .gs_w").css({
                cursor: "default"
            }), $("#main-header").animate({
                top: "-" + f + "px"
            }, e), $("#board-content").animate({
                top: "20"
            }, e), $("#main-header").data().shown = !1, $(".sub-section").unbind(), c.disableGrid()), c.showPaneEditIcons(a, b)
        }
    }, this.toggleEditing = function() {
        var a = !d.isEditing();
        d.setEditing(a);
    }
}

function FreeboardUI() {
    function a(a) {
        var b = e(),
            c = function() {};
        a && (c = function(a) {
            var c = this,
                d = ko.dataFor(c),
                e = q(d);
            $(c).attr("data-sizex", Math.min(d.col_width(), b, r.cols)).attr("data-row", e.row).attr("data-col", e.col), d.processSizeChange()
        }), f(Math.min(b, w)), g(c), d()
    }

    function b(a) {
        var b = r.cols + 1;
        f(b) && g(function() {
            var b, c = this,
                d = ko.dataFor(c),
                e = r.cols > 1 ? r.cols - 1 : 1,
                f = d.col[e],
                g = d.row[e];
            if (a) {
                leftPreviewCol = !0;
                var h = f < r.cols ? f + 1 : r.cols;
                b = {
                    row: g,
                    col: h
                }
            } else
                rightPreviewCol = !0, b = {
                    row: g,
                    col: f
                };
            $(c).attr("data-sizex", Math.min(d.col_width(), r.cols)).attr("data-row", b.row).attr("data-col", b.col)
        }), d(), w = r.cols
    }

    function c(a) {
        var b = r.cols - 1;
        f(b) && g(function() {
            var b, c = this,
                d = ko.dataFor(c),
                e = r.cols + 1,
                f = d.col[e],
                g = d.row[e];
            if (a) {
                var h = f > 1 ? f - 1 : 1;
                b = {
                    row: g,
                    col: h
                }
            } else {
                var h = f <= r.cols ? f : r.cols;
                b = {
                    row: g,
                    col: h
                }
            }
            $(c).attr("data-sizex", Math.min(d.col_width(), r.cols)).attr("data-row", b.row).attr("data-col", b.col)
        }), d(), w = r.cols
    }

    function d() {
        var a = $(".column-tool"),
            b = $("#board-content").width(),
            c = Math.floor(b / v);
        r.cols <= u ? a.addClass("min") : a.removeClass("min"), r.cols >= c ? a.addClass("max") : a.removeClass("max")
    }

    function e() {
        var a = $("#board-content").width()
        return Math.floor(a / v)
    }

    function f(a) {
        (void 0 === a || u > a) && (a = u);
        var b = e();
        a > b && (a = b);
        var c = v * a + a;
        return $(".responsive-column-width").css("max-width", c), a === r.cols ? !1 : !0
    }

    function g(a) {
        var b = r.$el;
        b.find("> li").unbind().removeData(), $(".responsive-column-width").css("width", ""), r.generate_grid_and_stylesheet(), b.find("> li").each(a), r.init(), $(".responsive-column-width").css("width", r.cols * t + r.cols * s * 2)
    }

    function h() {
        return w
    }

    function i(a) {
        w = Math.max(u, a)
    }

    function j(a, b, c) {
        var d = q(b),
            e = d.col,
            f = d.row,
            g = Number(b.width()),
            h = Number(b.getCalculatedHeight());
        r.add_widget(a, g, h, e, f), c && n(!0), l(b, f, e), $(a).attrchange({
            trackValues: !0,
            callback: function(a) {
                "data-row" == a.attributeName ? l(b, Number(a.newValue), void 0) : "data-col" == a.attributeName && l(b, void 0, Number(a.newValue))
            }
        })
    }

    function k(a, b) {
        var c = b.getCalculatedHeight(),
            d = Number($(a).attr("data-sizey")),
            e = Number($(a).attr("data-sizex"));
        (c != d || b.col_width() != e) && r.resize_widget($(a), b.col_width(), c, function() {
            r.set_dom_grid_height()
        })
    }

    function l(a, b, c) {
        var d = r.cols;
        _.isUndefined(b) || (a.row[d] = b), _.isUndefined(c) || (a.col[d] = c);
    }

    function m(a) {
        a ? x.fadeOut(0).appendTo("body").fadeIn(500) : x.fadeOut(500).remove()
    }

    function n(a, b) {
        _.isUndefined(b) && (b = !0);
        var c = b ? 250 : 0;
        a ? ($(".pane-tools").fadeIn(c), $("#column-tools").fadeIn(c)) : ($(".pane-tools").fadeOut(c), $("#column-tools").fadeOut(c))
    }

    function o(a) {
        $(a).hover(function() {
            p(this, !0)
        }, function() {
            p(this, !1)
        })
    }

    function p(a, b) {
        b ? $(a).find(".sub-section-tools").fadeIn(250) : $(a).find(".sub-section-tools").fadeOut(250)
    }

    function q(a) {
        var b = r.cols;
        if (_.isNumber(a.row) && _.isNumber(a.col)) {
            var c = {};
            c[b] = a.row, a.row = c, c = {}, c[b] = a.col, a.col = c
        }
        var d = 1,
            e = 1e3;
        for (var f in a.col) {
            if (f == b)
                return {
                    row: a.row[f],
                    col: a.col[f]
                };
            if (a.col[f] > b)
                d = b;
            else {
                var g = b - f;
                e > g && (d = f, e = g)
            }
        }
        return d in a.col && d in a.row ? {
            row: a.row[d],
            col: a.col[d]
        } : {
            row: 1,
            col: d
        }
    }
    var r, s = 10,
        t = 300,
        u = 3,
        v = s + t + s,
        w = u,
        x = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
    return ko.bindingHandlers.grid = {
        init: function(b, c, d, e, f) {
            r = $(b).gridster({
                widget_margins: [s, s],
                widget_base_dimensions: [t, 10],
                resize: {
                    enabled: !1,
                    axes: "x"
                }
            }).data("gridster"), a(!1), r.disable()
        }
    }, {
        showLoadingIndicator: function(a) {
            m(a)
        },
        showPaneEditIcons: function(a, b) {
            n(a, b)
        },
        attachWidgetEditIcons: function(a) {
            o(a)
        },
        getPositionForScreenSize: function(a) {
            return q(a)
        },
        processResize: function(b) {
            a(b)
        },
        disableGrid: function() {
            r.disable()
        },
        enableGrid: function() {
            r.enable()
        },
        addPane: function(a, b, c) {
            j(a, b, c)
        },
        updatePane: function(a, b) {
            k(a, b)
        },
        removePane: function(a) {
            r.remove_widget(a)
        },
        removeAllPanes: function() {
            r.remove_all_widgets()
        },
        addGridColumnLeft: function() {
            b(!0)
        },
        addGridColumnRight: function() {
            b(!1)
        },
        subGridColumnLeft: function() {
            c(!0)
        },
        subGridColumnRight: function() {
            c(!1)
        },
        getUserColumns: function() {
            return h()
        },
        setUserColumns: function(a) {
            i(a)
        }
    }
}

function PaneModel(a, b) {
    var c = this;
    this.title = ko.observable(), this.width = ko.observable(1), this.row = {}, this.col = {}, this.col_width = ko.observable(1), this.col_width.subscribe(function(a) {
        c.processSizeChange()
    }), this.widgets = ko.observableArray(), this.addWidget = function(a) {
        this.widgets.push(a)
    }, this.widgetCanMoveUp = function(a) {
        return c.widgets.indexOf(a) >= 1
    }, this.widgetCanMoveDown = function(a) {
        var b = c.widgets.indexOf(a);
        return b < c.widgets().length - 1
    }, this.moveWidgetUp = function(a) {
        if (c.widgetCanMoveUp(a)) {
            var b = c.widgets.indexOf(a),
                d = c.widgets();
            c.widgets.splice(b - 1, 2, d[b], d[b - 1])
        }
    }, this.moveWidgetDown = function(a) {
        if (c.widgetCanMoveDown(a)) {
            var b = c.widgets.indexOf(a),
                d = c.widgets();
            c.widgets.splice(b, 2, d[b + 1], d[b])
        }
    }, this.processSizeChange = function() {
        setTimeout(function() {
            _.each(c.widgets(), function(a) {
                a.processSizeChange()
            })
        }, 1e3)
    }, this.getCalculatedHeight = function() {
        var a = _.reduce(c.widgets(), function(a, b) {
            return a + b.height()
        }, 0);
        a *= 6, a += 3, a *= 10;
        var b = Math.ceil((a + 20) / 30);
        return Math.max(4, b)
    }, this.serialize = function() {
        var a = [];
        return _.each(c.widgets(), function(b) {
            a.push(b.serialize())
        }), {
            title: c.title(),
            width: c.width(),
            row: c.row,
            col: c.col,
            col_width: c.col_width(),
            widgets: a
        }
    }, this.deserialize = function(d) {
        c.title(d.title), c.width(d.width), c.row = d.row, c.col = d.col, c.col_width(d.col_width || 1), _.each(d.widgets, function(d) {
            var e = new WidgetModel(a, b);
            e.deserialize(d), c.widgets.push(e)
        })
    }, this.dispose = function() {
        _.each(c.widgets(), function(a) {
            a.dispose()
        })
    }
}

function WidgetModel(a, b) {
    function c() {
        _.isUndefined(d.widgetInstance) || (_.isFunction(d.widgetInstance.onDispose) && d.widgetInstance.onDispose(), d.widgetInstance = void 0)
    }
    var d = this;
    this.datasourceRefreshNotifications = {}, this.calculatedSettingScripts = {}, this.title = ko.observable(), this.fillSize = ko.observable(!1), this.type = ko.observable(), this.type.subscribe(function(a) {
        function e() {
            f.newInstance(d.settings(), function(a) {
                d.fillSize(f.fill_size === !0), d.widgetInstance = a, d.shouldRender(!0), d._heightUpdate.valueHasMutated()
            })
        }
        if (c(), a in b && _.isFunction(b[a].newInstance)) {
            var f = b[a];
            f.external_scripts ? head.js(f.external_scripts.slice(0), e) : e()
        }
    }), this.settings = ko.observable({}), this.settings.subscribe(function(a) {
        !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.onSettingsChanged) && d.widgetInstance.onSettingsChanged(a), d.updateCalculatedSettings(), d._heightUpdate.valueHasMutated()
    }), this.processDatasourceUpdate = function(a) {
        var b = d.datasourceRefreshNotifications[a];
        _.isArray(b) && _.each(b, function(a) {
            d.processCalculatedSetting(a)
        })
    }, this.callValueFunction = function(b) {
        return b.call(void 0, a.datasourceData)
    }, this.processSizeChange = function() {
        !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.onSizeChanged) && d.widgetInstance.onSizeChanged()
    }, this.processCalculatedSetting = function(a) {
        if (_.isFunction(d.calculatedSettingScripts[a])) {
            var b = void 0;
            try {
                b = d.callValueFunction(d.calculatedSettingScripts[a])
            } catch (c) {
                var e = d.settings()[a];
                c instanceof ReferenceError && /^\w+$/.test(e) && (b = e)
            }
            if (!_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.onCalculatedValueChanged) && !_.isUndefined(b))
                try {
                    d.widgetInstance.onCalculatedValueChanged(a, b)
                } catch (c) {
                    console.log(c.toString())
                }
        }
    }, this.updateCalculatedSettings = function() {
        if (d.datasourceRefreshNotifications = {}, d.calculatedSettingScripts = {}, !_.isUndefined(d.type())) {
            var a = b[d.type()].settings,
                c = new RegExp("datasources.([\\w_-]+)|datasources\\[['\"]([^'\"]+)", "g"),
                e = d.settings();
            _.each(a, function(a) {
                if ("calculated" == a.type) {
                    var b = e[a.name];
                    if (!_.isUndefined(b)) {
                        _.isArray(b) && (b = "[" + b.join(",") + "]"), (b.match(/;/g) || []).length <= 1 && -1 == b.indexOf("return") && (b = "return " + b);
                        var f;
                        try {
                            f = new Function("datasources", b)
                        } catch (g) {
                            var h = e[a.name].replace(/"/g, '\\"').replace(/[\r\n]/g, " \\\n");
                            f = new Function("datasources", 'return "' + h + '";')
                        }
                        d.calculatedSettingScripts[a.name] = f, d.processCalculatedSetting(a.name);
                        for (var i; i = c.exec(b);) {
                            var j = i[1] || i[2],
                                k = d.datasourceRefreshNotifications[j];
                            _.isUndefined(k) && (k = [], d.datasourceRefreshNotifications[j] = k), -1 == _.indexOf(k, a.name) && k.push(a.name)
                        }
                    }
                }
            })
        }
    }, this._heightUpdate = ko.observable(), this.height = ko.computed({
        read: function() {
            return d._heightUpdate(), !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.getHeight) ? d.widgetInstance.getHeight() : 1
        }
    }), this.shouldRender = ko.observable(!1), this.render = function(a) {
        d.shouldRender(!1), !_.isUndefined(d.widgetInstance) && _.isFunction(d.widgetInstance.render) && (d.widgetInstance.render(a), d.updateCalculatedSettings())
    }, this.dispose = function() {}, this.serialize = function() {
        return {
            title: d.title(),
            type: d.type(),
            settings: d.settings()
        }
    }, this.deserialize = function(a) {
        d.title(a.title), d.settings(a.settings), d.type(a.type)
    }
}
DatasourceModel = function(a, b) {
        function c() {
            _.isUndefined(d.datasourceInstance) || (_.isFunction(d.datasourceInstance.onDispose) && d.datasourceInstance.onDispose(), d.datasourceInstance = void 0)
        }
        var d = this;
        this.name = ko.observable(), this.latestData = ko.observable(), this.settings = ko.observable({}), this.settings.subscribe(function(a) {
            !_.isUndefined(d.datasourceInstance) && _.isFunction(d.datasourceInstance.onSettingsChanged) && d.datasourceInstance.onSettingsChanged(a)
        }), this.updateCallback = function(b) {
            a.processDatasourceUpdate(d, b), d.latestData(b);
            var c = new Date;
            d.last_updated(c.toLocaleTimeString())
        }, this.type = ko.observable(), this.type.subscribe(function(a) {
            function e() {
                f.newInstance(d.settings(), function(a) {
                    d.datasourceInstance = a, a.updateNow()
                }, d.updateCallback)
            }
            if (c(), a in b && _.isFunction(b[a].newInstance)) {
                var f = b[a];
                f.external_scripts ? head.js(f.external_scripts.slice(0), e) : e()
            }
        }), this.last_updated = ko.observable("never"), this.last_error = ko.observable(), this.serialize = function() {
            return {
                name: d.name(),
                type: d.type(),
                settings: d.settings()
            }
        }, this.deserialize = function(a) {
            d.settings(a.settings), d.name(a.name), d.type(a.type)
        }, this.getDataRepresentation = function(a) {
            var b = new Function("data", "return " + a + ";");
            return b.call(void 0, d.latestData())
        }, this.updateNow = function() {
            !_.isUndefined(d.datasourceInstance) && _.isFunction(d.datasourceInstance.updateNow) && d.datasourceInstance.updateNow()
        }, this.dispose = function() {
            c()
        }
    }, DeveloperConsole = function(a) {
        function b() {
            function b(a) {
                var b = $("<tr></tr>"),
                    d = $('<ul class="board-toolbar"></ul>'),
                    e = $('<input class="table-row-value" style="width:100%;" type="text">'),
                    f = $('<li><i class="icon-trash icon-white"></i></li>').click(function(a) {
                        c = _.without(c, e), b.remove()
                    });
                c.push(e), a && e.val(a), d.append(f), g.append(b.append($("<td></td>").append(e)).append($('<td class="table-row-operation">').append(d)))
            }
            var c = [],
                d = $("<div></div>"),
                e = $('<div class="table-operation text-button">ADD</div>'),
                f = $('<table class="table table-condensed sub-table"></table>');
            f.append($('<thead style=""><tr><th>Plugin Script URL</th></tr></thead>'));
            var g = $("<tbody></tbody>");
            f.append(g), d.append($("<p>Here you can add references to other scripts to load datasource or widget plugins.</p>")).append(f).append(e).append('<p>To learn how to build plugins for freeboard, please visit <a target="_blank" href="http://freeboard.github.io/freeboard/docs/plugin_example.html">http://freeboard.github.io/freeboard/docs/plugin_example.html</a></p>'), _.each(a.plugins(), function(a) {
                b(a)
            }), e.click(function(a) {
                b()
            }), new DialogBox(d, "Developer Console", "OK", null, function() {
                _.each(a.plugins(), function(a) {
                    $('script[src^="' + a + '"]').remove()
                }), a.plugins.removeAll(), _.each(c, function(b) {
                    var c = b.val();
                    c && c.length > 0 && (a.addPluginSource(c), head.js(c + "?" + Date.now()))
                })
            })
        }
        return {
            showDeveloperConsole: function() {
                b()
            }
        }
    }, JSEditor = function() {
        function a(a) {
            c = a
        }

        function b(a, b) {
            var c = '// Example: Convert temp from C to F and truncate to 2 decimal places.\n// return (datasources["MyDatasource"].sensor.tempInF * 1.8 + 32).toFixed(2);';
            a || (a = c);
            var d = $('<div class="code-window"></div>'),
                e = $('<div class="code-mirror-wrapper"></div>'),
                f = $('<div class="code-window-footer"></div>'),
                g = $('<div class="code-window-header cm-s-ambiance">This javascript will be re-evaluated any time a datasource referenced here is updated, and the value you <code><span class="cm-keyword">return</span></code> will be displayed in the widget. You can assume this javascript is wrapped in a function of the form <code><span class="cm-keyword">function</span>(<span class="cm-def">datasources</span>)</code> where datasources is a collection of javascript objects (keyed by their name) corresponding to the most current data in a datasource.</div>');
            d.append([g, e, f]), $("body").append(d);
            var h = CodeMirror(e.get(0), {
                    value: a,
                    mode: "javascript",
                    theme: "ambiance",
                    indentUnit: 4,
                    lineNumbers: !0,
                    matchBrackets: !0,
                    autoCloseBrackets: !0
                }),
                i = $('<span id="dialog-cancel" class="text-button">Close</span>').click(function() {
                    if (b) {
                        var a = h.getValue();
                        a === c && (a = ""), b(a), d.remove()
                    }
                });
            f.append(i)
        }
        var c = "";
        return {
            displayJSEditor: function(a, c) {
                b(a, c)
            },
            setAssetRoot: function(b) {
                a(b)
            }
        }
    }, PluginEditor = function(a, b) {
        function c(a, b) {
            var c = $('<div class="validation-error"></div>').html(b);
            $("#setting-value-container-" + a).append(c)
        }

        function d() {
            $("#setting-row-instance-name").length ? $("#setting-row-instance-name").nextAll().remove() : $("#setting-row-plugin-types").nextAll().remove()
        }

        function e(a) {
            return !isNaN(parseFloat(a)) && isFinite(a)
        }

        function f(c, d, e, f, g) {
            var h = $("<textarea></textarea>");
            e.multi_input ? h.change(function() {
                var a = [];
                $(c).find("textarea").each(function() {
                    var b = $(this).val();
                    b && (a = a.concat(b))
                }), d.settings[e.name] = a
            }) : h.change(function() {
                d.settings[e.name] = $(this).val()
            }), f && h.val(f), b.createValueEditor(h);
            var i = $('<ul class="board-toolbar datasource-input-suffix"></ul>'),
                j = $('<div class="calculated-setting-row"></div>');
            j.append(h).append(i);
            var k = $('<li><i class="icon-plus icon-white"></i><label>DATASOURCE</label></li>').mousedown(function(a) {
                a.preventDefault(), $(h).val("").focus().insertAtCaret('datasources["').trigger("freeboard-eval")
            });
            i.append(k);
            var l = $('<li><i class="icon-fullscreen icon-white"></i><label>.JS EDITOR</label></li>').mousedown(function(b) {
                b.preventDefault(), a.displayJSEditor(h.val(), function(a) {
                    h.val(a), h.change()
                })
            });
            if (i.append(l), g) {
                var m = $('<li class="remove-setting-row"><i class="icon-minus icon-white"></i><label></label></li>').mousedown(function(a) {
                    a.preventDefault(), j.remove(), $(c).find("textarea:first").change()
                });
                i.prepend(m)
            }
            $(c).append(j)
        }

        function g(a, b, g, h, i) {
            function j(a, b) {
                var c = $('<div id="setting-row-' + a + '" class="form-row"></div>').appendTo(n);
                return c.append('<div class="form-label"><label class="control-label">' + b + "</label></div>"), $('<div id="setting-value-container-' + a + '" class="form-value"></div>').appendTo(c)
            }

            function k(a, b, c) {
                _.each(a, function(a) {
                    function d() {
                        m.settings[a.name].length > 0 ? n.show() : n.hide()
                    }

                    function e(b) {
                        var c = $("<tr></tr>").appendTo(p),
                            e = {};
                        _.isArray(m.settings[a.name]) || (m.settings[a.name] = []), m.settings[a.name].push(e), _.each(a.settings, function(a) {
                            var d = $("<td></td>").appendTo(c),
                                f = "";
                            _.isUndefined(b[a.name]) || (f = b[a.name]), e[a.name] = f, $('<input class="table-row-value" type="text">').appendTo(d).val(f).change(function() {
                                e[a.name] = $(this).val()
                            })
                        }), c.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($("<li></li>").append($('<i class="icon-trash icon-white"></i>').click(function() {
                            var b = m.settings[a.name].indexOf(e); - 1 != b && (m.settings[a.name].splice(b, 1), c.remove(), d())
                        }))))), k.scrollTop(k[0].scrollHeight), d()
                    }!_.isUndefined(a.default_value) && _.isUndefined(h[a.name]) && (h[a.name] = a.default_value);
                    var g = a.name;
                    _.isUndefined(a.display_name) || (g = a.display_name);
                    var i = j(a.name, g);
                    switch (a.type) {
                        case "array":
                            var k = $('<div class="form-table-value-subtable"></div>').appendTo(i),
                                l = $('<table class="table table-condensed sub-table"></table>').appendTo(k),
                                n = $("<thead></thead>").hide().appendTo(l),
                                o = $("<tr></tr>").appendTo(n),
                                p = $("<tbody></tbody>").appendTo(l),
                                q = [];
                            _.each(a.settings, function(a) {
                                var b = a.name;
                                _.isUndefined(a.display_name) || (b = a.display_name), $("<th>" + b + "</th>").appendTo(o)
                            }), a.name in h && (q = h[a.name]), $('<div class="table-operation text-button">ADD</div>').appendTo(i).click(function() {
                                var b = {};
                                _.each(a.settings, function(a) {
                                    b[a.name] = ""
                                }), e(b)
                            }), _.each(q, function(a, b) {
                                e(a)
                            });
                            break;
                        case "boolean":
                            m.settings[a.name] = h[a.name];
                            var r = $('<div class="onoffswitch"><label class="onoffswitch-label" for="' + a.name + '-onoff"><div class="onoffswitch-inner"><span class="on">YES</span><span class="off">NO</span></div><div class="onoffswitch-switch"></div></label></div>').appendTo(i),
                                s = $('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + a.name + '-onoff">').prependTo(r).change(function() {
                                    m.settings[a.name] = this.checked
                                });
                            a.name in h && s.prop("checked", h[a.name]);
                            break;
                        case "option":
                            var t = h[a.name],
                                s = $("<select></select>").appendTo($('<div class="styled-select"></div>').appendTo(i)).change(function() {
                                    m.settings[a.name] = $(this).val()
                                });
                            _.each(a.options, function(a) {
                                var b, c;
                                _.isObject(a) ? (b = a.name, c = a.value) : b = a, _.isUndefined(c) && (c = b), _.isUndefined(t) && (t = c), $("<option></option>").text(b).attr("value", c).appendTo(s)
                            }), m.settings[a.name] = t, a.name in h && s.val(h[a.name]);
                            break;
                        default:
                            if (m.settings[a.name] = h[a.name], "calculated" == a.type) {
                                if (a.name in h) {
                                    var u = h[a.name];
                                    if (a.multi_input && _.isArray(u))
                                        for (var v = !1, w = 0; w < u.length; w++)
                                            f(i, m, a, u[w], v), v = !0;
                                    else
                                        f(i, m, a, u, !1)
                                } else
                                    f(i, m, a, null, !1);
                                if (a.multi_input) {
                                    var x = $('<ul class="board-toolbar"><li class="add-setting-row"><i class="icon-plus icon-white"></i><label>ADD</label></li></ul>').mousedown(function(b) {
                                        b.preventDefault(), f(i, m, a, null, !0)
                                    });
                                    $(i).siblings(".form-label").append(x)
                                }
                            } else {
                                var s = $('<input type="text">').appendTo(i).change(function() {
                                    "number" == a.type ? m.settings[a.name] = Number($(this).val()) : m.settings[a.name] = $(this).val()
                                });
                                if (a.name in h && s.val(h[a.name]), b && a.typeahead_data_field && s.addClass("typeahead_data_field-" + a.typeahead_data_field), b && a.typeahead_field) {
                                    var y = [];
                                    s.keyup(function(a) {
                                        a.which >= 65 && a.which <= 91 && s.trigger("change")
                                    }), $(s).autocomplete({
                                        source: y,
                                        select: function(a, b) {
                                            s.val(b.item.value), s.trigger("change")
                                        }
                                    }), s.change(function(d) {
                                        var e = s.val(),
                                            f = _.template(b)({
                                                input: e
                                            });
                                        $.get(f, function(b) {
                                            if (c && (b = b[c]), b = _.select(b, function(b) {
                                                    return b[a.typeahead_field][0] == e[0]
                                                }), y = _.map(b, function(b) {
                                                    return b[a.typeahead_field]
                                                }), $(s).autocomplete("option", "source", y), 1 == b.length) {
                                                b = b[0];
                                                for (var d in b)
                                                    if (b.hasOwnProperty(d)) {
                                                        var f = $(_.template("input.typeahead_data_field-<%= field %>")({
                                                            field: d
                                                        }));
                                                        f && (f.val(b[d]), f.val() != s.val() && f.trigger("change"))
                                                    }
                                            }
                                        })
                                    })
                                }
                            }
                    }
                    _.isUndefined(a.suffix) || i.append($('<div class="input-suffix">' + a.suffix + "</div>")), _.isUndefined(a.description) || i.append($('<div class="setting-description">' + a.description + "</div>"))
                })
            }
            var l, m = {
                    type: g,
                    settings: {}
                },
                n = $("<div></div>"),
                o = $('<div id="plugin-description"></div>').hide();
            n.append(o), new DialogBox(n, a, "Save", "Cancel", function() {
                $(".validation-error").remove();
                for (var a = 0; a < l.settings.length; a++) {
                    var b = l.settings[a];
                    if (b.required && (_.isUndefined(m.settings[b.name]) || "" == m.settings[b.name]))
                        return c(b.name, "This is required."), !0;
                    if ("integer" == b.type && m.settings[b.name] % 1 !== 0)
                        return c(b.name, "Must be a whole number."), !0;
                    if ("number" == b.type && !e(m.settings[b.name]))
                        return c(b.name, "Must be a number."), !0
                }
                _.isFunction(i) && i(m)
            });
            var p, q = _.keys(b);
            if (q.length > 1) {
                var r = j("plugin-types", "Type");
                p = $("<select></select>").appendTo($('<div class="styled-select"></div>').appendTo(r)), p.append($("<option>Select a type...</option>").attr("value", "undefined")), _.each(b, function(a) {
                    p.append($("<option></option>").text(a.display_name).attr("value", a.type_name))
                }), p.change(function() {
                    m.type = $(this).val(), m.settings = {}, d(), l = b[p.val()], _.isUndefined(l) ? ($("#setting-row-instance-name").hide(), $("#dialog-ok").hide()) : ($("#setting-row-instance-name").show(), l.description && l.description.length > 0 ? o.html(l.description).show() : o.hide(), $("#dialog-ok").show(), k(l.settings, l.typeahead_source, l.typeahead_data_segment))
                })
            } else
                1 == q.length && (l = b[q[0]], m.type = l.type_name, m.settings = {}, k(l.settings));
            p && (_.isUndefined(g) ? ($("#setting-row-instance-name").hide(), $("#dialog-ok").hide()) : ($("#dialog-ok").show(), p.val(g).trigger("change")))
        }
        return {
            createPluginEditor: function(a, b, c, d, e, f) {
                g(a, b, c, d, e, f)
            }
        }
    }, ValueEditor = function(a) {
        function b(a, b) {
            return _.isArray(a) || _.isObject(a) ? !0 : c(a, b)
        }

        function c(a, b) {
            switch (b) {
                case o.ANY:
                    return !0;
                case o.ARRAY:
                    return _.isArray(a);
                case o.OBJECT:
                    return _.isObject(a);
                case o.STRING:
                    return _.isString(a);
                case o.NUMBER:
                    return _.isNumber(a);
                case o.BOOLEAN:
                    return _.isBoolean(a)
            }
        }

        function d(a, b) {
            $(a).parent().find(".validation-error").remove(), c(n, b) || $(a).parent().append("<div class='validation-error'>This field expects an expression that evaluates to type " + b + ".</div>")
        }

        function e(a) {
            var b = ($(a).val().match(/\n/g) || []).length,
                c = Math.min(200, 20 * (b + 1));
            $(a).css({
                height: c + "px"
            })
        }

        function f(a, c, d) {
            var e = j.exec(a),
                f = [];
            if (e)
                if ("" == e[1])
                    _.each(c, function(a) {
                        f.push({
                            value: a.name(),
                            entity: void 0,
                            precede_char: "",
                            follow_char: '"]'
                        })
                    });
                else if ("" != e[1] && _.isUndefined(e[2])) {
                var g = e[1];
                _.each(c, function(a) {
                    var b = a.name();
                    b != g && 0 == b.indexOf(g) && f.push({
                        value: b,
                        entity: void 0,
                        precede_char: "",
                        follow_char: '"]'
                    })
                })
            } else {
                var h = _.find(c, function(a) {
                    return a.name() === e[1]
                });
                if (!_.isUndefined(h)) {
                    var i = "data",
                        k = "";
                    if (!_.isUndefined(e[2])) {
                        var l = e[3].lastIndexOf("]") + 1;
                        i += e[3].substring(0, l), k = e[3].substring(l, e[3].length), k = k.replace(/^[\[\"]*/, ""), k = k.replace(/[\"\]]*$/, "")
                    }
                    var o = h.getDataRepresentation(i);
                    if (n = o, _.isArray(o)) {
                        for (var p = 0; p < o.length; p++)
                            if (0 == p.toString().indexOf(k)) {
                                var q = o[p];
                                b(q, d) && f.push({
                                    value: p,
                                    entity: q,
                                    precede_char: "[",
                                    follow_char: "]",
                                    preview: q.toString()
                                })
                            }
                    } else
                        _.isObject(o) && _.each(o, function(a, c) {
                            0 == c.indexOf(k) && b(a, d) && f.push({
                                value: c,
                                entity: a,
                                precede_char: '["',
                                follow_char: '"]'
                            })
                        })
                }
            }
            m = f
        }

        function g(b, c) {
            var e = $(b).val().substring(0, $(b).getCaretPosition());
            if (e = e.replace(String.fromCharCode(160), " "), f(e, a.datasources(), c), m.length > 0) {
                k || (k = $('<ul id="value-selector" class="value-dropdown"></ul>').insertAfter(b).width($(b).outerWidth() - 2).css("left", $(b).position().left).css("top", $(b).position().top + $(b).outerHeight() - 1)), k.empty(), k.scrollTop(0);
                var g = !0;
                l = 0, _.each(m, function(a, c) {
                    var d = h(b, e, a, c);
                    g && ($(d).addClass("selected"), g = !1)
                })
            } else
                d(b, c), $(b).next("ul#value-selector").remove(), k = null, l = -1
        }

        function h(a, b, c, d) {
            var e = c.value;
            c.preview && (e = e + "<span class='preview'>" + c.preview + "</span>");
            var f = $("<li>" + e + "</li>").appendTo(k).mouseenter(function() {
                $(this).trigger("freeboard-select")
            }).mousedown(function(a) {
                $(this).trigger("freeboard-insertValue"), a.preventDefault()
            }).data("freeboard-optionIndex", d).data("freeboard-optionValue", c.value).bind("freeboard-insertValue", function() {
                var d = c.value;
                d = c.precede_char + d + c.follow_char;
                var e = b.lastIndexOf("]"); - 1 != e ? $(a).replaceTextAt(e + 1, $(a).val().length, d) : $(a).insertAtCaret(d), n = c.entity, $(a).triggerHandler("mouseup")
            }).bind("freeboard-select", function() {
                $(this).parent().find("li.selected").removeClass("selected"), $(this).addClass("selected"), l = $(this).data("freeboard-optionIndex")
            });
            return f
        }

        function i(a, b) {
            $(a).addClass("calculated-value-input").bind("keyup mouseup freeboard-eval", function(c) {
                return !k || "keyup" != c.type || 38 != c.keyCode && 40 != c.keyCode && 13 != c.keyCode ? void g(a, b) : void c.preventDefault()
            }).focus(function() {
                $(a).css({
                    "z-index": 3001
                }), e(a)
            }).focusout(function() {
                d(a, b), $(a).css({
                    height: "",
                    "z-index": 3e3
                }), $(a).next("ul#value-selector").remove(), k = null, l = -1
            }).bind("keydown", function(a) {
                if (k)
                    if (38 == a.keyCode || 40 == a.keyCode) {
                        a.preventDefault();
                        var b = $(k).find("li");
                        38 == a.keyCode ? l-- : 40 == a.keyCode && l++, 0 > l ? l = b.size() - 1 : l >= b.size() && (l = 0);
                        var c = $(b).eq(l);
                        c.trigger("freeboard-select"), $(k).scrollTop($(c).position().top)
                    } else
                        13 == a.keyCode && (a.preventDefault(), -1 != l && $(k).find("li").eq(l).trigger("freeboard-insertValue"))
            })
        }
        var j = new RegExp('.*datasources\\["([^"]*)("\\])?(.*)$'),
            k = null,
            l = 0,
            m = [],
            n = null,
            o = {
                ANY: "any",
                ARRAY: "array",
                OBJECT: "object",
                STRING: "string",
                NUMBER: "number",
                BOOLEAN: "boolean"
            };
        return {
            createValueEditor: function(a, b) {
                b ? i(a, b) : i(a, o.ANY)
            },
            EXPECTED_TYPE: o
        }
    },
    function(a) {
        function b() {
            var a = document.createElement("p"),
                b = !1;
            if (a.addEventListener)
                a.addEventListener("DOMAttrModified", function() {
                    b = !0
                }, !1);
            else {
                if (!a.attachEvent)
                    return !1;
                a.attachEvent("onDOMAttrModified", function() {
                    b = !0
                })
            }
            return a.setAttribute("id", "target"), b
        }

        function c(b, c) {
            if (b) {
                var d = this.data("attr-old-value");
                if (c.attributeName.indexOf("style") >= 0) {
                    d.style || (d.style = {});
                    var e = c.attributeName.split(".");
                    c.attributeName = e[0], c.oldValue = d.style[e[1]], c.newValue = e[1] + ":" + this.prop("style")[a.camelCase(e[1])], d.style[e[1]] = c.newValue
                } else
                    c.oldValue = d[c.attributeName], c.newValue = this.attr(c.attributeName), d[c.attributeName] = c.newValue;
                this.data("attr-old-value", d)
            }
        }
        var d = window.MutationObserver || window.WebKitMutationObserver;
        a.fn.attrchange = function(e) {
            var f = {
                trackValues: !1,
                callback: a.noop
            };
            if ("function" == typeof e ? f.callback = e : a.extend(f, e), f.trackValues && a(this).each(function(b, c) {
                    for (var d, e = {}, b = 0, f = c.attributes, g = f.length; g > b; b++)
                        d = f.item(b), e[d.nodeName] = d.value;
                    a(this).data("attr-old-value", e)
                }), d) {
                var g = {
                        subtree: !1,
                        attributes: !0,
                        attributeOldValue: f.trackValues
                    },
                    h = new d(function(b) {
                        b.forEach(function(b) {
                            var c = b.target;
                            f.trackValues && (b.newValue = a(c).attr(b.attributeName)), f.callback.call(c, b)
                        })
                    });
                return this.each(function() {
                    h.observe(this, g)
                })
            }
            return b() ? this.on("DOMAttrModified", function(a) {
                a.originalEvent && (a = a.originalEvent), a.attributeName = a.attrName, a.oldValue = a.prevValue, f.callback.call(this, a)
            }) : "onpropertychange" in document.body ? this.on("propertychange", function(b) {
                b.attributeName = window.event.propertyName, c.call(a(this), f.trackValues, b), f.callback.call(this, b)
            }) : this
        }
    }
    (jQuery),
    function(a) {
        a.eventEmitter = {
            _JQInit: function() {
                this._JQ = a(this)
            },
            emit: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.trigger(a, b)
            },
            once: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.one(a, b)
            },
            on: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.bind(a, b)
            },
            off: function(a, b) {
                !this._JQ && this._JQInit(), this._JQ.unbind(a, b)
            }
        }
    }
    (jQuery);
var freeboard = function() {
        function a(a) {
            a = a.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var b = new RegExp("[\\?&]" + a + "=([^&#]*)"),
                c = b.exec(location.search);
            return null == c ? "" : decodeURIComponent(c[1].replace(/\+/g, " "))
        }
        var b = {},
            c = {},
            d = new FreeboardUI,
            e = new FreeboardModel(b, c, d),
            f = new JSEditor,
            g = new ValueEditor(e),
            h = new PluginEditor(f, g),
            i = new DeveloperConsole(e),
            j = {
                values: {
                    "font-family": '"HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif',
                    color: "#d3d4d4",
                    "font-weight": 100
                }
            };
        return ko.bindingHandlers.pluginEditor = {
            init: function(a, f, g, i, j) {
                var k = ko.unwrap(f()),
                    l = {},
                    m = void 0,
                    n = "";
                "datasource" == k.type ? (l = b, n = "Datasource") : "widget" == k.type ? (l = c, n = "Widget") : "pane" == k.type && (n = "Pane"), $(a).click(function(f) {
                    if ("delete" == k.operation) {
                        var g = $("<p>Are you sure you want to delete this " + n + "?</p>");
                        new DialogBox(g, "Confirm Delete", "Yes", "No", function() {
                            "datasource" == k.type ? e.deleteDatasource(i) : "widget" == k.type ? e.deleteWidget(i) : "pane" == k.type && e.deletePane(i)
                        })
                        e.saveLocalstorage();
                    } else {
                        var j = void 0;
                        "datasource" == k.type ? "add" == k.operation ? m = {} : (j = i.type(), m = i.settings(), m.name = i.name()) : "widget" == k.type ? "add" == k.operation ? m = {} : (j = i.type(), m = i.settings()) : "pane" == k.type && (m = {}, "edit" == k.operation && (m.title = i.title(), m.col_width = i.col_width()), l = {
                            settings: {
                                settings: [{
                                    name: "title",
                                    display_name: "Title",
                                    type: "text"
                                }, {
                                    name: "col_width",
                                    display_name: "Columns",
                                    type: "integer",
                                    default_value: 1,
                                    required: !0
                                }]
                            }
                        }), h.createPluginEditor(n, l, j, m, function(f) {
                            if ("add" == k.operation) {
                                if ("datasource" == k.type) {
                                    var g = new DatasourceModel(e, b);
                                    e.addDatasource(g), g.name(f.settings.name), f.settings.name, g.settings(f.settings), g.type(f.type)
                                } else if ("widget" == k.type) {
                                    var g = new WidgetModel(e, c);
                                    g.settings(f.settings), g.type(f.type), i.widgets.push(g), d.attachWidgetEditIcons(a)
                                }
                            } else {
                                "edit" == k.operation && ("pane" == k.type ? (i.title(f.settings.title), i.col_width(f.settings.col_width), d.processResize(!1)) : ("datasource" == k.type && (i.name(f.settings.name), f.settings.name), i.type(f.type), i.settings(f.settings)))
                            }
                            e.saveLocalstorage();
                        })
                        e.saveLocalstorage();
                    }
                })
            }
        }, ko.virtualElements.allowedBindings.datasourceTypeSettings = !0, ko.bindingHandlers.datasourceTypeSettings = {
            update: function(a, b, c, d, e) {
                processPluginSettings(a, b, c, d, e);
                e.saveLocalstorage();
            }
        }, ko.bindingHandlers.pane = {
            init: function(a, b, c, f, g) {
                e.isEditing() && $(a).css({
                    cursor: "pointer"
                }), d.addPane(a, f, g.$root.isEditing());
                e.saveLocalstorage();
            },
            update: function(a, b, c, f, g) {
                -1 == e.panes.indexOf(f) && d.removePane(a), d.updatePane(a, f);
                e.saveLocalstorage();
            }
        }, ko.bindingHandlers.widget = {
            init: function(a, b, c, f, g) {
                e.isEditing() && d.attachWidgetEditIcons($(a).parent()) && e.saveLocalstorage()
            },
            update: function(a, b, c, d, e) {
                d.shouldRender() && ($(a).empty(), d.render(a)) && e.saveLocalstorage()
            }
        }, $(function() {
            function a() {
                d.processResize(!0), e.saveLocalstorage();
            }
            d.showLoadingIndicator(!0);
            var b;
            $(window).resize(function() {
                clearTimeout(b), b = setTimeout(a, 500)
            })
        }), {
            initialize: function(b, c) {
                ko.applyBindings(e);
                var f = a("load");
                "" != f ? $.ajax({
                    url: f,
                    success: function(a) {
                        e.loadDashboard(a), _.isFunction(c) && c()
                    }
                }) : (e.allow_edit(b), e.setEditing(b), d.showLoadingIndicator(!1), _.isFunction(c) && c(), freeboard.emit("initialized"))
            },
            newDashboard: function() {
                e.loadDashboard({
                    allow_edit: !0
                })
            },
            loadDashboard: function(a, b) {
                e.loadDashboard(a, b)
            },
            serialize: function() {
                return e.serialize()
            },
            setEditing: function(a, b) {
                e.setEditing(a, b)
            },
            isEditing: function() {
                return e.isEditing()
            },
            loadDatasourcePlugin: function(a) {
                _.isUndefined(a.display_name) && (a.display_name = a.type_name), a.settings.unshift({
                    name: "name",
                    display_name: "Name",
                    type: "text",
                    required: !0
                }), e.addPluginSource(a.source), b[a.type_name] = a, e._datasourceTypes.valueHasMutated()
            },
            resize: function() {
                d.processResize(!0)
            },
            loadWidgetPlugin: function(a) {
                _.isUndefined(a.display_name) && (a.display_name = a.type_name), e.addPluginSource(a.source), c[a.type_name] = a, e._widgetTypes.valueHasMutated()
            },
            setAssetRoot: function(a) {
                f.setAssetRoot(a)
            },
            addStyle: function(a, b) {
                var c = a + "{" + b + "}",
                    d = $("style#fb-styles");
                0 == d.length && (d = $('<style id="fb-styles" type="text/css"></style>'), $("head").append(d)), d[0].styleSheet ? d[0].styleSheet.cssText += c : d.text(d.text() + c)
            },
            showLoadingIndicator: function(a) {
                d.showLoadingIndicator(a)
            },
            showDialog: function(a, b, c, d, e) {
                new DialogBox(a, b, c, d, e)
            },
            getDatasourceSettings: function(a) {
                var b = e.datasources(),
                    c = _.find(b, function(b) {
                        return b.name() === a
                    });
                return c ? c.settings() : null
            },
            setDatasourceSettings: function(a, b) {
                var c = e.datasources(),
                    d = _.find(c, function(b) {
                        return b.name() === a
                    });
                if (!d)
                    return void console.log("Datasource not found");
                var f = _.defaults(b, d.settings());
                d.settings(f)
            },
            getStyleString: function(a) {
                var b = "";
                return _.each(j[a], function(a, c) {
                    b = b + c + ":" + a + ";"
                }), b
            },
            getStyleObject: function(a) {
                return j[a]
            },
            showDeveloperConsole: function() {
                i.showDeveloperConsole()
            }
        }
    }
    ();
$.extend(freeboard, jQuery.eventEmitter),
    function() {
        var a = function(a, b) {
            function c(a) {
                e && clearInterval(e), e = setInterval(function() {
                    d.updateNow()
                }, a)
            }
            var d = this,
                e = null,
                f = a,
                g = 0,
                h = !1;
            c(1e3 * f.refresh), this.updateNow = function() {
                if (!(g > 1 && !f.use_thingproxy || g > 2)) {
                    var a = f.url;
                    2 == g && f.use_thingproxy && (a = ("https:" == location.protocol ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(f.url));
                    var c = f.body;
                    if (c)
                        try {
                            c = JSON.parse(c)
                        } catch (e) {}
                    $.ajax({
                        url: a,
                        dataType: 1 == g ? "JSONP" : "JSON",
                        type: f.method || "GET",
                        data: c,
                        beforeSend: function(a) {
                            try {
                                _.each(f.headers, function(b) {
                                    var c = b.name,
                                        d = b.value;
                                    _.isUndefined(c) || _.isUndefined(d) || a.setRequestHeader(c, d)
                                })
                            } catch (b) {}
                        },
                        success: function(a) {
                            h = !0, b(a)
                        },
                        error: function(a, b, c) {
                            h || (g++, d.updateNow())
                        }
                    })
                }
            }, this.onDispose = function() {
                clearInterval(e), e = null
            }, this.onSettingsChanged = function(a) {
                h = !1, g = 0, f = a, c(1e3 * f.refresh), d.updateNow()
            }
        };
        freeboard.loadDatasourcePlugin({
            type_name: "JSON",
            settings: [{
                name: "url",
                display_name: "URL",
                type: "text"
            }, {
                name: "use_thingproxy",
                display_name: "Try thingproxy",
                description: 'A direct JSON connection will be tried first, if that fails, a JSONP connection will be tried. If that fails, you can use thingproxy, which can solve many connection problems to APIs. <a href="https://github.com/Freeboard/thingproxy" target="_blank">More information</a>.',
                type: "boolean",
                default_value: !0
            }, {
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 5
            }, {
                name: "method",
                display_name: "Method",
                type: "option",
                options: [{
                    name: "GET",
                    value: "GET"
                }, {
                    name: "POST",
                    value: "POST"
                }, {
                    name: "PUT",
                    value: "PUT"
                }, {
                    name: "DELETE",
                    value: "DELETE"
                }]
            }, {
                name: "body",
                display_name: "Body",
                type: "text",
                description: "The body of the request. Normally only used if method is POST"
            }, {
                name: "headers",
                display_name: "Headers",
                type: "array",
                settings: [{
                    name: "name",
                    display_name: "Name",
                    type: "text"
                }, {
                    name: "value",
                    display_name: "Value",
                    type: "text"
                }]
            }],
            newInstance: function(b, c, d) {
                c(new a(b, d))
            }
        });
        var b = function(a, b) {
            function c(a) {
                f && clearInterval(f), f = setInterval(function() {
                    e.updateNow()
                }, a)
            }

            function d(a) {
                return a.replace(/\w\S*/g, function(a) {
                    return a.charAt(0).toUpperCase() + a.substr(1).toLowerCase()
                })
            }
            var e = this,
                f = null,
                g = a;
            c(1e3 * g.refresh), this.updateNow = function() {
                $.ajax({
                    url: "http://api.openweathermap.org/data/2.5/weather?APPID=" + g.api_key + "&q=" + encodeURIComponent(g.location) + "&units=" + g.units,
                    dataType: "JSONP",
                    success: function(a) {
                        var c = {
                            place_name: a.name,
                            sunrise: new Date(1e3 * a.sys.sunrise).toLocaleTimeString(),
                            sunset: new Date(1e3 * a.sys.sunset).toLocaleTimeString(),
                            conditions: d(a.weather[0].description),
                            current_temp: a.main.temp,
                            high_temp: a.main.temp_max,
                            low_temp: a.main.temp_min,
                            pressure: a.main.pressure,
                            humidity: a.main.humidity,
                            wind_speed: a.wind.speed,
                            wind_direction: a.wind.deg
                        };
                        b(c)
                    },
                    error: function(a, b, c) {}
                })
            }, this.onDispose = function() {
                clearInterval(f), f = null
            }, this.onSettingsChanged = function(a) {
                g = a, e.updateNow(), c(1e3 * g.refresh)
            }
        };
        freeboard.loadDatasourcePlugin({
            type_name: "openweathermap",
            display_name: "Open Weather Map API",
            settings: [{
                name: "api_key",
                display_name: "API Key",
                type: "text",
                description: "Your personal API Key from Open Weather Map"
            }, {
                name: "location",
                display_name: "Location",
                type: "text",
                description: "Example: London, UK"
            }, {
                name: "units",
                display_name: "Units",
                type: "option",
                "default": "imperial",
                options: [{
                    name: "Imperial",
                    value: "imperial"
                }, {
                    name: "Metric",
                    value: "metric"
                }]
            }, {
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 5
            }],
            newInstance: function(a, c, d) {
                c(new b(a, d))
            }
        });
        var c = function(a, b) {
            function c(a) {
                b(a)
            }
            var d = this,
                e = a;
            this.updateNow = function() {
                dweetio.get_latest_dweet_for(e.thing_id, function(a, b) {
                    a || c(b[0].content)
                })
            }, this.onDispose = function() {}, this.onSettingsChanged = function(a) {
                dweetio.stop_listening(), e = a, dweetio.listen_for(e.thing_id, function(a) {
                    c(a.content)
                })
            }, d.onSettingsChanged(a)
        };
        freeboard.loadDatasourcePlugin({
            type_name: "dweet_io",
            display_name: "Dweet.io",
            external_scripts: ["http://dweet.io/client/dweet.io.min.js"],
            settings: [{
                name: "thing_id",
                display_name: "Thing Name",
                description: "Example: salty-dog-1",
                type: "text"
            }],
            newInstance: function(a, b, d) {
                b(new c(a, d))
            }
        });
        var d = function(a, b) {
            function c() {
                h.length > 0 ? (i < h.length && (b(h[i]), i++), i >= h.length && g.loop && (i = 0), i < h.length && (e = setTimeout(c, 1e3 * g.refresh))) : b({})
            }

            function d() {
                h = [], i = 0, e && (clearTimeout(e), e = null)
            }
            var e, f = this,
                g = a,
                h = [],
                i = 0;
            this.updateNow = function() {
                d(), $.ajax({
                    url: g.datafile,
                    dataType: g.is_jsonp ? "JSONP" : "JSON",
                    success: function(a) {
                        h = _.isArray(a) ? a : [], i = 0, c()
                    },
                    error: function(a, b, c) {}
                })
            }, this.onDispose = function() {
                d()
            }, this.onSettingsChanged = function(a) {
                g = a, f.updateNow()
            }
        };
        freeboard.loadDatasourcePlugin({
            type_name: "playback",
            display_name: "Playback",
            settings: [{
                name: "datafile",
                display_name: "Data File URL",
                type: "text",
                description: "A link to a JSON array of data."
            }, {
                name: "is_jsonp",
                display_name: "Is JSONP",
                type: "boolean"
            }, {
                name: "loop",
                display_name: "Loop",
                type: "boolean",
                description: "Rewind and loop when finished"
            }, {
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 5
            }],
            newInstance: function(a, b, c) {
                b(new d(a, c))
            }
        });
        var e = function(a, b) {
            function c() {
                e && (clearTimeout(e), e = null)
            }

            function d() {
                c(), e = setInterval(f.updateNow, 1e3 * g.refresh)
            }
            var e, f = this,
                g = a;
            this.updateNow = function() {
                var a = new Date,
                    c = {
                        numeric_value: a.getTime(),
                        full_string_value: a.toLocaleString(),
                        date_string_value: a.toLocaleDateString(),
                        time_string_value: a.toLocaleTimeString(),
                        date_object: a
                    };
                b(c)
            }, this.onDispose = function() {
                c()
            }, this.onSettingsChanged = function(a) {
                g = a, d()
            }, d()
        };
        freeboard.loadDatasourcePlugin({
            type_name: "clock",
            display_name: "Clock",
            settings: [{
                name: "refresh",
                display_name: "Refresh Every",
                type: "number",
                suffix: "seconds",
                default_value: 1
            }],
            newInstance: function(a, b, c) {
                b(new e(a, c))
            }
        }), freeboard.loadDatasourcePlugin({
            type_name: "meshblu",
            display_name: "Octoblu",
            description: "app.octoblu.com",
            external_scripts: ["http://meshblu.octoblu.com/js/meshblu.js"],
            settings: [{
                name: "uuid",
                display_name: "UUID",
                type: "text",
                default_value: "device uuid",
                description: "your device UUID",
                required: !0
            }, {
                name: "token",
                display_name: "Token",
                type: "text",
                default_value: "device token",
                description: "your device TOKEN",
                required: !0
            }, {
                name: "server",
                display_name: "Server",
                type: "text",
                default_value: "meshblu.octoblu.com",
                description: "your server",
                required: !0
            }, {
                name: "port",
                display_name: "Port",
                type: "number",
                default_value: 80,
                description: "server port",
                required: !0
            }],
            newInstance: function(a, b, c) {
                b(new f(a, c))
            }
        });
        var f = function(a, b) {
            function c() {
                var a = skynet.createConnection({
                    uuid: e.uuid,
                    token: e.token,
                    server: e.server,
                    port: e.port
                });
                a.on("ready", function(c) {
                    a.on("message", function(a) {
                        var c = a;
                        b(c)
                    })
                })
            }
            var d = this,
                e = a;
            d.onSettingsChanged = function(a) {
                e = a
            }, d.updateNow = function() {
                c()
            }, d.onDispose = function() {}
        }
    }
    (),
    function() {
        function a(a, b, c) {
            var d = $(b).text();
            if (d != a)
                if ($.isNumeric(a) && $.isNumeric(d)) {
                    var e = a.toString().split("."),
                        f = 0;
                    e.length > 1 && (f = e[1].length), e = d.toString().split(".");
                    var g = 0;
                    e.length > 1 && (g = e[1].length), jQuery({
                        transitionValue: Number(d),
                        precisionValue: g
                    }).animate({
                        transitionValue: Number(a),
                        precisionValue: f
                    }, {
                        duration: c,
                        step: function() {
                            $(b).text(this.transitionValue.toFixed(this.precisionValue))
                        },
                        done: function() {
                            $(b).text(a)
                        }
                    })
                } else
                    $(b).text(a)
        }

        function b(a, b) {
            for (var c = $("<div class='sparkline-legend'></div>"), d = 0; d < b.length; d++) {
                var f = e[d % e.length],
                    g = b[d];
                c.append("<div class='sparkline-legend-value'><span style='color:" + f + "'>&#9679;</span>" + g + "</div>")
            }
            a.empty().append(c), freeboard.addStyle(".sparkline-legend", "margin:5px;"), freeboard.addStyle(".sparkline-legend-value", "color:white; font:10px arial,san serif; float:left; overflow:hidden; width:50%;"), freeboard.addStyle(".sparkline-legend-value span", "font-weight:bold; padding-right:5px;")
        }

        function c(a, b, c) {
            var f = $(a).data().values,
                g = $(a).data().valueMin,
                h = $(a).data().valueMax;
            f || (f = [], g = void 0, h = void 0);
            var i = function(a, b) {
                f[b] || (f[b] = []), f[b].length >= d && f[b].shift(), f[b].push(Number(a)), (void 0 === g || g > a) && (g = a), (void 0 === h || a > h) && (h = a)
            };
            _.isArray(b) ? _.each(b, i) : i(b, 0), $(a).data().values = f, $(a).data().valueMin = g, $(a).data().valueMax = h;
            var j = '<span style="color: {{color}}">&#9679;</span> {{y}}',
                k = !1;
            _.each(f, function(b, d) {
                $(a).sparkline(b, {
                    type: "line",
                    composite: k,
                    height: "100%",
                    width: "100%",
                    fillColor: !1,
                    lineColor: e[d % e.length],
                    lineWidth: 2,
                    spotRadius: 3,
                    spotColor: !1,
                    minSpotColor: "#78AB49",
                    maxSpotColor: "#78AB49",
                    highlightSpotColor: "#9D3926",
                    highlightLineColor: "#9D3926",
                    chartRangeMin: g,
                    chartRangeMax: h,
                    tooltipFormat: c && c[d] ? j + " (" + c[d] + ")" : j
                }), k = !0
            })
        }
        var d = 100,
            e = ["#FF9900", "#FFFFFF", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"],
            f = freeboard.getStyleString("values");
        freeboard.addStyle(".widget-big-text", f + "font-size:75px;"), freeboard.addStyle(".tw-display", "width: 100%; height:100%; display:table; table-layout:fixed;"), freeboard.addStyle(".tw-tr", "display:table-row;"), freeboard.addStyle(".tw-tg", "display:table-row-group;"), freeboard.addStyle(".tw-tc", "display:table-caption;"), freeboard.addStyle(".tw-td", "display:table-cell;"), freeboard.addStyle(".tw-value", f + "overflow: hidden;display: inline-block;text-overflow: ellipsis;"), freeboard.addStyle(".tw-unit", "display: inline-block;padding-left: 10px;padding-bottom: 1.1em;vertical-align: bottom;"), freeboard.addStyle(".tw-value-wrapper", "position: relative;vertical-align: middle;height:100%;"), freeboard.addStyle(".tw-sparkline", "height:20px;");
        var g = function(b) {
            function d() {
                _.isUndefined(e.units) || "" == e.units ? h.css("max-width", "100%") : h.css("max-width", f.innerWidth() - i.outerWidth(!0) + "px")
            }
            var e = b,
                f = $('<div class="tw-display"></div>'),
                g = $('<h2 class="section-title tw-title tw-td"></h2>'),
                h = $('<div class="tw-value"></div>'),
                i = $('<div class="tw-unit"></div>'),
                j = $('<div class="tw-sparkline tw-td"></div>');
            this.render = function(a) {
                $(a).empty(), $(f).append($('<div class="tw-tr"></div>').append(g)).append($('<div class="tw-tr"></div>').append($('<div class="tw-value-wrapper tw-td"></div>').append(h).append(i))).append($('<div class="tw-tr"></div>').append(j)), $(a).append(f), d()
            }, this.onSettingsChanged = function(a) {
                e = a;
                var b = !_.isUndefined(a.title) && "" != a.title,
                    c = !_.isUndefined(a.units) && "" != a.units;
                a.sparkline ? j.attr("style", null) : (delete j.data().values, j.empty(), j.hide()), b ? (g.html(_.isUndefined(a.title) ? "" : a.title), g.attr("style", null)) : (g.empty(), g.hide()), c ? (i.html(_.isUndefined(a.units) ? "" : a.units), i.attr("style", null)) : (i.empty(), i.hide());
                var f = 30;
                "big" == a.size && (f = 75, a.sparkline && (f = 60)), h.css({
                    "font-size": f + "px"
                }), d()
            }, this.onSizeChanged = function() {
                d()
            }, this.onCalculatedValueChanged = function(b, d) {
                "value" == b && (e.animate ? a(d, h, 500) : h.text(d), e.sparkline && c(j, d))
            }, this.onDispose = function() {}, this.getHeight = function() {
                return "big" == e.size || e.sparkline ? 2 : 1
            }, this.onSettingsChanged(b)
        };
        freeboard.loadWidgetPlugin({
            type_name: "text_widget",
            display_name: "Text",
            external_scripts: ["plugins/thirdparty/jquery.sparkline.min.js"],
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "size",
                display_name: "Size",
                type: "option",
                options: [{
                    name: "Regular",
                    value: "regular"
                }, {
                    name: "Big",
                    value: "big"
                }]
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated"
            }, {
                name: "sparkline",
                display_name: "Include Sparkline",
                type: "boolean"
            }, {
                name: "animate",
                display_name: "Animate Value Changes",
                type: "boolean",
                default_value: !0
            }, {
                name: "units",
                display_name: "Units",
                type: "text"
            }],
            newInstance: function(a, b) {
                b(new g(a))
            }
        });
        var h = 0;
        freeboard.addStyle(".gauge-widget-wrapper", "width: 100%;text-align: center;"), freeboard.addStyle(".gauge-widget", "width:200px;height:160px;display:inline-block;");
        var i = function(a) {
            function b() {
                g && (f.empty(), c = new JustGage({
                    id: d,
                    value: _.isUndefined(i.min_value) ? 0 : i.min_value,
                    min: _.isUndefined(i.min_value) ? 0 : i.min_value,
                    max: _.isUndefined(i.max_value) ? 0 : i.max_value,
                    label: i.units,
                    showInnerShadow: !1,
                    valueFontColor: "#fff"
                }))
            }
            var c, d = "gauge-" + h++,
                e = $('<h2 class="section-title"></h2>'),
                f = $('<div class="gauge-widget" id="' + d + '"></div>'),
                g = !1,
                i = a;
            this.render = function(a) {
                g = !0, $(a).append(e).append($('<div class="gauge-widget-wrapper"></div>').append(f)), b()
            }, this.onSettingsChanged = function(a) {
                a.min_value != i.min_value || a.max_value != i.max_value || a.units != i.units ? (i = a, b()) : i = a, e.html(a.title)
            }, this.onCalculatedValueChanged = function(a, b) {
                _.isUndefined(c) || c.refresh(Number(b))
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 3
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "gauge",
            display_name: "Gauge",
            external_scripts: ["plugins/thirdparty/raphael.2.1.0.min.js", "plugins/thirdparty/justgage.1.0.1.js"],
//            external_scripts: ["plugins/thirdparty/raphael.2.1.4.min.js", "plugins/thirdparty/justgage.1.2.2.js"],
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated"
            }, {
                name: "units",
                display_name: "Units",
                type: "text"
            }, {
                name: "min_value",
                display_name: "Minimum",
                type: "text",
                default_value: 0
            }, {
                name: "max_value",
                display_name: "Maximum",
                type: "text",
                default_value: 100
            }],
            newInstance: function(a, b) {
                b(new i(a))
            }
        }), freeboard.addStyle(".sparkline", "width:100%;height: 75px;");
        var j = function(a) {
            var d = $('<h2 class="section-title"></h2>'),
                e = $('<div class="sparkline"></div>'),
                f = $("<div></div>"),
                g = a;
            this.render = function(a) {
                $(a).append(d).append(e).append(f)
            }, this.onSettingsChanged = function(a) {
                g = a, d.html(_.isUndefined(a.title) ? "" : a.title), a.include_legend && b(f, a.legend.split(","))
            }, this.onCalculatedValueChanged = function(a, b) {
                g.legend ? c(e, b, g.legend.split(",")) : c(e, b)
            }, this.onDispose = function() {}, this.getHeight = function() {
                var a = 0;
                if (g.include_legend && g.legend) {
                    var b = g.legend.split(",").length;
                    b > 4 ? a = .5 * Math.floor((b - 1) / 4) : b && (a = .5)
                }
                return 2 + a
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "sparkline",
            display_name: "Sparkline",
            external_scripts: ["plugins/thirdparty/jquery.sparkline.min.js"],
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated",
                multi_input: "true"
            }, {
                name: "include_legend",
                display_name: "Include Legend",
                type: "boolean"
            }, {
                name: "legend",
                display_name: "Legend",
                type: "text",
                description: "Comma-separated for multiple sparklines"
            }],
            newInstance: function(a, b) {
                b(new j(a))
            }
        }), freeboard.addStyle("div.pointer-value", "position:absolute;height:95px;margin: auto;top: 0px;bottom: 0px;width: 100%;text-align:center;");
        var k = function(a) {
            function b(a) {
                if (!a || a.length < 2)
                    return [];
                var b = [];
                b.push(["m", a[0], a[1]]);
                for (var c = 2; c < a.length; c += 2)
                    b.push(["l", a[c], a[c + 1]]);
                return b.push(["z"]), b
            }
            var c, d, e, f, g = 3,
                h = 0,
                i = $('<div class="widget-big-text"></div>'),
                j = $("<div></div>");
            this.render = function(a) {
                e = $(a).width(), f = $(a).height();
                var h = Math.min(e, f) / 2 - 2 * g;
                c = Raphael($(a).get()[0], e, f);
                var k = c.circle(e / 2, f / 2, h);
                k.attr("stroke", "#FF9900"), k.attr("stroke-width", g), d = c.path(b([e / 2, f / 2 - h + g, 15, 20, -30, 0])), d.attr("stroke-width", 0), d.attr("fill", "#fff"), $(a).append($('<div class="pointer-value"></div>').append(i).append(j))
            }, this.onSettingsChanged = function(a) {
                j.html(a.units)
            }, this.onCalculatedValueChanged = function(a, b) {
                if ("direction" == a) {
                    if (!_.isUndefined(d)) {
                        d.animate({
                            transform: "r" + b + "," + e / 2 + "," + f / 2
                        }, 250, "bounce")
                    }
                    h = b
                } else "value_text" == a && i.html(b)
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 4
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "pointer",
            display_name: "Pointer",
            external_scripts: ["plugins/thirdparty/raphael.2.1.0.min.js"],
            settings: [{
                name: "direction",
                display_name: "Direction",
                type: "calculated",
                description: "In degrees"
            }, {
                name: "value_text",
                display_name: "Value Text",
                type: "calculated"
            }, {
                name: "units",
                display_name: "Units",
                type: "text"
            }],
            newInstance: function(a, b) {
                b(new k(a))
            }
        });
        var l = function(a) {
            function b() {
                e && (clearInterval(e), e = null)
            }

            function c() {
                if (d && f) {
                    var a = f + (-1 == f.indexOf("?") ? "?" : "&") + Date.now();
                    $(d).css({
                        "background-image": "url(" + a + ")"
                    })
                }
            }
            var d, e, f;
            this.render = function(a) {
                $(a).css({
                    width: "100%",
                    height: "100%",
                    "background-size": "cover",
                    "background-position": "center"
                }), d = a
            }, this.onSettingsChanged = function(a) {
                b(), a.refresh && a.refresh > 0 && (e = setInterval(c, 1e3 * Number(a.refresh)))
            }, this.onCalculatedValueChanged = function(a, b) {
                "src" == a && (f = b), c()
            }, this.onDispose = function() {
                b()
            }, this.getHeight = function() {
                return 4
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "picture",
            display_name: "Picture",
            fill_size: !0,
            settings: [{
                name: "src",
                display_name: "Image URL",
                type: "calculated"
            }, {
                type: "number",
                display_name: "Refresh every",
                name: "refresh",
                suffix: "seconds",
                description: "Leave blank if the image doesn't need to be refreshed"
            }],
            newInstance: function(a, b) {
                b(new l(a))
            }
        }), freeboard.addStyle(".indicator-light", "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;"), freeboard.addStyle(".indicator-light.on", "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;"), freeboard.addStyle(".indicator-text", "margin-top:10px;");
        var m = function(a) {
            function b() {
                g.toggleClass("on", i), i ? f.text(_.isUndefined(c) ? _.isUndefined(h.on_text) ? "" : h.on_text : c) : f.text(_.isUndefined(d) ? _.isUndefined(h.off_text) ? "" : h.off_text : d)
            }
            var c, d, e = $('<h2 class="section-title"></h2>'),
                f = $('<div class="indicator-text"></div>'),
                g = $('<div class="indicator-light"></div>'),
                h = a,
                i = !1;
            this.render = function(a) {
                $(a).append(e).append(g).append(f)
            }, this.onSettingsChanged = function(a) {
                h = a, e.html(_.isUndefined(a.title) ? "" : a.title), b()
            }, this.onCalculatedValueChanged = function(a, e) {
                "value" == a && (i = Boolean(e)), "on_text" == a && (c = e), "off_text" == a && (d = e), b()
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 1
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "indicator",
            display_name: "Indicator Light",
            settings: [{
                name: "title",
                display_name: "Title",
                type: "text"
            }, {
                name: "value",
                display_name: "Value",
                type: "calculated"
            }, {
                name: "on_text",
                display_name: "On Text",
                type: "calculated"
            }, {
                name: "off_text",
                display_name: "Off Text",
                type: "calculated"
            }],
            newInstance: function(a, b) {
                b(new m(a))
            }
        }), freeboard.addStyle(".gm-style-cc a", "text-shadow:none;");
        var n = function(a) {
            function b() {
                if (c && d && f.lat && f.lon) {
                    var a = new google.maps.LatLng(f.lat, f.lon);
                    d.setPosition(a), c.panTo(a)
                }
            }
            var c, d, e = a,
                f = {};
            this.render = function(a) {
                function e() {
                    var e = {
                        zoom: 13,
                        center: new google.maps.LatLng(37.235, -115.811111),
                        disableDefaultUI: !0,
                        draggable: !1,
                        styles: [{
                            featureType: "water",
                            elementType: "geometry",
                            stylers: [{
                                color: "#2a2a2a"
                            }]
                        }, {
                            featureType: "landscape",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 20
                            }]
                        }, {
                            featureType: "road.highway",
                            elementType: "geometry.fill",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 17
                            }]
                        }, {
                            featureType: "road.highway",
                            elementType: "geometry.stroke",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 29
                            }, {
                                weight: .2
                            }]
                        }, {
                            featureType: "road.arterial",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 18
                            }]
                        }, {
                            featureType: "road.local",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 16
                            }]
                        }, {
                            featureType: "poi",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 21
                            }]
                        }, {
                            elementType: "labels.text.stroke",
                            stylers: [{
                                visibility: "on"
                            }, {
                                color: "#000000"
                            }, {
                                lightness: 16
                            }]
                        }, {
                            elementType: "labels.text.fill",
                            stylers: [{
                                saturation: 36
                            }, {
                                color: "#000000"
                            }, {
                                lightness: 40
                            }]
                        }, {
                            elementType: "labels.icon",
                            stylers: [{
                                visibility: "off"
                            }]
                        }, {
                            featureType: "transit",
                            elementType: "geometry",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 19
                            }]
                        }, {
                            featureType: "administrative",
                            elementType: "geometry.fill",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 20
                            }]
                        }, {
                            featureType: "administrative",
                            elementType: "geometry.stroke",
                            stylers: [{
                                color: "#000000"
                            }, {
                                lightness: 17
                            }, {
                                weight: 1.2
                            }]
                        }]
                    };
                    c = new google.maps.Map(a, e), google.maps.event.addDomListener(a, "mouseenter", function(a) {
                        a.cancelBubble = !0, c.hover || (c.hover = !0, c.setOptions({
                            zoomControl: !0
                        }))
                    }), google.maps.event.addDomListener(a, "mouseleave", function(a) {
                        c.hover && (c.setOptions({
                            zoomControl: !1
                        }), c.hover = !1)
                    }), d = new google.maps.Marker({
                        map: c
                    }), b()
                }
                window.google && window.google.maps ? e() : (window.gmap_initialize = e, head.js("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmap_initialize"))
            }, this.onSettingsChanged = function(a) {
                e = a
            }, this.onCalculatedValueChanged = function(a, c) {
                "lat" == a ? f.lat = c : "lon" == a && (f.lon = c), b()
            }, this.onDispose = function() {}, this.getHeight = function() {
                return 4
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "google_map",
            display_name: "Google Map",
            fill_size: !0,
            settings: [{
                name: "lat",
                display_name: "Latitude",
                type: "calculated"
            }, {
                name: "lon",
                display_name: "Longitude",
                type: "calculated"
            }],
            newInstance: function(a, b) {
                b(new n(a))
            }
        }), freeboard.addStyle(".html-widget", "white-space:normal;width:100%;height:100%");
        var o = function(a) {
            var b = $('<div class="html-widget"></div>'),
                c = a;
            this.render = function(a) {
                $(a).append(b)
            }, this.onSettingsChanged = function(a) {
                c = a
            }, this.onCalculatedValueChanged = function(a, c) {
                "html" == a && b.html(c)
            }, this.onDispose = function() {}, this.getHeight = function() {
                return Number(c.height)
            }, this.onSettingsChanged(a)
        };
        freeboard.loadWidgetPlugin({
            type_name: "html",
            display_name: "HTML",
            fill_size: !0,
            settings: [{
                name: "html",
                display_name: "HTML",
                type: "calculated",
                description: "Can be literal HTML, or javascript that outputs HTML."
            }, {
                name: "height",
                display_name: "Height Blocks",
                type: "number",
                default_value: 4,
                description: "A height block is around 60 pixels"
            }],
            newInstance: function(a, b) {
                b(new o(a))
            }
        })
    }
    ();
