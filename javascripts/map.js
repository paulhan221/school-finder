$(document).ready(function() {
  var geocoder;
  var map;
  var address;
  var schoolData;
  var schools = [];
  var bounds = new google.maps.LatLngBounds();
  var markersArray = [];

  // marker icons
  var destinationIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=D|FF0000|000000';
  var originIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=O|FFFF00|000000';

    //////////////// get sample data //////////////////////
    $.get("http://lofischools.herokuapp.com/search?query=School&state=NY&limit=10", function(data) {
      schoolData = JSON.parse(data)["results"].forEach(function(school){
        schools.push(school["zip"])
      })
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
  }

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
          destinations: schools,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, callback);
    }
    // end calculate distance //
    $("#distanceCalc").click(function(){
        calculateDistances();
      });

  }
  // end code address //


  ////////////////////////////////////////////////////////////////////////////////////////
  // start distance matrix functions
  function callback(response, status) {
    if (status != google.maps.DistanceMatrixStatus.OK) {
      alert('Error was: ' + status);
    } else {
      var origins = response.originAddresses;
      var destinations = response.destinationAddresses;
      var outputDiv = document.getElementById('outputDiv');
      outputDiv.innerHTML = '';
      deleteOverlays();

      for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        addMarker(origins[i], false);
        for (var j = 0; j < results.length; j++) {
          addMarker(destinations[j], true);
          outputDiv.innerHTML += origins[i] + ' to ' + destinations[j]
              + ': ' + results[j].distance.text + ' in '
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
 ////////////////////////////////////////////////////////////////////////////////////////

  google.maps.event.addDomListener(window, 'load', initialize);

  // upon clicking zipcode, find on map
  $("#geocodeZip").click(function(){
    codeAddress();
  });

});





