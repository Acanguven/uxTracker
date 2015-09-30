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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('jwtKey', "secretofmaarifa");
app.use(session({ secret: 'secretofmaarifa', maxAge: new Date(Date.now() + 3600000), expires: new Date(Date.now() + 3600000) }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);


app.use(function (req, res, next) {
	if (req.path == "/api/login" || req.path == "/api/register" || req.path == "/api/update" || req.path == "/api/heartbeat" || req.path.indexOf("/tracker/") > -1) {
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

process.on('uncaughtException', function (err) {
  console.log(err);
});


module.exports = app;
