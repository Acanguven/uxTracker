/// <reference path="jquery.d.ts" />
"use strict";
//
//    mouseBinds Module
//    Exports Contents
//    Tracks mouse events
//
var mouseBinds;
(function (mouseBinds) {
    //
    //    Mouse Line Tracker
    //    Exported Class
    //    Draws line on any mouse movement
    //
    var mouseLineTracker = (function () {
        function mouseLineTracker(debugDraw,cb) {
            var _this = this;
            this.path = [];
            this.listener = function (e) {
                if (_this.debug) {
                    _this.updateCanvas(e.pageX, e.pageY);
                }
                var currentPath = { x: e.pageX, y: e.pageY ,width:window.innerWidth, height:window.innerHeight};
                cb(currentPath);
            };
            this.hookCanvas = function () {
                var canvas = new debugCanvas("mouseLineTracker");
                _this.ctx = canvas.getContext();
            };
            this.updateCanvas = function (x, y) {
                
                
                _this.path.push(currentPath);
                setTimeout(function () {
                    _this.ctx.clearRect(0, 0, 3000, 3000);
                    for (var x = 0; x < _this.path.length; x++) {
                        if (x == 0) {
                            _this.ctx.fillRect(_this.path[x].x, _this.path[x].y, 1, 1);
                        }
                        else {
                            _this.ctx.beginPath();
                            _this.ctx.moveTo(_this.path[(x - 1)].x, _this.path[(x - 1)].y);
                            _this.ctx.lineTo(_this.path[x].x, _this.path[x].y);
                            _this.ctx.stroke();
                        }
                    }
                }, 0);
            };
            this.debug = debugDraw;
            $(document).mousemove(function (e) {
                _this.listener(e);
            });
            if (debugDraw) {
                this.hookCanvas();
            }
        }
        return mouseLineTracker;
    })();
    mouseBinds.mouseLineTracker = mouseLineTracker;
    //
    //    Click Tracker
    //    Exported Class
    //    Draws dot on any click
    //
    var clickTracker = (function () {
        function clickTracker(debugDraw,cb) {
            var _this = this;
            this.listener = function (e) {
                if (_this.debug) {
                    _this.updateCanvas(e.pageX, e.pageY);
                }
                var currentPath = { x: e.pageX, y: e.pageY ,width:window.innerWidth, height:window.innerHeight};
                cb(currentPath)
            };
            this.hookCanvas = function () {
                var canvas = new debugCanvas("clickTracker");
                _this.ctx = canvas.getContext();
            };
            this.updateCanvas = function (x, y) {
                _this.ctx.fillRect(x, y, 8, 8);
            };
            this.debug = debugDraw;
            $(document).click(function (e) {
                _this.listener(e);
            });
            if (debugDraw) {
                this.hookCanvas();
            }
        }
        return clickTracker;
    })();
    mouseBinds.clickTracker = clickTracker;
})(mouseBinds || (mouseBinds = {}));
//
//    formBinds Module
//    Exports Contents
//    Tracks form events
//
var formBinds;
(function (formBinds) {
    //
    //    timeTracker
    //    Exported Class
    //    Calculates form html element changes based on time
    //    * Requires Callback *
    //
    var timeTracker = (function () {
        function timeTracker(elements, cb) {
            var _this = this;
            this.events = [];
            this.trackData = [];
            this.addEvents = function () {
                var self = _this;
                $(_this.elements).each(function () {
                    self.trackData.push({ form: this.name, object: this, inputs: [] });
                    var parent = this;
                    $(this).mouseenter(function () {
                        self.trackEvents({ type: "enter", element: this, parent: this, date: Date.now() });
                    });
                    $(this).children("input").focus(function () {
                        self.trackEvents({ type: "focus", element: this, parent: parent, date: Date.now() });
                    });
                    $(this).children("input").focusout(function () {
                        self.trackEvents({ type: "focusout", element: this, parent: parent, date: Date.now() });
                    });
                    $(this).mouseleave(function () {
                        self.trackEvents({ type: "mouseout", element: this, parent: this, date: Date.now() });
                    });
                });
            };
            this.trackEvents = function (event) {
                var previousEvents = _this.getEventsByObject(event.parent);
                switch (event.type) {
                    case "enter":
                        if (previousEvents.length < 1) {
                            _this.events.push(event);
                        }
                        else {
                            _this.events.push(event);
                        }
                        break;
                    case "focus":
                        if (previousEvents[previousEvents.length - 1].type == "enter") {
                            _this.events.push(event);
                            _this.trackData[_this.getTrackDataByObject(event.parent)].startTime = previousEvents[previousEvents.length - 1].date;
                            _this.trackData[_this.getTrackDataByObject(event.parent)].inputs.push({ name: $(event.element).attr("name"), started: Date.now() });
                        }
                        break;
                    case "focusout":
                            _this.events.push(event);
                        break;
                    case "mouseout":
                            _this.events.push(event);
                        break;
                }
                _this.cb(_this.events);
            };
            this.getEventsByObject = function (object) {
                var objectEventList = [];
                for (var x = 0; x < this.events.length; x++) {
                    if (this.events[x].parent == object) {
                        objectEventList.push(this.events[x]);
                    }
                }
                return objectEventList;
            };
            this.getTrackDataByObject = function (object) {
                for (var x = 0; x < this.trackData.length; x++) {
                    if (this.trackData[x].object == object) {
                        return x;
                    }
                }
            };
            this.elements = elements;
            this.cb = cb;
            this.addEvents();
        }
        return timeTracker;
    })();
    formBinds.timeTracker = timeTracker;
})(formBinds || (formBinds = {}));
//
//    uxtrack
//    Class
//    Loader Class connected to jQuery fn.
//
var uxtrack = (function () {
    function uxtrack(settings) {
        var _this = this;
        this.settings = {
            mouseLineTracker: false,
            clickTracker: false,
            debugDraw: false,
            eyeTracker: false,
            formTracker: false
        };
        this.elements = this;
        this.loader = function () {
            _this.settings.mouseLineTracker ? new mouseBinds.mouseLineTracker(_this.settings.debugDraw,_this.settings.mouseLineTracker) : false;
            _this.settings.clickTracker ? new mouseBinds.clickTracker(_this.settings.debugDraw,_this.settings.clickTracker) : false;
            _this.settings.formTracker ? new formBinds.timeTracker(_this.elements, _this.settings.formTracker) : false;
        };
        $.extend(this.settings, settings);
        this.loader();
        return this;
    }
    return uxtrack;
})();
//
//    debugCanvas
//    Class
//    Creates and hooks up new canvas for debug drawing
//
var debugCanvas = (function () {
    function debugCanvas(id) {
        var _this = this;
        this.getContext = function () {
            return _this.canvasAp.getContext("2d");
        };
        this.getWidth = function () {
            return _this.canvasAp.width;
        };
        this.getHeight = function () {
            return _this.canvasAp.height;
        };
        var canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = "absolute";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(canvas);
        this.canvasAp = document.getElementById(id);
        var ctx = this.canvasAp.getContext("2d");
    }
    return debugCanvas;
})();
var editMode = (function () {
    function editMode() {
        var _this = this;
        this.selected = false;
        this.select = function (event) {
            $(".selected").css("background-color", "");
            $(".selected").removeClass("selected");
            $(event.target).addClass("selected");
            $(".selected").css("background-color", "green");
            _this.selected = true;
        };
        alert("Edit mode enabled, click on elements to add them tracker.");
        $(document).click(function (event) {
            _this.select(event);
        });
        $(document).mouseover(function (event) {
            if (!_this.selected) {
                $(event.target).css("background-color", "lightGreen");
            }
        });
        $(document).mouseout(function (event) {
            if (!_this.selected) {
                $(event.target).css("background-color", "");
            }
        });
    }
    return editMode;
})();
//
//    Anonymous Function - Self Invoker
//    Function
//    Registers the plugin to jQuery
//
var script = document.createElement('script');
script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);
(function ($) {
    $.fn.uxtrack = uxtrack;
    var TRACKING_CODE = false;
    var trackerSocket = new WebSocket("ws://localhost:8080/");

    trackerSocket.onopen = function (event) {
        trackerSocket.send(JSON.stringify({ type: "clientNewSession", path: window.location.pathname, id: TRACKING_CODE }));
    };

    trackerSocket.onmessage = function (msg) {
        switch (msg.data) {
            case "editMode":
                new editMode();
                break;
        }
    };

    var postData = {};
    var formEvents = [];
    var mouseLines = [];
    var clickTracks = [];


    $(document).ready(function(){
        $("body").uxtrack({
            mouseLineTracker: function(c){
                mouseLines.push(c);
            },
            clickTracker: function(c){
                clickTracks.push(c);
            },
            debugDraw: false,
            eyeTracker: true,
        });

        $("form").uxtrack({
            formTracker: function(c){
                formEvents = c;
            },
        });
    

        window.onbeforeunload = function (e) {
            postData.formEvents = formEvents;
            postData.mouseLines = mouseLines;
            postData.clickTracks = clickTracks;

            $.post("http://localhost:44/api/update",{update:JSON.stringify(postData),id:TRACKING_CODE});

            for (var i=0;i<100000;i++){
              console.log(Math.random(0,1)); 
            };
        };
    });

})(jQuery);