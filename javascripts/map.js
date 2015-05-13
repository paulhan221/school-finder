$(document).ready(function() {
  var geocoder;
  var map;
  var address;
  var schools;

  function initialize() {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(-34.397, 150.644);
    var mapOptions = {
      zoom: 8,
      center: latlng
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  }

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
    // get sample data
    $.get( "http://lofischools.herokuapp.com/search?query=School&state=NY&limit=10", function(data) {
      schools = JSON.parse(data)["results"];
    debugger;
    });
  }

  google.maps.event.addDomListener(window, 'load', initialize);
  // upon clicking zipcode, find on map
  $("#codeZip").click(function(){
    codeAddress();
  });

});





