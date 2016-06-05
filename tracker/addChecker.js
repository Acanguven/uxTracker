"use strict";
var TRACKING_CODE = false;

(function () {
	var trackerSocket = new WebSocket("ws://uxtracker.herokuapp.com:8080/");
	trackerSocket.onopen = function (event) {
		trackerSocket.send(JSON.stringify({ type: "registerSite", domain: window.location.host, id: TRACKING_CODE }));
	}
}());