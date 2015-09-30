var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var jwtKey = require("../config.js").jwtKey;



/* Authenticate user */
function isAuthenticated(req, res, next) {
    if (req.session.user && req.session.user.token) {
        jwt.verify(req.session.user.token, jwtKey, function (err, decoded) {
            if (err || !decoded) {
                next(new Error(401));
            } else {
                if (decoded.removeTime < Date.now()) {
                    next(new Error(401));
                } else {
                    return next();
                }
            }
        });
	} else {
		next(new Error(401));
	}
}

function authTransfer(req) {
	if (req.session.user) {
		return true;
	} else {
		return false;
	}
}
/* GET home page. */
router.get('/auth', function (req, res, next) {
    if (req.query["t"]) {
        jwt.verify(req.query["t"], jwtKey, function (err, decoded) {
            if (err || !decoded) {
                res.redirect("login");
            } else {
                if (decoded.removeTime > Date.now()){
                    req.session.user = decoded.user;
                    req.session.user.token = req.query["t"];
                    res.redirect("uxTracker");
                } else {
                    res.redirect("login");
                }
            }
        });
    }else{
        res.redirect("login");
    }
});

router.get("/uxTracker", isAuthenticated, function (req, res, next) {
    res.render("main", {token:req.session.user.token})
});

router.get("/Dashboard", isAuthenticated, function (req, res, next) {
    res.render("./innerPages/dashboard.jade");
})

router.get("/AddNewSite", isAuthenticated, function (req, res, next) {
    res.render("./innerPages/addnewsite.jade");
});

router.get("/SiteSettings", isAuthenticated, function (req, res, next) {
	res.render("./innerPages/sitesettings.jade");
});

router.get("/Site", isAuthenticated, function (req, res, next) {
  res.render("./innerPages/site.jade");
});

router.get("/Form", isAuthenticated, function (req, res, next) {
    res.render("./innerPages/form.jade");
});

router.get("/AdvancedSettings", isAuthenticated, function (req, res, next) {
  res.render("./innerPages/advancedsettings.jade");
});

router.get('/', function (req, res, next) {
    if (isAuthenticated) {
        res.redirect("uxTracker");
    } else {
        res.redirect("login");
    }
});

router.get('/login', function (req, res, next) {
	res.render('login');
});





module.exports = router;