// Parse initialization
Parse.initialize("9xPBTlM204Jbn3ijd45g4NKnSw19JeOjgpgdIwLS", "adkGf2Zv7T6hSeEb16XedCuguxTRt3U71Lc2xWNj");
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');


// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var moment = require('cloud/moment');
//var cookieParser = require('cookie-parser')
var date_format = "ddd h:mm a MM/DD/YY";
var SYSTEM_USER_ID = "r8jWeIE83n";

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(parseExpressHttpsRedirect());
app.use(express.bodyParser());    // Middleware for reading request body
app.use(express.cookieParser('YOUR_SIGNING_SECRET'));
app.use(parseExpressCookieSession({ cookie: {maxAge: 3600000 }, fetchUser: true }));
//app.use(cookieParser());

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

app.get('/', function(req, res) {
	var user = Parse.User.current();

  if(user) {
    var ride = Parse.Object.extend("ride");
    var query = new Parse.Query(ride);
    query.equalTo("driverId", Parse.User.current());
    query.ascending("datetime");
    query.include("groupId");
    query.find({
      success: function(results){
              var rides = {};
              for (var result in results) {
                  if (typeof rides[results[result].get("datetime").toDateString()] == "undefined" ) {
                      rides[results[result].get("datetime").toDateString()] = [];
                  }
                  rides[results[result].get("datetime").toDateString()].push(results[result]);
                  var date = moment(results[result].get("datetime")).utcOffset("-08:00").format('h:mm a');
                  rides[results[result].get("datetime").toDateString()][rides[results[result].get("datetime").toDateString()].length-1].date = date
              }
          res.render('pages/index', {
            title: "Rides",
            rides: rides
          });
          
      },
      error: function(error){
        console.log(error);
      }
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/group-details/:id', function(req, res) {
  /* sample id = M4hVPSu2eL */
  
  if(Parse.User.current()) {
    var CurrentGroup = Parse.Object.extend("group");
    var groupQuery = new Parse.Query(CurrentGroup);
    groupQuery.get(req.params.id, {
      success: function(group) {
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
              group: group
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
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});


app.get('/ride-details/:id', function(req, res) {
  /* sample id = XQ3p6Lrhhg */
  if(Parse.User.current()) {
    var CurrentRide = Parse.Object.extend("ride");
    var rideQuery = new Parse.Query(CurrentRide);
    rideQuery.include("groupId");
    rideQuery.include("driverId");
    rideQuery.get(req.params.id, {
      success: function(ride) {
        var group = ride.get("groupId");
        var driver = ride.get("driverId");
        var isDriver = false;
        if (Parse.User.current() == driver){
          isDriver = true;
        }
        var startLoc = ride.get("fromLocation");
        var endLoc = ride.get("toLocation");
        var driver_name = driver.get("first_name") + " " + driver.get("last_name");
        var date = moment(ride.get("datetime")).utcOffset("-08:00").format('ddd h:mm a MM/DD/YY');
        //console.log(" >>>> " + date);
        var passenger_arr = new Array();
        var ride_passengers = Parse.Object.extend("ride_passenger");
        var passQuery = new Parse.Query(ride_passengers);
        passQuery.equalTo("rideId", ride);
        passQuery.include("passengerId");
        passQuery.find({
          success: function(results) {
            for (var i = 0; i < results.length; i++) { 
              var user = results[i].get("passengerId");
              var name = user.get("first_name") + " " + user.get("last_name");
              passenger_arr.push(name);
            }

            var swapQuery = new Parse.Query("swap_requests");
            swapQuery.equalTo("rideId", ride).find().then(function(swap) {
            var swap_exists = swap.length > 0 ? true : false;
            var swap_is_active = null;
            if(swap_exists) {
              swap_is_active = swap[0].get("isActive");
            }

            res.render('pages/ride-details', {
              title: "Ride Details", 
              ride_id: ride.id,
              passengers: passenger_arr, 
              group: group,
              isDriver: isDriver,
              date: date,
              start_location: startLoc,
              end_location: endLoc,
              driver_name: driver_name,
              swap_exists: swap_exists,
              swap_is_active: swap_is_active
            });
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
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/ride/swap/:id', function(req, res) {
  
  if(Parse.User.current()) {
    var Ride = Parse.Object.extend("ride");
    var rideQuery = new Parse.Query(Ride);
    rideQuery.include("groupId");
    rideQuery.include("driverId");
    rideQuery.get(req.params.id, {
      success: function(ride) {
        var group_name = ride.get("groupId").get("name");
        var curr_driver_name = ride.get("driverId").get("first_name") + " " + ride.get("driverId").get("last_name");
        var date_string = moment(ride.get("datetime")).utcOffset("-08:00").format(date_format);
        var passengers_arr = [];
        var RidePassenger = Parse.Object.extend("ride_passenger");
        var passQuery = new Parse.Query(RidePassenger);
        passQuery.equalTo("rideId", ride);
        passQuery.include("passengerId");
        passQuery.find({
          success: function(passengers) {
            for (var i = 0; i < passengers.length; i++) { 
              var user = passengers[i].get("passengerId");
              var name = user.get("first_name") + " " + user.get("last_name");
              passengers_arr.push(name);
          }
          res.render('pages/ride-swap.ejs', {
              title: "Ride Swap", 
              ride_id: req.params.id,
              passengers: passengers_arr, 
              group: group_name,
              date: date_string,
              driver_name: curr_driver_name
          });
        },
          error: function(error) {
            console.log("Error: " + error.code + " " + error.message);
          }
        });
      },
      error: function(error) {
        console.log("Error: " + error.code + " " + error.message);
      },
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.post('/ride/swap', function(req, res) {
  
  if(Parse.User.current()) {
    var ride_id = req.body.ride_id
    var note = req.body.note

    var Ride = Parse.Object.extend("ride");
    var rideQuery = new Parse.Query(Ride);
    rideQuery.get(ride_id).then (function(ride) {
      var swapObject = new Parse.Object("swap_requests");
      swapObject.set("new_driverId", null);
      swapObject.set("old_driverId", ride.get("driverId"));
      swapObject.set("rideId", ride);
      swapObject.set("note_text", note);
      swapObject.set("isActive", true);

      return swapObject.save();
    }).then(function() {
      res.redirect('/swap/');
    }, function(error) {
      console.log(error);
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/swap/', function(req, res) {
    if(Parse.User.current()) {
      var $$_data_$$ = [];
      var groupQuery = new Parse.Query("group_member")
      groupQuery.include("groupId");
      groupQuery.equalTo("userId", Parse.User.current());
      groupQuery.find().then(function(group_members) {
        var groups = [];
        for(var i=0; i<group_members.length; i++) {
          (function(index) {
            groups.push(group_members[index].get("groupId"));
          })(i);
        }
        var rideQuery = new Parse.Query("ride");
        rideQuery.descending("datetime");
        rideQuery.containedIn("groupId", groups);
        return rideQuery.find();
      }).then(function(rides) {
        var swapQuery = new Parse.Query("swap_requests");
        swapQuery.include("rideId");
        swapQuery.include("old_driverId");
        swapQuery.containedIn("rideId", rides);
        return swapQuery.find();
      }).then(function(swaps) {
        var promises = [];
        for(var i=0; i<swaps.length; i++) {
          (function(index) {
            var swap = swaps[index];
            var curr_driver = swap.get("old_driverId").get("first_name") + " " + swap.get("old_driverId").get("last_name"); 
            var note = swap.get("note_text");
            var ride = swap.get("rideId");
            var is_active = swap.get("isActive");
            
            var groupQuery = new Parse.Query("group");
            promises.push(groupQuery.get(ride.get("groupId").id).then(function(group) {
              var group_name = group.get("name");
              var item = {
                swap_id: swap.id,
                curr_driver: curr_driver,
                is_active: is_active,
                date: ride.get("datetime"),
                group: group_name,
                note: note
              };
              $$_data_$$.push(item);
            }));
          })(i);
        }
        return Parse.Promise.when(promises);
      }).then(function() {
        $$_data_$$ = $$_data_$$.sort(function(a, b) {
          if(a.date < b.date) {
            return -1;
          } else if(a.date > b.date) {
            return 1;
          } else {
            return 0;
          }
        });
        for(var i=0; i<$$_data_$$.length; i++) {
          $$_data_$$[i].date = moment($$_data_$$[i].date).utcOffset("-08:00").format(date_format);
        }
        //console.log($$_data_$$); 
        res.render('pages/swap-board',
        {
          title: "Swapboard",    
          requests: $$_data_$$
        });
      }, function(error) {
          console.log(error);
      });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }

});

app.get('/swap/:id', function(req, res) {
  if(Parse.User.current()) {
    var $$_data_$$;
    var swap_id = req.params.id;
    var swapQuery = new Parse.Query("swap_requests");
    swapQuery.include("old_driverId");
    swapQuery.include("new_driverId");
    swapQuery.include("rideId");
    swapQuery.get(swap_id).then(function(swap) {
        var promises = [];

        var your_swap = swap.get("old_driverId").id == Parse.User.current().id ? true : false;
        
        var old_driver = {
          name: swap.get("old_driverId").get("first_name") + " " + swap.get("old_driverId").get("last_name"),
          user_id: swap.get("old_driverId").id
        };

        var new_driver = {
          name: swap.get("new_driverId") == null ? "" : swap.get("new_driverId").get("first_name") + " " + swap.get("new_driverId").get("last_name"),
          user_id: swap.get("new_driverId") == null ? null : swap.get("new_driverId").id
        };

        var is_active = swap.get("isActive");
        var date = moment(swap.get("rideId").get("datetime")).utcOffset("-08:00").format(date_format);
        var note = swap.get("note_text");

        var group_name;
        var groupQuery = new Parse.Query("group")
        promises.push(groupQuery.get(swap.get("rideId").get("groupId").id).then(function(group) {
          group_name = group.get("name");
        }));
        
        var passengers_arr = [];
        var passengers_query = new Parse.Query("ride_passenger");
        passengers_query.include("passengerId");
        passengers_query.equalTo("rideId", swap.get("rideId"));
        promises.push(passengers_query.find().then(function(passengers) {
          for(var i=0; i<passengers.length; i++) {
            passengers_arr.push({
              name: passengers[i].get("passengerId").get("first_name") + " " + passengers[i].get("passengerId").get("last_name"),
              user_id: passengers[i].get("passengerId").id
            });
          }
        }));
        
        return Parse.Promise.when(promises).then(function() {
          $$_data_$$ = {
            swap_id: swap_id,
            group_name: group_name,
            date: date,
            is_active: is_active,
            old_driver: old_driver,
            new_driver: new_driver,
            note: note,
            passengers: passengers_arr,
            your_swap: your_swap
          };
        });
    }).then(function() {
      //console.log($$_data_$$);
      res.render('pages/swap/inner-view', {
        title: "Swap",
        data: $$_data_$$
      });
    }, function(error) {
        console.log("Error: " + error.code + " " + error.message);
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/swap/confirm/:id', function(req, res) {
  if(Parse.User.current()) {
    var old_driver;

    var swap_id = req.params.id;
    var swapQuery = new Parse.Query("swap_requests");
    swapQuery.include("old_driverId");
    swapQuery.include("rideId");
    swapQuery.get(swap_id).then(function(swap) {
      swap.set("isActive", false);
      swap.set("new_driverId", Parse.User.current());
      
      old_driver = swap.get("old_driverId");
      return swap.save();
    }).then(function(swap) {
      var ride = swap.get("rideId");
      ride.set("driverId", Parse.User.current());
      return ride.save();
    }).then(function() {
      var systemUserQuery = new Parse.Query("User");
      return systemUserQuery.get(SYSTEM_USER_ID);
    }).then(function(systemUser) {
      var thread_message = new Parse.Object("thread_message");
      thread_message.set("author", systemUser);
      var message = Parse.User.current().get("first_name") + " " + Parse.User.current().get("last_name") + " was able to pick up your shift!";
      thread_message.set("message", message);
      return thread_message.save().then(function() {
        var thread = new Parse.Object("thread");
        thread.set("subject", "Your shift was picked up!");
        thread.set("num_messages", 1);
        thread.set("last_message", thread_message);
        thread.set("isSystem", true);
        thread_message.set("thread", thread);
        return thread.save().then(function() {
          var thread_member = new Parse.Object("thread_member"); 
          thread_member.set("userId", old_driver);
          thread_member.set("thread", thread);
          return thread_member.save();
        });
      });
    }).then(function(result) {
      console.log(result);
      res.redirect('/swap/');
    }, function(error) {
        console.log("Error: " + error.code + " " + error.message);
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/fetch_users', function(req, res) {
  var User = Parse.Object.extend("User");
  var userQuery = new Parse.Query(User);
  userQuery.notEqualTo("objectId", Parse.User.current().id);
  userQuery.find().then(function(result) {
    var users_json = [];
    for(var i = 0; i < result.length; i++) {
      var user = {}
      user.name = result[i].get("first_name") + " " + result[i].get("last_name");
      user.id = result[i].id;
      users_json.push(user);
    }
      res.json(users_json);
  }, function(error) {
    console.log("Error: " + error.code + " " + error.message);
  });
});

app.get('/groups', function(req, res) {
  if(Parse.User.current()) {
    var curr_user = Parse.User.current();
    var GroupMember = Parse.Object.extend("group_member");
    var query = new Parse.Query(GroupMember);
    query.include("groupId");
    query.equalTo("userId", curr_user);
    query.find().then(function(groups) {
      var myGroups = [];
      for(var i = 0; i<groups.length; i++) {
        var group = groups[i].get("groupId");
        myGroups.push(group);
        console.log(group.get("name"));
      }
      res.render('pages/groups-index',{
        title: "My Groups",
        groups: myGroups
      });
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/upcoming-rides/:id', function(req, res) {
  if(Parse.User.current()) {
    var curr_user = Parse.User.current();
    var groupQuery = new Parse.Query("group")
    groupQuery.get(req.params.id).then(function(group){
      var ridesQuery = new Parse.Query("ride")
      ridesQuery.include("groupId");
      ridesQuery.include("driverId");
      ridesQuery.equalTo("groupId", group);
      ridesQuery.find().then(function(rides) {
        var myRides = [];
        for(var i=0; i<rides.length; i++) {
            var ride = rides[i];
            myRides.push(ride)
            var driver = ride.get("driverId");
        }
        res.render('pages/upcoming-rides',{
          title: "Rides for this group",
          rides: myRides,
          moment: moment,
          group: group
        });
      });
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});


app.get('/messages', function(req, res) {
  if(Parse.User.current()) {
    var curr_user = Parse.User.current();
    var $$_data_$$ = [];

    var ThreadMember = Parse.Object.extend("thread_member");
    var threadMemberQuery = new Parse.Query(ThreadMember);
    threadMemberQuery.include("thread");
    threadMemberQuery.descending("updatedAt");
    threadMemberQuery.equalTo("userId", curr_user);
    threadMemberQuery.find().then(function(threads) {
      var promises = [];
      for(var i=0; i<threads.length; i++) {
        (function(index) {
          var thread = threads[index].get("thread");
          var last_message_query = new Parse.Query("thread_message");
          last_message_query.include("author");
          
          var thread_id = thread.id;
          var thread_subject = thread.get("subject");
          promises.push(last_message_query.get(thread.get("last_message").id).then(function(last_message) {
            var date = last_message.createdAt;
            if(moment().diff(moment(date), 'days') < 1) {
              date = moment(date).utcOffset("-08:00").format("hh:mm a");
            } else {
              date = moment(date).utcOffset("-08:00").format("MMM DD");
            }

            var item = {
              thread_id: thread.id,
              author: last_message.get("author").get("first_name") + " " + last_message.get("author").get("last_name"),
              num_messages: thread.get("num_messages"),
              date: date,
              subject: thread.get("subject"),
              message_body: last_message.get("message"),
              isSystem: thread.get("isSystem")
            };
            $$_data_$$.push(item);

          }));
        })(i);
      }
      return Parse.Promise.when(promises);
    }).then(function() {
      //console.log($$_data_$$);
      res.render('pages/messages/main', {
        title: "Messages",
        messages: $$_data_$$
      });
    }, function(error) {
        console.log("Error: " + error.code + " " + error.message);
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/messages/:id', function(req, res) {
  if(Parse.User.current()) {
    var curr_user = Parse.User.current();
    var thread_id = req.params.id;
    var $$_data_$$ = [];
    var thread_subject;
    var thread_members = "";

    var thread_query = new Parse.Query("thread");
    thread_query.get(thread_id).then(function(thread) {
      var thread_members_query = new Parse.Query("thread_member");
      thread_members_query.equalTo("thread", thread);
      thread_members_query.include("userId");
      return thread_members_query.find().then(function(thread_members_result) {
        for(var i=0; i<thread_members_result.length; i++) {
          var member = thread_members_result[i].get("userId");
          var name = member.get("first_name");
          if(i == 0) {
            thread_members = name;
          } else {
            thread_members += ", " + name;
          }  
        }

        thread_subject = thread.get("subject");
        var thread_messages_query = new Parse.Query("thread_message"); 
        thread_messages_query.ascending("createdAt");
        thread_messages_query.include("author");
        thread_messages_query.equalTo("thread", thread);
        return thread_messages_query.find();
      });
    }).then(function(thread_messages) {
      for(var i=0; i<thread_messages.length; i++) {
          var date = thread_messages[i].createdAt;
          var message = thread_messages[i].get("message");
          var author = thread_messages[i].get("author");

          if(moment().diff(moment(date), 'days') < 1) {
            date = moment(date).utcOffset("-07:00").format("hh:mm a");
          } else {
            date = moment(date).utcOffset("-07:00").format("MMM DD");
          }

          var item = {
            author: author.get("first_name") + " " + author.get("last_name"),
            curr_user: author.id == curr_user.id ? true : false,
            author_style: author.id == curr_user.id ? "msg-curr-user" : "msg-default",
            body: message,
            date: date
          };
          $$_data_$$.push(item);
      }
      res.render('pages/messages/inner-view', {
        title: "Message",
        thread_subject: thread_subject,
        messages: $$_data_$$,
        thread_id: thread_id,
        thread_members: thread_members
      });
    }, function(error) {
      console.log(error);
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }

});

app.post('/messages/new', function(req, res) {
  if(Parse.User.current()) {
    var curr_user = Parse.User.current();
    var subject = req.body.subject;
    var message_body = req.body.message;
    var group_id = req.body.group_id;

    var thread_closure;

    var thread_message = new Parse.Object("thread_message");
    thread_message.set("author", curr_user);
    thread_message.set("message", message_body);
    thread_message.save().then(function() {
      var thread = new Parse.Object("thread");
      thread.set("subject", subject);
      thread.set("num_messages", 1);
      thread.set("last_message", thread_message);
      thread.set("isSystem", false);   
      thread_message.set("thread", thread);
      return thread.save();
    }).then(function(thread) {
      thread_closure = thread;
      var group_query = new Parse.Query("group");
      return group_query.get(group_id);
    }).then(function(group) {
      var group_members_query = new Parse.Query("group_member");
      group_members_query.include("userId");
      group_members_query.equalTo("groupId", group);
      return group_members_query.find();
    }).then(function(members) {
      var promises = [];
      for(var i=0; i<members.length; i++) {
        var thread_member = new Parse.Object("thread_member");
        thread_member.set("userId", members[i].get("userId"));
        thread_member.set("thread", thread_closure);
        promises.push(thread_member.save());

        /*
        var thread_opened = new Parse.Object("thread_message_opened");
        thread_opened.set("userId", members[i]);
        thread_opened.set("thread_message", thread_message)
        thread_opened.set("opened", false);
        promises.push(thread_opened.save()); 
        */
      }
      return Parse.Promise.when(promises);
    }).then(function() {
      res.redirect('/messages/');
    }, function(error) {
      console.log("Error: " + error.code + " " + error.message);
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.post('/messages/reply', function(req, res) {
  if(Parse.User.current()) {
    var message_body = req.body.message;
    var thread_id = req.body.thread_id

    var curr_user = Parse.User.current();

    var thread_query = new Parse.Query("thread");
    thread_query.get(thread_id).then(function(thread) {
      var thread_message = new Parse.Object("thread_message");
      thread_message.set("author", curr_user);
      thread_message.set("thread", thread);
      thread_message.set("message", message_body);

      thread.set("num_messages", thread.get("num_messages")+1);
      thread.set("last_message", thread_message);

      return Parse.Promise.when([thread_message.save(), thread.save()]);
    }).then(function() {
      res.redirect('/messages/'+thread_id);
    }, function(error) {
      console.log("Error: " + error.code + " " + error.message);
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.get('/messages/group/:id', function(req, res) {
  if(Parse.User.current()) {
    var group_id = req.params.id
    var group_name;
  
    var group_query = new Parse.Query("group");
    group_query.get(group_id).then(function(group) {
      group_name = group.get("name"); 

      var GroupMember = Parse.Object.extend("group_member");
      var query = new Parse.Query(GroupMember);
      query.include("userId");
      query.equalTo("groupId", group);
      query.find().then(function(members) {
        for(var i = 0; i<members.length; i++) {
          var user = members[i].get("userId");
          if(user.id == Parse.User.current().id) {
            continue;
          }
        }
        res.render('pages/group/message',{
          title: "Group Message",
          members: members,
          group_id: group_id,
          group_name: group_name
        });
      });
    });
  } else {
    res.render('pages/login', {
        title: "Login"    
    });
  }
});

app.post('/message/group/new', function(req, res) {
 console.log(req.body.selected) 
});

app.get('/clear', function(req, res) {
  var promises = [];
  var swap_requests_query = new Parse.Query("swap_requests");
  swap_requests_query.find().then(function(swap_requests) {
    return Parse.Object.destroyAll(swap_requests);
  });

  var thread_query = new Parse.Query("thread");
  thread_query.find().then(function(thread) {
    return Parse.Object.destroyAll(thread);
  });

  var thread_members_query = new Parse.Query("thread_member");
  promises.push(thread_members_query.find().then(function(thread_members) {
    return Parse.Object.destroyAll(thread_members);
  }));

  var thread_messages_query = new Parse.Query("thread_message");
  promises.push(thread_messages_query.find().then(function(thread_messages) {
    return Parse.Object.destroyAll(thread_messages);
  }));

  Parse.Promise.when(promises).then(function() {
    res.redirect('/login');
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
