var latlong;
var schools = {};
var reverseSchools = {};
$(document).ready(function() {
  var geocoder;
  var infowindow;
  var map;
  var address;
  var schoolData;
  var distances = [];
  var bounds = new google.maps.LatLngBounds();
  var markersArray = [];
  var school_destinations = [];
  var displayPlace;
  var x = document.getElementById("geoLocation");

  // marker icons
  var destinationIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=D|FF0000|000000';
  var originIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=O|FFFF00|000000';

  //////////////// get sample data //////////////////////
  $.get("http://lofischools.herokuapp.com/search?query=School&state=NY&limit=10", function(data) {
    schoolData = JSON.parse(data)["results"].forEach(function(school){
      schools[school.name] = school.street + ", " + school.city
      reverseSchools[school.street + ", " + school.city] = school.name
    })
    // set school_destinations values (zip codes)
    for(var key in schools) {
      school_destinations.push(schools[key]);
    }
  });
  ///////////////////end sample data////////////////////


  function initialize() {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(-34.397, 150.644);
    var mapOptions = {
      zoom: 8,
      center: latlng
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    // start geolocation
       // Try HTML5 geolocation
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          var infowindow = new google.maps.InfoWindow({
            map: map,
            position: pos,
            content: 'Location found using HTML5.'
          });

          map.setCenter(pos);
        }, function() {
          handleNoGeolocation(true);
        });
      } else {
        // Browser doesn't support Geolocation
        handleNoGeolocation(false);
    }    
    // end geolocation
  }
    // start geolocation
    function handleNoGeolocation(errorFlag) {
      if (errorFlag) {
        var content = 'Error: The Geolocation service failed.';
      } else {
        var content = 'Error: Your browser doesn\'t support geolocation.';
      }

      var options = {
        map: map,
        position: new google.maps.LatLng(60, 105),
        content: content
      };

      var infowindow = new google.maps.InfoWindow(options);
      map.setCenter(options.position);
    }
    // end geolocation


  // start code address //
  function codeAddress() {
    address = document.getElementById('address').value;
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });

    // start calculate distance //
    function calculateDistances() {
      var service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [address],
          destinations: school_destinations,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, callback);
    }
    // end calculate distance //

    // on click calculate distance //
    $("#distanceCalc").click(function(){
        calculateDistances();
    });
    // on click calculate distance //
  }
  // end code address //

  ////////////// start reverse geocoding /////////////////
  function codeLatLng(latitude, longitude) {
    var input = latitude + ", " + longitude
    var latlngStr = input.split(',', 2);
    var lat = parseFloat(latlngStr[0]);
    var lng = parseFloat(latlngStr[1]);
    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      displayPlace =  results[0].formatted_address
    });
  }
  ////////////// end reverse geocoding /////////////////

  // start distance matrix functions
  function callback(response, status) {
    if (status != google.maps.DistanceMatrixStatus.OK) {
      alert('Error was: ' + status);
    } else {
      var origins = response.originAddresses;
      var destinations = school_destinations;
      var outputDiv = document.getElementById('outputDiv');
      outputDiv.innerHTML = '';
      deleteOverlays();
      for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        results = results.sort(function(a,b){
          return Number(a.distance.text.replace(" km","")) - Number(b.distance.text.replace(" km",""))
        });
        results = results.slice(0,3)
        addMarker(origins[i], false);
        for (var j = 0; j < results.length; j++) {
          addMarker(destinations[j], true);
          var objKey = destinations[j]
          var schoolName = reverseSchools[objKey]
          var startPoint = origins[i].replace(", USA", "")
          ///////////////// display html ////////////////
          outputDiv.innerHTML += results[j].distance.text + " FROM " + startPoint + ' TO ' + schoolName + " (" + destinations[j] + ") "
              + ': ' + ' approximately '
              + results[j].duration.text + '<br>';
        }
      }
    }
  }

  function addMarker(location, isDestination) {
    var icon;
    if (isDestination) {
      icon = destinationIcon;
    } else {
      icon = originIcon;
    }
    geocoder.geocode({'address': location}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        bounds.extend(results[0].geometry.location);
        map.fitBounds(bounds);
        var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location,
          icon: icon
        });
        markersArray.push(marker);
        //// on click display info ////
        infowindow = new google.maps.InfoWindow();
        google.maps.event.addListener(marker, 'click', function() {
          var lat = this.position.A;
          var lng = this.position.F;
          codeLatLng(lat,lng);
        infowindow.setContent(displayPlace);
        infowindow.open(map, this);
      });
        //// on click display info ////
      } else {
        alert('Geocode was not successful for the following reason: '
          + status);
      }
    });
  }

  function deleteOverlays() {
    for (var i = 0; i < markersArray.length; i++) {
      markersArray[i].setMap(null);
    }
    markersArray = [];
  }
  // end distance matrix functions

  google.maps.event.addDomListener(window, 'load', initialize);

  // find zip code on map
  $("#geocodeZip").click(function(){
    codeAddress();
  });


});





