'use strict';

const App = require('actions-on-google').DialogflowApp;
const fs = require('fs');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const http = require('http');
const request = require('request');
const URL = require('url').URL;
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyC0gf0UxnkDy33nVq5-Kh-1VYfj8QaQVrE'
});


// API.AI Intent names
const WELCOME = 'welcome';
const TONIGHT = 'tonight';
const SUMMARY = 'summary';
const LINEUP = 'lineup';
const REPEATEVENT = 'repeatevent';
const REPEATLINEUP = 'repeatlineup';
const LINEUPNO = 'lineupno';



exports.module = functions.https.onRequest((req, response) => {
   console.log('headers: ' + JSON.stringify(req.headers));
   console.log('body: ' + JSON.stringify(req.body));

   const assistant = new App({request: req, response: response});

   let actionMap = new Map();
   actionMap.set(WELCOME, welcome);
   actionMap.set(TONIGHT, tonight);
   actionMap.set(SUMMARY, summary);
   actionMap.set(LINEUP,lineup);
   actionMap.set(REPEATEVENT, repeatevent);
   actionMap.set(REPEATLINEUP, repeatlineup);
   actionMap.set(LINEUPNO, lineupno);
   assistant.handleRequest(actionMap);


function welcome(assistant) {
  // Request permission to access location to define city
  if (assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT) == false) {
	assistant.askForPermission("It's party time! I'm your party assistant and I'll help you find the best parties going on tonight. To get the event listings for your city", assistant.SupportedPermissions.DEVICE_COARSE_LOCATION);
  }
  else if (assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT)) {
    assistant.askForPermission("It's party time! I'm your party assistant and I'll help you find the best parties going on tonight. To get the event listings for your city", assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION);
  }

}


function summary(assistant) {
	
	if (assistant.isPermissionGranted()) {
	    if (assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT) == false) {
      // Request the user's device city
	     let deviceCity = assistant.getDeviceLocation().city;
	     console.log(deviceCity);
	     assistant.data.deviceCity = deviceCity;
	     locate();
	    }
	    else if (assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT)) {
        // Request the user's device geocoordinates as screen surfaces (phones) don't return a city field
	      let deviceCoordinates = assistant.getDeviceLocation().coordinates;
	      console.log(deviceCoordinates);
	      let lat = deviceCoordinates.latitude;
	      let lng = deviceCoordinates.longitude;
	      googleMapsClient.reverseGeocode({
          // Reverse geocode city from device geocoordinates
          latlng:[lat+","+lng]
        }, function(err, response) {
	        if (!err) {
	        	var address_components = response.json.results[2].address_components;
			        var loc = [];
              // Iterate through Google Maps response object to find objects of type "locality"
			        address_components.forEach(function(item){
			          if (item.types.indexOf('locality') !== -1){
			          	loc.push(item);
			          }
			        });

              if(loc.length == 1)
              {
                console.log(loc[0].long_name);
                // Assign field long name (common name of city) of object of type locality to device city
                let deviceCity = loc[0].long_name;
                assistant.data.deviceCity = deviceCity;
                locate();
              }
              else {
                assistant.tell("Sorry but I can't locate your city right now.")
              }
			        
	      	}
     	});


    }
    else {
      assistant.tell("Too bad, I'll be there waiting for you if you change your mind!")
    }
 	  console.log(assistant.data.deviceCity);
  }
}

  function locate(){
      const host = 'api.apify.com';

      switch(assistant.data.deviceCity){
        // Create the path for the HTTP request to get listings based on user's device city
        case "London":
        assistant.data.path = '/v1/A2nDsSwJTYx5Y2XRt/crawlers/DTWywsvikwsXz7j9w/lastExec/results?token=bAhjpoCMmZCBJJqJucsJbfATa';
        break;
        case "New York":
        assistant.data.path = '/v1/A2nDsSwJTYx5Y2XRt/crawlers/2Y9aEeKSFYLRWkZYg/lastExec/results?token=WL9rvYTBEBBvhP4LazRa4osW3' ;
        break;
        case "San Francisco":
        assistant.data.path = '/v1/A2nDsSwJTYx5Y2XRt/crawlers/3vwD6fDNx4G7fMpNC/lastExec/results?token=nz8ecW2F8hzhLEvubive2GiQv';
        break;
        case "Los Angeles":
        assistant.data.path = '/v1/A2nDsSwJTYx5Y2XRt/crawlers/xXfqm4nqBsTxXgE3y/lastExec/results?token=NovCBWFE8j3TmPk9LpRkoh87W';
        break;
        default: assistant.tell("Sorry, I can't get event listings for your city just yet, but I'm working on it. Email us so we can make it a priority. Thanks and enjoy the night!")
      }

      // Make the HTTP request to get the listings from the scraper API 
      http.get({host: host, path: assistant.data.path}, function(res) {
        let body = ''; // var to store the response chunks
        res.on('data', (d) => { body += d; }); // store each response chunk
        res.on('end', () => {
          // After all the data has been received parse the JSON for desired data
          try {
          let response = JSON.parse(body);
          var num_events = Object.keys(response[0]['pageFunctionResult']).length;
          }
          catch (err){
            console.log(body);
            throw err;
          }

          // Create response
          assistant.ask("Tonight there are " + num_events + " events in " + assistant.data.deviceCity + ". Want to learn more?");
        
        }); 

     });
  }

function tonight(assistant) {
    // Create the path for the HTTP request to get the listings
    const host = 'api.apify.com';
    let path = assistant.data.path;
    console.log('API Request: ' + host + assistant.data.path);
    // Make the HTTP request to get the listings
    http.get({host: host, path: path}, function(res) {
      let body = ''; // var to store the response chunks
      res.on('data', (d) => { body += d; }); // store each response chunk
 
      res.on('end', () => {
        // After all the data has been received parse the JSON for desired data
       console.log(assistant);
          console.log('kiki');
        //body = body.trim();
        let response = JSON.parse(body);
        console.log(response);
        console.log(assistant.data);
        var num_events = Object.keys(response[0]['pageFunctionResult']).length;
        // Create index of events and iterate through events 
        var index = 0;
        if (typeof(assistant.data.index) != 'undefined') {
        	index = assistant.data.index + 1;
    	}
    	   assistant.data.index = index;
        console.log(response);
        
  
          if (assistant.data.index == 0)  {
            // Explain voice commands when first event is uttered by the Assistant
          let event = response[0]['pageFunctionResult'][index]['Event'];
          console.log(assistant.data.index);
          assistant.data.event = event;
          assistant.ask(assistant.data.event + ". To move on to the next event, just say 'next'. You can also ask about the lineup to hear who's playing");
          }
          else if (assistant.data.index < num_events) {
            //Iterate through the events
          let event = response[0]['pageFunctionResult'][index]['Event'];
          console.log(assistant.data.index);
          assistant.data.event = event;
          assistant.ask(assistant.data.event + ". Move on to the next event or hear the lineup?");
          }
          else {
            // Close the conversation with a greeting when all events have been uttered
          assistant.tell("That's all for tonight!");
        }
    	
      }); 

   });
}


function repeatevent(assistant){

        console.log("repeat")
        assistant.ask(assistant.data.event + ". Move on to the next event?");
}

function lineup(assistant){

 	const host = 'api.apify.com';
  let path = assistant.data.path;    console.log('API Request: ' + host + path);
    // Make the HTTP request to get the listings
    http.get({host: host, path: path}, function(res) {
      let body = ''; // var to store the response chunks
      res.on('data', (d) => { body += d; }); // store each response chunk
      res.on('end', () => {
        // After all the data has been received parse the JSON for desired data
        //body = body.trim();
        let response = JSON.parse(body);
        var index = assistant.data.index;
        let lineup = response[0]['pageFunctionResult'][index]['Lineup'];
        // Extract lineup field from response
        assistant.data.lineup = lineup;
        assistant.ask("Here's the lineup: " + assistant.data.lineup + ". Move on to the next event?");
    }); 

   });

}

function repeatlineup(assistant){

        assistant.ask("Here's the lineup " + assistant.data.lineup + ". Move on to the next event?");
}

function lineupno(assistant){

        assistant.tell("Alright then, enjoy your night!")
}
 
});