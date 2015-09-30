/// <reference path="jquery.d.ts" />
"use strict";
//
// Intefaces
//
interface uxEvent{
    type: string;
    element?: Object;
    data?: any;
    date: any;
    parent: Object;
}



//
//    mouseBinds Module
//    Exports Contents
//    Tracks mouse events
//
module mouseBinds {



    //
    //    Mouse Line Tracker
    //    Exported Class
    //    Draws line on any mouse movement
    //
    export class mouseLineTracker{
        ctx: CanvasRenderingContext2D;
        path =  [];
        debug: boolean;
        constructor(debugDraw){
            this.debug = debugDraw;
            $(document).mousemove((e)=>{
                this.listener(e);
            })
            if(debugDraw){
                this.hookCanvas();
            }
        }
        listener = (e) => {
            if(this.debug){
                this.updateCanvas(e.pageX, e.pageY);
            }
        }
        hookCanvas = () => {
            var canvas = new debugCanvas("mouseLineTracker");
            this.ctx = canvas.getContext();
        }
        updateCanvas = (x,y) => {
            var currentPath = {x:x,y:y}
            this.path.push(currentPath);
            setTimeout(() => {
                this.ctx.clearRect(0, 0, 3000, 3000);
                for (var x = 0; x < this.path.length; x++){
                    if(x == 0){
                        this.ctx.fillRect(this.path[x].x, this.path[x].y, 1, 1)
                    }else{
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.path[(x-1)].x, this.path[(x-1)].y);
                        this.ctx.lineTo(this.path[x].x, this.path[x].y);
                        this.ctx.stroke();
                    }
                }
            },0);
        }
    }




    //
    //    Click Tracker
    //    Exported Class
    //    Draws dot on any click
    //
    export class clickTracker{
        ctx: CanvasRenderingContext2D;
        debug: boolean;
        constructor(debugDraw){
            this.debug = debugDraw;
            $(document).click((e) => {
                this.listener(e);
            });
            if(debugDraw){
                this.hookCanvas();
            }
        }
        listener = (e) => {
            if(this.debug){
                this.updateCanvas(e.pageX, e.pageY);
            }
        }
        hookCanvas = () => {
            var canvas = new debugCanvas("clickTracker");
            this.ctx = canvas.getContext();
        }
        updateCanvas = (x,y) => {
            this.ctx.fillRect(x,y,8,8);
        }
    }
}


//
//    formBinds Module
//    Exports Contents
//    Tracks form events
//
module formBinds{
    //
    //    timeTracker
    //    Exported Class
    //    Calculates form html element changes based on time
    //    * Requires Callback *
    //
    export class timeTracker{
        elements: Object;
        cb: Function;
        events = [];
        trackData = [];
        constructor(elements,cb){
            this.elements = elements;
            this.cb = cb;
            this.addEvents();
        }
        addEvents = () => {
            var self = this;
            $(this.elements).each(function(){
                self.trackData.push({ form: this.name, object:this, inputs:[] });
                var parent = this;
                $(this).mouseenter(function(){
                    self.trackEvents(<uxEvent> { type: "enter", element: this,parent:this,date:Date.now()});
                });
                $(this).children("input").focus(function(){
                    self.trackEvents(<uxEvent> { type: "focus", element: this,parent:parent,date:Date.now()});
                });
                $(this).children("input").focusout(function(){
                    self.trackEvents(<uxEvent> { type: "focusout", element: this,parent:parent,date:Date.now()});
                });
                $(this).mouseleave(function(){
                    self.trackEvents(<uxEvent> { type: "mouseout", element: this,parent:this,date:Date.now()});
                });
            });
        }

        trackEvents = (event:uxEvent) => {
            var previousEvents = this.getEventsByObject(event.parent);
            switch(event.type){
                case "enter":
                    if (previousEvents.length < 1){
                        this.events.push(event);
                    }else{
                        this.events.push(event);
                    }
                break;
                case "focus":
                    if (previousEvents[previousEvents.length-1].type == "enter"){
                        this.events.push(event);
                        this.trackData[this.getTrackDataByObject(event.parent)].startTime = previousEvents[previousEvents.length-1].date;
                        this.trackData[this.getTrackDataByObject(event.parent)].inputs.push({name:$(event.element).attr("name"),started:Date.now()})
                        this.cb({type:"formfocus",date:previousEvents[previousEvents.length-1].date,object:this.trackData[this.getTrackDataByObject(event.parent)].object},this.trackData[this.getTrackDataByObject(event.parent)]);
                        this.cb({type:"focusinput",date:Date.now(),name:previousEvents[previousEvents.length-1].element.name,object:event.parent,element:event.element},this.trackData[this.getTrackDataByObject(event.parent)]);
                    }
                break;
            }
        }

        getEventsByObject = function(object){
            var objectEventList = [];
            for (var x = 0; x < this.events.length; x++){
                if(this.events[x].parent == object){
                    objectEventList.push(this.events[x]);
                }
            }
            return objectEventList;
        }

        getTrackDataByObject = function(object){
            for (var x = 0; x < this.trackData.length; x++){
                if(this.trackData[x].object == object){
                    return x;
                }
            }
        }

    }
}

//
//    uxtrack
//    Class
//    Loader Class connected to jQuery fn.
//
class uxtrack{
    settings = {
        mouseLineTracker : false,
        clickTracker : false,
        debugDraw: false,
        eyeTracker: false,
        formTracker: false
    };
    elements = this;

    constructor(settings) {
        $.extend(this.settings,settings)
        this.loader()
        return this
    }

    loader = () => {
        this.settings.mouseLineTracker ? new mouseBinds.mouseLineTracker(this.settings.debugDraw) : false ;
        this.settings.clickTracker ? new mouseBinds.clickTracker(this.settings.debugDraw) : false ;
        this.settings.formTracker ? new formBinds.timeTracker(this.elements,this.settings.formTracker) : false ;
    }
}


//
//    debugCanvas
//    Class
//    Creates and hooks up new canvas for debug drawing
//
class debugCanvas{
    canvasAp: HTMLCanvasElement;
    constructor(id){
        var canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        canvas.style.position = "absolute";
        canvas.style.top = "0px"
        canvas.style.left = "0px";
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(canvas);
        this.canvasAp = <HTMLCanvasElement> document.getElementById(id);
        var ctx = this.canvasAp.getContext("2d");
    }
    getContext = () => {
        return this.canvasAp.getContext("2d");
    }
    getWidth = () => {
        return this.canvasAp.width;
    }
    getHeight = () => {
        return this.canvasAp.height;
    }
}

class editMode{
    selected:boolean = false
    constructor(){
        alert("Edit mode enabled, click on elements to add them tracker.")
        $(document).click((event)=>{
            this.select(event)
        });
        $(document).mouseover((event)=>{
            if (!this.selected){
                $(event.target).css("background-color", "lightGreen");
            }
        });
        $(document).mouseout((event)=>{
            if (!this.selected) {
                $(event.target).css("background-color", "");
            }
        });
    }

    select = (event) => {
        $(".selected").css("background-color","")
        $(".selected").removeClass("selected");
        $(event.target).addClass("selected");
        $(".selected").css("background-color","green")
        this.selected = true;
    }
}

//
//    Anonymous Function - Self Invoker
//    Function
//    Registers the plugin to jQuery
//

var script = document.createElement('script');
script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

(($) => {
    $.fn.uxtrack = uxtrack;    
    //new editMode();
    var TRACKING_CODE = false;
    var prePath = false;
		var trackerSocket = new WebSocket("ws://localhost:8080/");
		trackerSocket.onopen = (event) => {
			trackerSocket.send(JSON.stringify({ type: "clientNewSession", path: window.location.pathname, prePath:prePath ,id: TRACKING_CODE }));
		}
		trackerSocket.onmessage = (msg) => {
			switch (msg.data) {
				case "editMode":
					  new editMode();
					break;
			}
    }
})(jQuery);
