//Set up routes to the different pages


Router.route('/', {
  template: 'landingPage'
});
Router.route('/guide', {
  template: 'tourguideSignUp'
});
Router.route('/tourist', {
  template: 'touristSignUp'
});
Router.route('/map', {
  template: 'destination_map'
});
Router.route('/set_dest', {
  template: "destination_setter"
});
Router.route('/matches', {
  template: "matches"
});
Router.route('/output', {
  template: "output"
});

    tourist_collection = new Mongo.Collection("tourists");
    guide_collection = new Mongo.Collection('guides');
    Markers = new Mongo.Collection("map_markers");

    var dest_map;
    var marker_array = [];
if (Meteor.isClient) {
  
  Meteor.startup(function(){
    Meteor.subscribe('tourists');
    Meteor.subscribe('guides');
    Meteor.subscribe('map_markers');
    guide_collection.allow({
      'insert':function(){
      return true;
      } 
    });
    tourist_collection.allow({
      'insert':function()
      {
        return true;
      }
    });
    Markers.allow({
      'insert':function(){
        return true;
      }
    });

    GoogleMaps.load({
      key: 'AIzaSyAHtGRa7hABkvM7povLtOTXgxyantNO7-o',
      libraries: 'places'
    });
    
  });

  

  Template.tourguideSignUp.events({
    'submit .guide_form': function (event) {
      event.preventDefault();

      //@TODO: parse locations and interests into arrays of individual locations / interests
      var locations = event.target.guide_dest.value;
      var interests = event.target.guide_interest.value;
      var phone = event.target.guide_contact.value;
      //push these into the guide database
      //alert(locations + " " + interests);
      var guideLocArr = formatString(locations);
      var guideIntArr = formatString(interests);
      var guide_phone = formatPhone(phone);
      var insert_obj = {
        name: {
          first: event.target.guide_first.value,
          last: event.target.guide_last.value
        },
        guideLoc: guideLocArr, 
        guideInt: guideIntArr, 
        phone:guide_phone, 
        createdAt:new Date()
      };
      console.log(insert_obj);
      guide_collection.insert(insert_obj, function(error){
          if(error){
            console.log(error);
          }
          else {
            console.log("insert success");
          }
        });
      var id = guide_collection.find({}, {sort: {createdAt: -1}}).fetch()[0]._id;
      Session.set('this_session', id);
      Session.set('type', "guide");
      event.target.guide_first.value = "";
      event.target.guide_last.value = "";
      event.target.guide_dest.value = "";
      event.target.guide_interest.value = "";
      Router.go('map')
    }
  });

  Template.touristSignUp.events({
    'submit .tourist_form': function (event) {
      event.preventDefault();

      //@TODO parse locations and interests into arrays of individual locations / interests
      var locations = event.target.tourist_dest.value;
      var interests = event.target.tourist_interest.value;
      
      var touristLocArr = formatString(locations);
      var touristIntArr = formatString(interests);
      //push these into the tourist database
      tourist_collection.insert({
          name: { 
            first: event.target.tourist_first.value, 
            last: event.target.tourist_last.value 
          },
          touristLoc: touristLocArr,
          touristInt: touristIntArr,
          createdAt: new Date()
        });

      var id = tourist_collection.find({}, {sort: {createdAt: -1}}).fetch()[0]._id;
      Session.set('this_session', id);
      Session.set('type', "tourist");
      event.target.tourist_first.value = "";
      event.target.tourist_last.value = "";
      event.target.tourist_dest.value = "";
      event.target.tourist_interest.value = "";
      Router.go('matches');
    }
  });

  Template.output.helpers({
    mapOptions: function(){
      if (GoogleMaps.loaded()) {
        return {
          center: new google.maps.LatLng(38.6272, -90.1978),
          zoom: 8,
          disableDefaultUI:true
        };
      }
    }
  })

  Template.destination_map.helpers({
    mapOptions: function(){
      if (GoogleMaps.loaded()) {
        return {
          center: new google.maps.LatLng(38.6272, -90.1978),
          zoom: 8,
          disableDefaultUI:true
        };
      }
    }
  });
  Template.destination_map.rendered = function() {
    this.autorun(function() {
      if(GoogleMaps.loaded()) {
        $('#destination_add')
          .geocomplete()
          .bind("geocode:result", function(event, result){
            lat = result.geometry.location.H;
            lng = result.geometry.location.L;
            latLng = new google.maps.LatLng(lat, lng);
            marker_array.push(latLng);
            //THIS IS THE MARKER THAT NEEDS TO GO IN MARKERS DB
            tour_guide_name = Session.get('guide_name');
            console.log(tour_guide_name);
            var marker = new google.maps.Marker({
              position: latLng,
              map: dest_map,
              title: "Destinationz"
            });
            // Markers.insert(marker, function(error){
            //   if(error){
            //     console.log(error);
            //   }
            //   else {
            //     console.log("Markers insert success");
            //   }
            // });
            $('#destination_add').val('');
          });
      }
    });   
  };
  Template.destination_map.events({
    'click .add_to_map': function (event) {
      event.preventDefault();
      Markers.insert(marker_array, function(error){
        if(error){
          console.log(error);
        }
        else {
          console.log("Marker collection insert success");
        }
      });
    }

  });

  Template.destination_map.onCreated(function(){
    GoogleMaps.ready('destination_map', function(map) {
      dest_map = map.instance;
      // google.maps.event.addListener(map.instance, 'click', function(event) {
      //   Markers.insert({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      // });
      var markers = {};

      Markers.find().observe({  
        added: function(document) {
          // Create a marker for this document
          console.log("Marker helper add call");
          console.log(document[0]);
          console.log(document[0].H);
          if(document[0].length > 0){
            for(var i =0; i < document.length; i++){
              var marker = new google.maps.Marker({
              draggable: true,
              animation: google.maps.Animation.DROP,
              position: new google.maps.LatLng(document[0][i].H, document[0][i].L),
              map: map.instance
              });
            
            }
          }
          else if(document[0].H){
            var marker = new google.maps.Marker({
              draggable: true,
              animation: google.maps.Animation.DROP,
              position: new google.maps.LatLng(document[0].H, document[0].L),
              map: map.instance
              });
          }
        }
      });
    });
  });

  // Template.destination_map.events({
  //   'submit .dest_add_form': function(event){

  //   }
  // });
}

function formatString(str) {
  var delimited = str.split(/\,\s+|\s+|\,+/g);
  for(var i=0; i<delimited.length; i++)
    delimited[i] = delimited[i].toLowerCase();
  return delimited;
}

function formatPhone(str) {
  var stripped = str.replace(/\D/g, "");
  var formatted = stripped.match(/^(\d{3})(\d{3})(\d{4})$/);
  return (!formatted) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];
}

if (Meteor.isServer) {
  //@TODO need to set up publishing ie turn off autopublish
  
  

  Meteor.startup(function () {
    // code to run on server at startup
    //setup mongoDBs
    

    
    Meteor.publish('tourists', function () {
      return tourist_collection.find(); // everything
    });
    Meteor.publish('guides', function() {
      return guide_collection.find();
    });
    Meteor.publish('map_markers', function(){
      return Markers.find();
    });

    guide_collection.allow({
      'insert':function(){
        return true;
      }
    
    });

    tourist_collection.allow({
      'insert':function()
      {
        return true;
      }
    });

    Markers.allow({
      'insert':function(){
        return true;
      }
    });

  });
}
