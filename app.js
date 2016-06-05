var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var session = require('express-session');
var config = require("./config.js");

var routes = require('./routes/index');
var api = require('./routes/api');

var app = express();
var expressWs = require('express-ws')(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('jwtKey', "secretofmaarifa");
app.use(session({ secret: 'secretofmaarifa', maxAge: new Date(Date.now() + 3600000), expires: new Date(Date.now() + 3600000) }));
app.use('/', routes);
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
	if (req.path == "/api/login" || req.path == "/api/register" || req.path == "/api/update" || req.path == "/api/heartbeat" || req.path.indexOf("/tracker/") > -1 || req.path.indexOf("givePack") > -1) {
        next();
    } else {
        if(req.path.indexOf("/api/") > -1){
            var token = req.body.token;
            if (token) {
                jwt.verify(token, config.jwtKey, function (err, decoded) {
                    if (err) {
                        return res.json({ type: "err", message: 'Failed to authenticate token.' });    
                    } else {
                        req.decoded = decoded;    
                        next();
                    }
                });
            } else {
                return res.status(403).send({ 
                    type: "err",
                    message: 'No token provided.' 
                });  
            }
        } else {
            next();
        }
    }
});
app.use('/api', api);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(new Error(404));
});

app.use(function (err, req, res, next) {
	if (err instanceof Error) {
		if (err.message === '401') {
			res.redirect('/login');
		} else {
			res.render('error', { error: err.status || 500 });
		}
	}
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


console.log("Creating socket...");
var wsId = 1;
var webSockets = [];
var signalWaiters = [];

app.ws('/ws', function(ws, req) {
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

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

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

process.on('uncaughtException', function (err) {
  console.log(err);
});


module.exports = app;
