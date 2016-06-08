var app = angular.module("ux", ["ngRoute"]);

app.config(function ($routeProvider) {
  $routeProvider
  .when("/Dashboard", {
    templateUrl: '/Dashboard',
    controller: 'Dashboard'
  })
	.when("/AddNewSite", {
	  templateUrl: '/AddNewSite',
	  controller: 'AddNewSite'
	})
	.when("/site/:id", {
	  templateUrl: '/Site',
	  controller: 'Site'
	})
	.when("/sitesettings/:id", {
	  templateUrl: '/SiteSettings',
	  controller: 'SiteSettings'
	})
  .when("/advancedsettings/:id", {
    templateUrl: '/AdvancedSettings',
    controller: 'AdvancedSettings'
  })
  .when("/form/:id", {
    templateUrl: '/Form',
    controller: 'Form'
  })
	.otherwise({
	  redirectTo: '/Dashboard'
	})
});

app.service("service", function ($http, $location) {
  this.isLoggedIn = false;
  this.sites = [];


  var observerCallbacks = [];
  this.siteUpdateCallback = function (callback) {
    observerCallbacks.push(callback);
  };

  this.siteUpdateRequest = function () {
    this.updateSites();
  }

  this.updateSites = function () {
    $http.post("../api/getSitesSideBar", { token: uxToken }).success(function (data) {
      this.sites = data;
      angular.forEach(observerCallbacks, function (callback) {
        callback(data);
      });
    });
  }
});

app.factory('websocketService', function () {
  return {
    start: function (url, ws, callback) {
      var websocket = new WebSocket(url);
      websocket.onopen = function () {
        ws(websocket);
      };
      websocket.onclose = function () {

      };
      websocket.onmessage = function (evt) {
        callback(evt);
      };
    }
  }
});

app.controller("Form", function($scope, service, $http, $routeParams){

  var eyeCanvas = document.getElementById('eyeTracker');
  eyeCanvas.setAttribute('width', $("#eyeTracker").width());
  eyeCanvas.setAttribute('height', $("#eyeTracker").height());
  var clickCanvas = document.getElementById('clickTracker');
  clickCanvas.setAttribute('width', $("#eyeTracker").width());
  clickCanvas.setAttribute('height', $("#eyeTracker").height());
  var lineCanvas = document.getElementById('lineTracker');
  lineCanvas.setAttribute('width', $("#eyeTracker").width());
  lineCanvas.setAttribute('height', $("#eyeTracker").height());
  var eyectx = eyeCanvas.getContext('2d');
  var clickctx = clickCanvas.getContext('2d');
  var linectx = lineCanvas.getContext('2d');
  eyectx.font = "30px Arial";
  eyectx.fillText("Loading stats...",10,50);
  clickctx.font = "30px Arial";
  clickctx.fillText("Loading stats...",10,50);
  linectx.font = "30px Arial";
  linectx.fillText("Loading stats...",10,50);

  App.initUniform();
  $scope.website = false;
  $http.post("../api/getWebsite", { token: uxToken, id: $routeParams.id }).success(function (data) {
    if (data.type == "siteSettingsDetail") {
      $scope.website = data.site;
    } else {
      $scope.website = false;
    }
  });

  var updates;
  $http.post("../api/getUpdates", { token: uxToken, id: $routeParams.id }).success(function (data) {
    updates = data;
  });



  $scope.$watch("sFilt", function(){
    if($scope.website && $scope.website.settings && $scope.website.settings.filters){
      $scope.website.settings.filters.forEach(function(filter){
        if (filter.filter == $scope.sFilt){
          $scope.selectedFilter = filter;
        }
      });
    }
  });

  $http.post("../api/requestSnapSelector", { token: uxToken, id: $routeParams.id,selector:"html>body>div:nth-child(7)>div:nth-child(2)>div>div:nth-child(2)" }).success(function (data) {
    var img = new Image;
    img.src = data;

    img.onload = function(){
      drawImageScaled(img,eyectx);
      drawImageScaled(img,clickctx);
      drawImageScaled(img,linectx);


      //work mouseline
      for(var x = 0; x < updates.mouseLines.length; x++){

        if(x  < updates.mouseLines.length - 1){
          var Hratio1 = lineCanvas.width*updates.mouseLines[x].x/updates.mouseLines[x].width;
          var Hratio2 = lineCanvas.width*updates.mouseLines[x+1].x/updates.mouseLines[x+1].width;
          var Vratio1 = lineCanvas.height*updates.mouseLines[x].y/updates.mouseLines[x].height;
          var Vratio2 = lineCanvas.height*updates.mouseLines[x+1].y/updates.mouseLines[x+1].height;
          linectx.beginPath();
          linectx.moveTo(Hratio2, Vratio2);
          linectx.lineTo(Hratio1, Vratio1);
          linectx.stroke();
        }
      }

      for(var x = 0; x < updates.clickTracks.length; x++){
        if(x  < updates.mouseLines.length - 1){
          var Hratio1 = lineCanvas.width*updates.clickTracks[x].x/updates.clickTracks[x].width;
          var Vratio1 = lineCanvas.height*updates.clickTracks[x].y/updates.clickTracks[x].height;
          clickctx.fillStyle="#FF0000";
          clickctx.fillRect(Hratio1, Vratio1, 6, 6);
        }
      }
    };

  });

  function drawImageScaled(img, ctx) {
    var height = ($("#clickTracker").width()*1080)/1920;
    ctx.clearRect(0, 0, $("#clickTracker").width(), $("#clickTracker").height());
    ctx.drawImage(img,0,0,1920,1080,0,0,$("#clickTracker").width(),height);
  }
});

app.controller("AdvancedSettings", function($scope,$http,$routeParams,websocketService ){
  App.initUniform();
  $scope.transformDone = false;
  $scope.website = false;
  $http.post("../api/getWebsite", { token: uxToken, id: $routeParams.id }).success(function (data) {
    if (data.type == "siteSettingsDetail") {
      $scope.website = data.site;
      if($scope.website.settings.filters){
        $scope.filters = $scope.website.settings.filters;
      }else{
        $scope.filters = [];
      }
    } else {
      $scope.website = false;
    }
  });

  $scope.ws = false;
  websocketService.start("ws://uxtracker.herokuapp.com", function (ws) {
    $scope.ws = ws;
  }, function (msg) {
    var data = JSON.parse(msg.data);
    $scope.commander(data);
  });

  $scope.commander = function(data){
    if (data.type == "transformDone"){
      $scope.transformDone = true;
    }
    if (data.type == "addTrackerFilter"){
      var filter = angular.copy(data);
      filter.eye = false;
      filter.click = true;
      filter.line = true;
      $scope.filters.push(filter);
      $scope.updateFilters();
    }
  }

  $scope.$watch("filters", function(){
    $scope.updateFilters();
  },true);

  $scope.updateFilters = function(){
    $http.post("../api/editFilters", { token: uxToken, id: $routeParams.id, filters:$scope.filters }).success(function (data) {
      
    });
  }

  $scope.enableEdit = function(bl){
    $http.post("../api/enableAdvanced", { token: uxToken, id: $routeParams.id, set:JSON.parse(bl) }).success(function (data) {
      if (data.type == "modeUpdate") {
        $scope.website.settings.advancedMode = data.message;
        location.reload();
      }
    });
  }

  $scope.transform = function(){
    $scope.ws.send(JSON.stringify({ type: "enableEditMode", id: ($scope.website.uniqueKey ? $scope.website.uniqueKey : "") }));
  }


  $scope.isChecked = function(attr){
    if(attr){
      return true;
    }else{
      return false;
    }
  }
});

app.controller("body", function ($scope, $interval, service, $http) {
  var checker = $interval(function () {
    $http.post("../api/heartbeat", { token: uxToken }).success(function (data) {
      if (data.type == "dead") {
        this.isLoggedIn = false;
        this.token = false;
        top.location.href = "/login";
      }
      if (data.type == "bip") {
        uxToken = data.token;
      }
    });
  }, 1000 * 5);

  $scope.navSelect = function (event, $interval, service) {
    $(".page-sidebar-menu .active").removeClass("active");
    $(event.currentTarget).addClass("active");
    if (event.currentTarget.parentNode.parentNode.nodeName == "UL" && $(event.currentTarget.parentNode.parentNode).hasClass("sub-menu")) {
      $(event.currentTarget).parent().addClass("active");
      $(event.currentTarget).parent().parent().parent().addClass("active");
    }
  }

  $scope.sites = [];

  service.siteUpdateCallback(function (data) {
    $scope.sites = data;
  });



  service.siteUpdateRequest();
});

app.controller("Site", function ($scope, $http, $routeParams, $interval, websocketService) {
  App.initUniform();
  $scope.website = false;
  $http.post("../api/getWebsite", { token: uxToken, id: $routeParams.id }).success(function (data) {
    if (data.type == "siteSettingsDetail") {
      $scope.website = data.site;
    } else {
      $scope.website = false;
    }
  });

  $scope.options = {
    series: {
      shadowSize: 1
    },
    lines: {
      show: true,
      lineWidth: 0.5,
      fill: true,
      fillColor: {
        colors: [{
          opacity: 0.1
        }, {
          opacity: 1
        }
        ]
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickFormatter: function (v) {
        return v;
      }
    },
    xaxis: {
      show: false
    },
    colors: ["#6ef146"],
    grid: {
      tickColor: "#a8a3a3",
      borderWidth: 0
    }
  };

  $scope.plot = $.plot($("#liveDataCount"), [createUselessData()], $scope.options);
  $scope.pathPlot = $.plot($("#pie_chart_path"), [], {
    series: {
      pie: {
        show: true
      }
    },
    legend: {
      show: false
    }
  });
  $interval(function () {
    $scope.plot.setData([$scope.updateData()]);
    $scope.plot.draw();
  }, 100);
  $scope.liveCounter = 0;
  $scope.ws = false;
  
  websocketService.start("ws://uxtracker.herokuapp.com", function (ws) {
    $scope.ws = ws;
    $scope.intPromise = $interval(function () {
      $scope.ws.send(JSON.stringify({ type: "requestLiveStats", id: ($scope.website.uniqueKey ? $scope.website.uniqueKey : "") }))
    },1000);
  }, function (msg) {
    var data = JSON.parse(msg.data);
    if (data) {
      if (data.type == "liveCount") {
        $scope.liveCounter = data.count ? data.count : 0;
        $scope.pathPlot.setData(data.pathList);
        $scope.pathPlot.draw();
      }
    }
  });

  var data = [];

  $scope.updateData = function () {
      var res = [];
      data.push($scope.liveCounter);//push current live members
      if(data.length != 250){
        for (var i = 0; i < 250 - data.length; i++) {
          res.push([i, 0])
        }
      }
      for (var i = 250 - data.length; i < 250; i++) {
        res.push([i, data[i - (250 - data.length)]]);
      }
      return res;
  }

  $scope.$on("$destroy", function () {
    if ($scope.intPromise) {
      $interval.cancel($scope.intPromise)
    }
  })


  //*******************************************************************
  //  CREATE MATRIX AND MAP
  //*******************************************************************
  d3.csv('/hair.csv', function (error, data) {
    var mpr = chordMpr(data);

    mpr
      .addValuesToMap('has')
      .setFilter(function (row, a, b) {
        return (row.has === a.name && row.prefers === b.name)
      })
      .setAccessor(function (recs, a, b) {
        if (!recs[0]) return 0;
        return +recs[0].count;
      });
    drawChords(mpr.getMatrix(), mpr.getMap());
  });
  //*******************************************************************
  //  DRAW THE CHORD DIAGRAM
  //*******************************************************************
  function drawChords(matrix, mmap) {
    var colorPal = [];
    var w = 800, h = 700, r1 = h / 2, r0 = r1 - 100;
    for (var prop in mmap) {
      colorPal.push(getRandomColor())
    }
    var fill = d3.scale.ordinal()
        .domain(d3.range(colorPal.length))
        .range(colorPal);

    var chord = d3.layout.chord()
        .padding(.02)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending);

    var arc = d3.svg.arc()
        .innerRadius(r0)
        .outerRadius(r0 + 20);

    var svg = d3.select("#flowd3").append("svg:svg")
        .attr("width", w)
        .attr("height", h)
      .append("svg:g")
        .attr("id", "circle")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

    svg.append("circle")
        .attr("r", r0 + 20);

    var rdr = chordRdr(matrix, mmap);
    chord.matrix(matrix);

    var g = svg.selectAll("g.group")
        .data(chord.groups())
      .enter().append("svg:g")
        .attr("class", "group")
        .on("mouseover", mouseover)
        .on("mouseout", function (d) { d3.select("#tooltip").style("visibility", "hidden") });

    g.append("svg:path")
        .style("stroke", "black")
        .style("fill", function (d) { return fill(d.index); })
        .attr("d", arc);

    g.append("svg:text")
        .each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .style("font-family", "helvetica, arial, sans-serif")
        .style("font-size", "10px")
        .attr("text-anchor", function (d) { return d.angle > Math.PI ? "end" : null; })
        .attr("transform", function (d) {
          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
              + "translate(" + (r0 + 26) + ")"
              + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .text(function (d) { return rdr(d).gname; });

    var chordPaths = svg.selectAll("path.chord")
          .data(chord.chords())
        .enter().append("svg:path")
          .attr("class", "chord")
          .style("stroke", function (d) { return d3.rgb(fill(d.target.index)).darker(); })
          .style("fill", function (d) { return fill(d.target.index); })
          .attr("d", d3.svg.chord().radius(r0))
          .on("mouseover", function (d) {
            d3.select("#tooltip")
              .style("visibility", "visible")
              .html(chordTip(rdr(d)))
              .style("top", function () { return (d3.event.pageY - 100) + "px" })
              .style("left", function () { return (d3.event.pageX - 100) + "px"; })
          })
          .on("mouseout", function (d) { d3.select("#tooltip").style("visibility", "hidden") });

    function chordTip(d) {
      var p = d3.format(".2%"), q = d3.format(",.3r")
      return "Chord Info:<br/>"
        + p(d.svalue / d.stotal) + " (" + q(d.svalue) + ") of "
        + d.sname + " prefer " + d.tname
        + (d.sname === d.tname ? "" : ("<br/>while...<br/>"
        + p(d.tvalue / d.ttotal) + " (" + q(d.tvalue) + ") of "
        + d.tname + " prefer " + d.sname))
    }

    function getRandomColor() {
      var letters = '0123456789ABCDEF'.split('');
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    function groupTip(d) {
      var p = d3.format(".1%"), q = d3.format(",.3r")
      return "Group Info:<br/>"
          + d.gname + " : " + q(d.gvalue) + "<br/>"
          + p(d.gvalue / d.mtotal) + " of Matrix Total (" + q(d.mtotal) + ")"
    }

    function mouseover(d, i) {
      d3.select("#tooltip")
        .style("visibility", "visible")
        .html(groupTip(rdr(d)))
        .style("top", function () { return (d3.event.pageY - 80) + "px" })
        .style("left", function () { return (d3.event.pageX - 130) + "px"; })

      chordPaths.classed("fade", function (p) {
        return p.source.index != i
            && p.target.index != i;
      });
    }
  }

  var eyeCanvas = document.getElementById('eyeTracker');
  eyeCanvas.setAttribute('width', $("#eyeTracker").width());
  eyeCanvas.setAttribute('height', $("#eyeTracker").height());
  var clickCanvas = document.getElementById('clickTracker');
  clickCanvas.setAttribute('width', $("#eyeTracker").width());
  clickCanvas.setAttribute('height', $("#eyeTracker").height());
  var lineCanvas = document.getElementById('lineTracker');
  lineCanvas.setAttribute('width', $("#eyeTracker").width());
  lineCanvas.setAttribute('height', $("#eyeTracker").height());
  var hmcanvas = document.getElementById('lineTracker');
  hmcanvas.setAttribute('width', $(".heatMap").width());
  hmcanvas.setAttribute('height', $(".heatMap").height());
  var hmcanvasctx = hmcanvas.getContext('2d');

  var eyectx = eyeCanvas.getContext('2d');
  var clickctx = clickCanvas.getContext('2d');
  var linectx = lineCanvas.getContext('2d');
  eyectx.font = "30px Arial";
  eyectx.fillText("Loading stats...",10,50);
  clickctx.font = "30px Arial";
  clickctx.fillText("Loading stats...",10,50);
  linectx.font = "30px Arial";
  linectx.fillText("Loading stats...",10,50);

  var heatmapInstance = h337.create({
    // only container is required, the rest will be defaults
    container: document.querySelector('.heatMap')
  });


  var updates;
  $http.post("../api/getUpdates", { token: uxToken, id: $routeParams.id }).success(function (data) {
    updates = data;
  });

  $http.post("../api/requestSnap", { token: uxToken, id: $routeParams.id }).success(function (data) {
    var img = new Image;
    img.src = data;

    img.onload = function(){
      drawImageScaled(img,eyectx);
      drawImageScaled(img,clickctx);
      drawImageScaled(img,linectx);
      drawImageScaledHm(img,hmcanvasctx);
      var points = [];

      //work mouseline
      for(var x = 0; x < updates.mouseLines.length; x++){
        if(x  < updates.mouseLines.length - 1){
          var Hratio1 = lineCanvas.width*updates.mouseLines[x].x/updates.mouseLines[x].width;
          var Hratio2 = lineCanvas.width*updates.mouseLines[x+1].x/updates.mouseLines[x+1].width;

          var Vratio1 = lineCanvas.height*updates.mouseLines[x].y/updates.mouseLines[x].height;
          var Vratio2 = lineCanvas.height*updates.mouseLines[x+1].y/updates.mouseLines[x+1].height;

          var Hratio1Hm = hmcanvas.width*updates.mouseLines[x].x/updates.mouseLines[x].width;
          var Vratio1Hm = hmcanvas.height*updates.mouseLines[x].y/updates.mouseLines[x].height;

          linectx.beginPath();
          linectx.moveTo(Hratio2, Vratio2);
          points.push({
            x:Hratio1Hm,
            y:Vratio1Hm,
            value:1
          });
          linectx.lineTo(Hratio1, Vratio1);
          linectx.stroke();
        }
      }

      var data = { 
        max: 100, 
        data: points 
      };
      heatmapInstance.setData(data);

      for(var x = 0; x < updates.clickTracks.length; x++){
        if(x  < updates.mouseLines.length - 1){
          var Hratio1 = lineCanvas.width*updates.clickTracks[x].x/updates.clickTracks[x].width;
          var Vratio1 = lineCanvas.height*updates.clickTracks[x].y/updates.clickTracks[x].height;
          clickctx.fillStyle="#FF0000";
          clickctx.fillRect(Hratio1, Vratio1, 6, 6);
        }
      }
    };

  });

  function drawImageScaled(img, ctx) {
    var height = $("#eyeTracker").height();
    ctx.clearRect(0, 0, $("#eyeTracker").width(), $("#eyeTracker").height());
    ctx.drawImage(img,0,0,1920,1080,0,0,$("#eyeTracker").width(),height);
  }

  function drawImageScaledHm(img, ctx) {
    var height = $(".heatMap").height();
    ctx.clearRect(0, 0, $(".heatMap").width(), $(".heatMap").height());
    ctx.drawImage(img,0,0,1920,1080,0,0,$(".heatMap").width(),height);
  }
});

app.controller("SiteSettings", function ($scope, $http, $routeParams) {
  App.initUniform();
  $scope.website = false;
  $http.post("../api/getWebsite", { token: uxToken, id: $routeParams.id }).success(function (data) {
    if (data.type == "siteSettingsDetail") {
      $scope.website = data.site;
    } else {
      $scope.website = false;
    }
  });

  $(".checker").click(function () {
    $scope.$apply(function(){
      if ($(this).children("span").hasClass("checked")) {
        $(this).children("span").removeClass("checked")
        $(this).children("span").children("input").attr("checked", false)
      } else {
        $(this).children("span").addClass("checked")
        $(this).children("span").children("input").attr("checked", true)
      }
    })
  });

  $scope.isChecked = function(attr){
    if(typeof $scope.website.settings == "undefined"){
      return false;
    }else{
      if($scope.website.settings[attr]){
        return true;
      }else{
        return false;
      }
    }
  }
  
  $scope.inited = false;
  $scope.$watch("website.settings", function(){
    if(!$scope.inited){
      $scope.inited = true;
    }else{
      $http.post("../api/saveSettings", { token: uxToken, id: $routeParams.id, settings:JSON.stringify($scope.website.settings) });
    }
  },true);
});

app.controller("Dashboard", function ($scope, $http, service, $interval) {
  App.initUniform();
});

app.controller("AddNewSite", function ($scope, $http, websocketService, service) {
  App.initUniform();
  $scope.form2 = false;
  $scope.form3 = false;
  $scope.trackerBase = "http://uxtracker.herokuapp.com/api/tracker/";
  $scope.key = "";
  $scope.ws = false;
  $scope.formsDone = false;
  $scope.code = "";

  websocketService.start("ws://uxtracker.herokuapp.com", function (ws) {
    $scope.ws = ws;
  }, function (msg) {
    var data = JSON.parse(msg.data);
    if (data) {
      if (data.type == "signalDone") {
        $scope.$apply(function () {
          $scope.formsDone = true;
          service.siteUpdateRequest();
        })
      }
    }
  });

  $scope.validateUrl = function (url) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
		'(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    if (!pattern.test(url)) {
      return false;
    } else {
      return true;
    }
  }

  $scope.toStep = function (number) {
    if (number == 2) {
      //if ($scope.validateUrl($scope.url)) { Checks for valid url
      $http.post("../api/addNewSiteCode", { token: uxToken, action: "addNewWeb", domain: $scope.url, title: $scope.title }).success(function (data) {
        if (data.type == "addNewSiteCode") {
          $scope.key = data.code;
          $scope.ws.send(JSON.stringify({ type: "waitSiteSignal", id: $scope.key }));
          $scope.code = "<script src=\"" + $scope.trackerBase + $scope.key + "\"></script>";
          $scope.form2 = true;
        }
      });
      //}
    }
    if (number == 3) {
      $scope.form3 = true;
    }
  }


});

var createUselessData = function () {
  var res = [];
  for (var i = 0; i < 250; i++) {
    res.push([i, 0])
  }
  return res
}