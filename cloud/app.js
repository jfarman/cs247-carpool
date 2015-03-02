// Parse initialization
Parse.initialize("9xPBTlM204Jbn3ijd45g4NKnSw19JeOjgpgdIwLS", "adkGf2Zv7T6hSeEb16XedCuguxTRt3U71Lc2xWNj");

// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var moment = require('moment');

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/login', function(req, res) {
  res.render('pages/login',
      {
        title: "Login"    
      });
});

app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    Parse.User.logIn(username, password, {
        success: function(user) {
            res.redirect('/');            
         },
        error: function(user, error) {
            console.log("login failed", error);
        }
    });
});

app.get('/flot', function(req, res) {
  res.render('pages/flot',
      {
        title: "Flot Charts"    
      });
});

app.get('/morris', function(req, res) {
  res.render('pages/morris',
      {
        title: "Morris Charts"    
      });
});

app.get('/tables', function(req, res) {
  res.render('pages/tables',
      {
        title: "Tables"    
      });
});

app.get('/forms', function(req, res) {
  res.render('pages/forms',
      {
        title: "Forms"    
      });
});

app.get('/panels-wells', function(req, res) {
  res.render('pages/panels-wells',
      {
        title: "Paensl and Wells"    
      });
});

app.get('/buttons', function(req, res) {
  res.render('pages/buttons',
      {
        title: "Buttons"    
      });
});

app.get('/notifications', function(req, res) {
  res.render('pages/notifications',
      {
        title: "Notifications"    
      });
});

app.get('/typography', function(req, res) {
  res.render('pages/typography',
      {
        title: "Typography"    
      });
});

app.get('/icons', function(req, res) {
  res.render('pages/icons',
      {
        title: "Icons"    
      });
});

app.get('/grid', function(req, res) {
  res.render('pages/grid',
      {
        title: "Grid"    
      });
});

app.get('/blank', function(req, res) {
  res.render('pages/blank',
      {
        title: "Blank Page"    
      });
});

app.get('/', function(req, res) {

	var user = Parse.User.current();
	//user.fetch();
	var ride = Parse.Object.extend("ride");
	var query = new Parse.Query(ride);
	query.equalTo("driverId", Parse.User.current());
    query.include("groupId");
	query.find({
		success: function(results){
            var rides = {};
            for (var result in results) {
                if (typeof rides[results[result].get("datetime").toDateString()] == "undefined" ) {
                    rides[results[result].get("datetime").toDateString()] = [];
                }
                rides[results[result].get("datetime").toDateString()].push(results[result]);
                var date = moment(results[result].get("datetime")).format('h:mm a MM/DD/YYYY');
                rides[results[result].get("datetime").toDateString()][rides[results[result].get("datetime").toDateString()].length-1].date = date
            }
			console.log(rides["Tue Mar 03 2015"][0]);
			
			
				res.render('pages/index', {
					title: "Rides",
					rides: rides
				});
				
		},
		error: function(error){
			console.log(error);
		}
	});
});

app.get('/group-details/:id', function(req, res) {
  /* sample id = M4hVPSu2eL */
  var CurrentGroup = Parse.Object.extend("group");
  var groupQuery = new Parse.Query(CurrentGroup);
  groupQuery.get(req.params.id, {
    success: function(group) {
      var group_name = group.get("name");
      
      var members_arr = new Array();
      var drivers_arr = new Array();
      var passengers_arr = new Array();

      var members = Parse.Object.extend("group_member");
      var memberQuery = new Parse.Query(members);
      memberQuery.equalTo("groupId", group);
      memberQuery.include("userId");
      memberQuery.find({
        success: function(results) {
          for (var i = 0; i < results.length; i++) { 
            var user = results[i].get("userId");
            var name = user.get("first_name") + " " + user.get("last_name");
            members_arr.push(name);
            if (user.get("isParent")) {
              drivers_arr.push(name);
            } else {
              passengers_arr.push(name);
            }
        }
        res.render('pages/group-details', {
            title: "Group Details", 
            members: members_arr,
            drivers: drivers_arr,
            passengers: passengers_arr, 
            group: group_name
        });
      },
        error: function(error) {
          console.log("Error: " + error.code + " " + error.message);
        }
      });
    },
    error: function(ride, error) {
      console.log("Error: " + error.code + " " + error.message);
    }
  });
});


app.get('/ride-details/:id', function(req, res) {
  /* sample id = XQ3p6Lrhhg */
  var CurrentRide = Parse.Object.extend("ride");
  var rideQuery = new Parse.Query(CurrentRide);
  rideQuery.include("groupId");
  rideQuery.include("driverId");
  rideQuery.get(req.params.id, {
    success: function(ride) {
      var group = ride.get("groupId");
      var group_name = group.get("name");
      var driver = ride.get("driverId");
      var driver_name = driver.get("first_name") + " " + driver.get("last_name");
      var date = moment(ride.get("datetime")).format('h:mm a MM/DD/YYYY');
      //console.log(" >>>> " + date);
      var passenger_arr = new Array();
      var ride_passengers = Parse.Object.extend("ride_passenger");
      var passQuery = new Parse.Query(ride_passengers);
      passQuery.equalTo("rideId_string", req.params.id);
      passQuery.include("passengerId");
      passQuery.find({
        success: function(results) {
          for (var i = 0; i < results.length; i++) { 
            var user = results[i].get("passengerId");
            var name = user.get("first_name") + " " + user.get("last_name");
            //console.log(name);
            passenger_arr.push(name);
        }
        res.render('pages/ride-details', {
            title: "Ride Details", 
            passengers: passenger_arr, 
            group: group_name,
            date: date,
            driver_name: driver_name
        });
      },
        error: function(error) {
          console.log("Error: " + error.code + " " + error.message);
        }
      });
    },
    error: function(ride, error) {
      console.log("Error: " + error.code + " " + error.message);
    }
  });
});

app.get('/ride/swap/:id', function(req, res) {
  var ride_id = req.params.id

  var temp_ride_obj = {
    date: "8:20 AM - March 5, 2015",
    group: "Swimming",
    curr_driver: "Ricky Tran"
  }

  res.render('pages/ride-swap-form',
      {
        title: "Ride Swap",
        ride_id: ride_id,
        ride: temp_ride_obj
      });
});

app.post('/ride/swap', function(req, res) {
  var ride_id = "XQ3p6Lrhhg"
  var note = req.body.note

  var User = Parse.Object.extend("user");
  var userQuery = new Parse.Query(User);
  var user;
  userQuery.equalTo("objectId", "OgcTtU2ykN");
  userQuery.find().then(function(u) {
    user = u
    var Ride = Parse.Object.extend("ride");
    var rideQuery = new Parse.Query(Ride);
    rideQuery.equalTo("objectId", ride_id);
    return rideQuery.find();
  }).then (function(ride) {
    var swapObject = new Parse.Object("swap_requests");
    swapObject.set("new_driverId", null);
    swapObject.set("old_driverId", user[0]);
    swapObject.set("rideId", ride[0]);
    swapObject.set("note_text", note);
    swapObject.set("isActive", true);

    return swapObject.save();
  }).then(function() {
      res.redirect('/');
    }, function(error) {
      console.log(error);
    });
});

app.get('/swap/', function(req, res) {
    var Swap = Parse.Object.extend("swap_requests");
    var swapQuery = new Parse.Query(Swap);
	swapQuery.include("rideId");
	swapQuery.include("old_driverId");	

    swapQuery.equalTo("isActive", true).find({
        success: function(swaps) {
            console.log(swaps); 
			res.render('pages/swap-board',
			{
		        title: "Swapboard",    
				requests: swaps
			});
        }, 
        error: function(error) {
            console.log(error);
        }
    });
	



});
// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });

// // Example reading from the request body of an HTTP post request.
// app.post('/test', function(req, res) {
//   // POST http://example.parseapp.com/test (with request body "message=hello")
//   res.send(req.body.message);
// });

// Attach the Express app to Cloud Code.
app.listen();
