var express = require('express');
var webshot = require('webshot');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var mongoConnectLink = require("../config.js").dbLink;
var jwtKey = require("../config.js").jwtKey;
var fs = require("fs");
var ws = require('ws');
var db = mongoose.connect("mongodb://zikenzie:12332144@ds023603.mlab.com:23603/uxtracker");

mongoose.connection.on('open', function () {
	/*
	mongoose.connection.db.dropDatabase(function (err) {
			console.log("db clear");
	});
	*/
})

/* Mongoose Models */
var User = require("../models/user.js");
var Site = require("../models/sites.js");

var router = express.Router();




router.post("/", function (req, res, next) {
	var token = req.body.token;
	jwt.verify(token, jwtKey, function (err, decoded) {
		res.json(decoded);
	});
});

router.post("/getSitesSideBar", function (req, res, next) {
	var token = req.body.token;
	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.find({ owner: decoded.user._id,activated:true }, function (err2, siteList) {
				if(!err2){
					var resList = [];
					siteList.forEach(function (site) {
						resList.push({ title: site.title, id:site._id, settings:site.settings})
					});
					res.json(resList);
				}
			})
		}
	});
});

router.post("/enableAdvanced", function (req, res, next) {
	var token = req.body.token;
	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.find({ owner: decoded.user._id,activated:true }, function (err2, siteList) {
				if(!err2){
					Site.findOne({ _id: req.body.id }, function (err, site) {
						if(site){
							site.settings.advancedMode = req.body.set;
							site.markModified('settings');
							site.save(function(err2,siteSaved){
								res.json({type:"modeUpdate", message:siteSaved.settings.advancedMode});
							});
						}
					});
				}
			})
		}
	});
});

router.post("/heartbeat", function (req, res, next) {
	var token = req.body.token;

	jwt.verify(token, jwtKey, function (err, decoded) {
		if (err) {
			res.json({ type: "dead", message: "Token error" });
			return false;
		}
		if (!decoded) {
			res.json({ type: "dead", message: "Token decoding error" });
			return false;
		}
		if (decoded.removeTime < Date.now()) {
			res.json({ type: "dead", message: "Token expire error" });
			return false;
		} else {
			if (req.session.user) {
				if (req.session.user.token) {
					var updateToken = jwt.sign({
						user: decoded.user,
						removeTime: Date.now() + 1000 * 300 * 1
					}, jwtKey, {
						expiresIn: 300 // expires in 5 minutes
					});
					req.session.user.token = updateToken;
					res.json({ type: "bip", token: updateToken });
					return true;
				} else {
					res.json({ type: "dead", message: "Token Session error" });
					return false;
				}
			} else {
				res.json({ type: "dead", message: "Session error" });
				return false;
			}
		}
	});
});

router.post('/login', function (req, res, next) {
	User.findOne({ username: req.body.username }, function (err, user) {
		if (user) {
			user.comparePassword(req.body.password, function (err, passTrue) {
				if (passTrue) {
					var token = jwt.sign({
						user: user,
						removeTime: Date.now() + 1000 * 300 * 1
					}, jwtKey, {
						expiresIn: 300 // expires in 5 minutes
					});
					res.json({ type: "auth", token: token });
				} else {
					res.json({ type: "err", message: "Login failed, check your user details" });
				}
			});
		} else {
			res.json({ type: "err", message: "User not found" });
		}
	})
});

router.post("/update", function(req,res,next){
	Site.findOne({ uniqueKey: req.body.id }, function (err, site) {
		if (!err) {
			var update = JSON.parse(req.body.update);
	 	 	if(!site.update["clickTracks"]){
	 	 		site.update["clickTracks"] = [];
	 	 	}

 	 		for(var x = 0; x < update.clickTracks.length; x++){
 	 			site.update["clickTracks"].push(update.clickTracks[x]);
 	 		}

 	 		if(!site.update["mouseLines"]){
	 	 		site.update["mouseLines"] = [];
	 	 	}

 	 		for(var x = 0; x < update.mouseLines.length; x++){
 	 			site.update["mouseLines"].push(update.mouseLines[x]);
 	 			console.log(update.mouseLines[x])
 	 		}

 	 		if(!site.update["formEvents"]){
	 	 		site.update["formEvents"] = [];
	 	 	}

 	 		for(var x = 0; x < update.formEvents.length; x++){
 	 			site.update["formEvents"].push(update.formEvents[x]);
 	 		}


 	 		site.markModified("update");
 	 		site.save();
		}
	})
	res.end("Done");
});

router.post("/requestSnap", function(req,res,next){
	var token = req.body.token;

	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.findOne({ _id: req.body.id }, function (err, site) {
				var options = {
					windowSize:{ 
						width: 1920,
				 		height: 1080 
				 	},
				 	quality:100
				}
				var newFileName = site.domain.replace(/\./g,"")+Math.floor(Math.random()*1000)+'.png';
				webshot(site.domain, 'public/snapList/' + newFileName, options ,function(err) {
				  	res.end('snapList/' + newFileName);
				});
			});
		}
	});
});

router.post("/requestSnapSelector", function(req,res,next){
	var token = req.body.token;
	var selector = req.body.selector;
	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.findOne({ _id: req.body.id }, function (err, site) {
				var options = {
					windowSize:{ 
						width: 1920,
				 		height: 1080 
				 	},
				 	quality:100
				}
				var newFileName = site.domain.replace(/\./g,"")+Math.floor(Math.random()*1000)+'.png';
				webshot(site.domain, 'public/snapList/' + newFileName, options ,function(err) {
				  	res.end('snapList/' + newFileName);
				});
			});
		}
	});
});

router.post("/getUpdates", function(req,res,next){
	var token = req.body.token;

	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.findOne({ _id: req.body.id }, function (err, site) {
				res.json(site.update);
			});
		}
	});
});

router.post('/register', function (req, res, next) {
	var name = req.body.name ? req.body.name : null;
	var username = req.body.username ? req.body.username : null;
	var password = req.body.password ? req.body.password : null;
	var email = req.body.email ? req.body.email : null;
	var location = req.body.location ? req.body.location : null;

	var newUser = new User({ username: username, password: password, email: email, location: location, name: name });
	newUser.save(function (err, s) {
		if (!err) {
			res.json({ type: "regdone", message: "Registration successfully done" });
		} else {
			res.json({ type: "regfail", message: err.message });
		}
	});
});

router.post("/getWebsite", function (req, res, next) {
	var token = req.body.token;

	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.findOne({ _id: req.body.id }, function (err, site) {
				if (!err) {
			 	 	res.json({ type: "siteSettingsDetail", site: { title: site.title, id: site.id, settings: site.settings, uniqueKey: site.uniqueKey } });
				} else {
					res.json({ type: "err", message:err.message});
				}
			})
		}
	});
});

router.post("/saveSettings", function (req, res, next) {
	var token = req.body.token;

	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.findOne({ _id: req.body.id }, function (err, site) {
				var newSettings = JSON.parse(req.body.settings);
				for (var attrname in newSettings) { 
					if(newSettings[attrname] == null){
						site.settings[attrname] = false; 
					}else{
						site.settings[attrname] = newSettings[attrname]; 
					}
				};
				site.markModified("settings");
				site.save();
				res.end();
			});
		}
	});
});

router.post("/editFilters", function(req,res,next){
	var token = req.body.token;

	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			Site.findOne({ _id: req.body.id }, function (err, site) {
				site.settings.filters = req.body.filters;
				site.markModified("settings");
				site.save();
				res.end();
			});
		}
	});
});

router.post("/addNewSiteCode", function (req, res, next) {
	var token = req.body.token;

	jwt.verify(token, jwtKey, function (err, decoded) {
		if (decoded) {
			var newSite = new Site({
				title: req.body.title,
				domain: req.body.domain,
				owner: decoded.user._id,
				uniqueKey: "key"
			});
			newSite.save(function (err, saved) {
				if (err) {
					res.json({ type: "err", message: err.message });
				} else {
					res.json({ type: "addNewSiteCode", code: saved.uniqueKey })
				}
			})
		}
	});
});

router.get("/tracker/:key", function (req, res, next) {
	if (req.params.key) {
		Site.findOne({ uniqueKey: req.params.key }, function (err, site) {
			if (err) {
				res.end("console.die('Tracking code error')")
			} else {
				if(!site.activated){
					fs.readFile(__dirname + "/../tracker/addChecker.js", 'utf8',function (err,data) {
						if (!err) {
							res.end(data.replace("TRACKING_CODE = false;", "TRACKING_CODE = '" + req.params.key + "';"))
						} else {
							res.end("console.die('Tracking code error')")
						}
					})
				} else {
					fs.readFile(__dirname + "/../tracker/tracker.js", 'utf8', function (err, data) {
						if (!err) {
							res.end(data.replace("TRACKING_CODE = false;", "TRACKING_CODE='" + req.params.key + "';"))
						} else {
							res.end("console.die('Tracking code error')")
						}
					})
				}
			}
		});
	}
});

router.get('/givePack/:id/:pack', function(req,res,next){
    User.findOne({ _id: req.params.id }, function (err, user) {
		if (user) {
			user.upgraded = Number(req.params.pack);
			req.session.user.upgraded = Number(req.params.pack);
			user.save(function(){
				res.redirect("/Client");
			});
		}else{
			res.end("No id found");
		}
	});
});

/* Websocket Part */
var WebSocketServer = ws.Server
console.log("Creating socket...")
var wss = new WebSocketServer({ server: serverwss });
var wsId = 1;
var webSockets = [];
var signalWaiters = [];

wss.on('connection', function (ws) {
	ws.localId = wsId++;
	webSockets[ws.localId] = ws;
  ws.on('message', function (message) {
		if (IsJsonString(message)){
			var data = JSON.parse(message);

			switch (data.type) {

				case "registerSite":
					if (data.id) {
						if (signalWaiters[data.id]) {
							//Check domain here before release!
							signalWaiters[data.id].send(JSON.stringify({ type: "signalDone" }));
							delete signalWaiters[data.id];
							Site.findOne({ uniqueKey: data.id }, function (err, site) {
								site.activated = true;
								site.save();
							});
						}
					}		
					break;
				case "waitSiteSignal":
					signalWaiters[data.id] = ws;
					break;
			  	case "clientNewSession":
				    webSockets[ws.localId].trackKey = data.id;
				    webSockets[ws.localId].path = data.path;
				    if (data.prePath !== false) {
	            
				    }
			    break;
			  	case "requestLiveStats":
			    	ws.send(JSON.stringify({ type: "liveCount", count: webSockets.getByTrackId(data.id).length, pathList: webSockets.getPathList(data.id) }));
			    break;
			    case "enableEditMode":
			    	var target = webSockets.getByIpAddress(data.id,ws);
			    	ws.advancedKey = data.id;
			    	if(target){
			    		target.send("editMode");
			    	}
			    break;
			    case "transformDone":
			    	var target = webSockets.getByAdvancedTrackId(data.id);
			    	if(target){
			    		target.send(message);
			    	}
			    break;
			    case "addTrackerFilter":
			    	var target = webSockets.getByAdvancedTrackId(data.id);
			    	if(target){
			    		target.send(message);
			    	}
			    break;
			}
		}
	});
	ws.on('close', function close() {
		delete webSockets[ws.localId];
		//
		//
	});
});

Array.prototype.getPathList = function (id) {
  var res = [];
  for (var socket in this) {
    if (typeof this[socket] != "function") {
      if (typeof this[socket].path != "undefined" && typeof this[socket].trackKey != "undefined" && this[socket].trackKey == id) {
        var preventDup = false;
        for (var x = 0; x < res.length; x++) {
          if (res[x].label == this[socket].path) {
            preventDup = true;
            res[x].data++;
          }
        }
        if (!preventDup) {
          res.push({ label: this[socket].path, data: 1 });
        }
      }
    }
  }
  res.sort(function (a, b) {
    if (a.data < b.data) {
      return 1;
    }
    if (a.data > b.data) {
      return -1;
    }
    return 0;
  });
  while (res.length > 10) {
    res.pop()
  }
  return res;
}

Array.prototype.getByAdvancedTrackId = function (id) {
  	for (var socket in this) {
	  	if (typeof this[socket].advancedKey != "undefined"){
	        if (this[socket].advancedKey == id) {
	          	return this[socket];
	        }
	    }
  	}
  	return false;
}

Array.prototype.getByTrackId = function (id) {
  var res = [];
  for (var socket in this) {
    if(typeof this[socket] != "function"){
      if(typeof this[socket].trackKey != "undefined"){
        if (this[socket].trackKey == id) {
          res.push(socket);
        }
      }
    }
  }
  return res;
}

Array.prototype.getByIpAddress = function (id,self) {
  for (var socket in this) {
    if(typeof this[socket] != "function"){
      if(typeof this[socket].trackKey != "undefined"){
        if (this[socket].trackKey == id && this[socket].remoteAddress == self.remoteAddress) {
          return this[socket];
        }
      }
    }
  }
  return false;
}

function IsJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

module.exports = router;