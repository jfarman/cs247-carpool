// Parse initialization
Parse.initialize("9xPBTlM204Jbn3ijd45g4NKnSw19JeOjgpgdIwLS", "adkGf2Zv7T6hSeEb16XedCuguxTRt3U71Lc2xWNj");

// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/', function(req, res) {
  res.render('pages/index',
      {
        title: "Index"    
      });
});

app.get('/login', function(req, res) {
  res.render('pages/login',
      {
        title: "Login"    
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

app.get('/rides-index', function(req, res) {
  var rides = [
    {
      ride_id: "ride0",
      date: "March 2, 2015",
      shifts: [{
        shift_id: "shift0",
        time: "8:20 AM",
        group: "School"
      },
      {
        shift_id: "shift1",
        time: "3:00 PM",
        group: "Swim"
      }]
    },
    {
      ride_id: "ride1",
      date: "March 3, 2015",
      shifts: [{
        shift_id: "shift3",
        time: "8:20 AM",
        group: "School"
      }]
    },
    {
      ride_id: "ride2",
      date: "March 3, 2015",
      shifts: [{
        shift_id: "shift0",
        time: "8:20 AM",
        group: "School"
      },
      {
        shift_id: "shift1",
        time: "3:00 PM",
        group: "Swim"
      }]
    },
    {
      ride_id: "ride3",
      date: "March 5, 2015",
      shifts: [{
        shift_id: "shift3",
        time: "8:20 AM",
        group: "School"
      }]
    }
  ];

  res.render('pages/rides-index', {
    title: "Rides",
    rides: rides
  });

})

app.get('/ride-details/:id', function(req, res) {
  var passenger_arr = new Array();
  var ride_passengers = Parse.Object.extend("ride_passenger");
  var query = new Parse.Query(ride_passengers);
  /* sample id = XQ3p6Lrhhg */
  var CurrentRide = Parse.Object.extend("ride");
  var query = new Parse.Query(CurrentRide);
  query.get(req.params.id, {
    success: function(ride) {
    // The object was retrieved successfully.
    },
    error: function(ride, error) {
      console.log("Error: " + error.code + " " + error.message);
    }
  });

  query.equalTo("rideId_string", req.params.id);
  query.include("passengerId");

  query.find({
    success: function(results) {
      for (var i = 0; i < results.length; i++) { 
        var user = results[i].get("passengerId");
        var name = user.get("first_name") + " " + user.get("last_name");
        console.log(name);
        passenger_arr.push(name);
    }
    res.render('pages/ride-details', {
        title: "Ride Details", passengers: passenger_arr   
    });
  },
    error: function(error) {
      console.log("Error: " + error.code + " " + error.message);
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
