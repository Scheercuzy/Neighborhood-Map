"use strict";
// Global variables
var map;
var infoWindow;
var bounds;

// Google Map initMap Callback function
function initMap() {
  // Constants
  var CONSTANTS = {
    "MAP_ZOOM": 13,
    "MAP_CENTER": {
      lat: 16.811945,
      lng: 96.164325
    },
    "MAP_TYPE_CONTROL": false
  }

  // create map element
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: CONSTANTS.MAP_ZOOM,
    center: CONSTANTS.MAP_CENTER,
    mapTypeControl: CONSTANTS.MAP_TYPE_CONTROL
  });

  infoWindow = new google.maps.InfoWindow();

  bounds = new google.maps.LatLngBounds();

  ko.applyBindings(new ViewModel());
}

// In case of an error
function googleMapsError() {
  alert("An error occurred with Google Maps");
}

var ViewModel = function() {
  var self = this;

  // observable for the search field
  this.searchField = ko.observable("");

  // the marker observable array of all locations
  this.markerLocationArray = ko.observableArray([]);

  // Creates and adds the location markers to markerLocationArray
  locations.forEach(function(location) {
    self.markerLocationArray.push(new LocationMarker(location));
  });

  // locations viewed on map
  this.locationList = ko.computed(function() {
    var searchFilter = self.searchField().toLowerCase();
    if (searchFilter) {
      return ko.utils.arrayFilter(self.markerLocationArray(), function(
        location
      ) {
        var str = location.title.toLowerCase();
        var result = str.includes(searchFilter);
        location.visible(result);
        return result;
      });
    }
    self.markerLocationArray().forEach(function(location) {
      location.visible(true);
    });
    return self.markerLocationArray();
  }, self);
};

// Location Marker
var LocationMarker = function(data) {
  var self = this;

  this.title = data.title;
  this.position = data.coord;
  this.address = "";
  this.city = "";

  this.visible = ko.observable(true);

  // default icon values
  var defaultIconVar = {
    size: new google.maps.Size(36, 36),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17, 36),
    scaledSize: new google.maps.Size(36, 36)
  };
  // markerIcon
  var markerIcon = {
    url: "static/img/marker.png",
    ...defaultIconVar
  };
  // highlighted markerIcon
  var highlightedMarkerIcon = {
    url: "static/img/highlighted_marker.png",
    ...defaultIconVar
  };

  // Get Data from Foursquqre
  var clientID = "UXTATIOBDA5ND1NBMIOKHA2B3JWEYPEIAZ4OHF52APGXKGPG";
  var clientSecret = "XGFAFJA2F35LJAFCXNRDVMIV1MYM1KHXVTANEUCPK5ZT0Q04";

  // get JSON request of Foursquare data
  var reqURL =
    "https://api.foursquare.com/v2/venues/search?ll=" +
    this.position.lat +
    "," +
    this.position.lng +
    "&client_id=" +
    clientID +
    "&client_secret=" +
    clientSecret +
    "&v=20180919" +
    "&query=" +
    this.title;

  $.getJSON(reqURL)
    .done(function(data) {
      var results = data.response.venues[0];
      self.address = results.location.formattedAddress[0]
        ? results.location.formattedAddress[0]
        : "N/A";
      self.city = results.location.formattedAddress[1]
        ? results.location.formattedAddress[1]
        : "N/A";
    })
    .fail(function() {
      alert("Something went wrong with foursquare");
    });

  // Create a new marker
  this.marker = new google.maps.Marker({
    position: this.position,
    title: this.title,
    animation: google.maps.Animation.DROP,
    icon: markerIcon
  });

  // Shows marker if its set as visible
  self.filterMarkers = ko.computed(function() {
    // Set marker and extend bounds
    if (self.visible() === true) {
      self.marker.setMap(map);
      self.marker.setVisible(true)
      bounds.extend(self.marker.position);
      map.fitBounds(bounds);
    } else {
      self.marker.setVisible(false);
    }
  });

  // Create an onclick even to open the infowindow
  this.marker.addListener("click", function() {
    infoWindowContent(this, self.address, self.city, infoWindow);
    toggleMarkerBounce(this);
    map.panTo(this.getPosition());
  });

  // For marker hover effect
  this.marker.addListener("mouseover", function() {
    this.setIcon(highlightedMarkerIcon);
  });
  this.marker.addListener("mouseout", function() {
    this.setIcon(markerIcon);
  });

  // show item info when selected from list
  this.show = () => {
    google.maps.event.trigger(self.marker, "click");
  };
};

// Info Window Content
function infoWindowContent(marker, address, city, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.setContent("");
    infowindow.marker = marker;

    infowindow.addListener("closeclick", function() {
      infowindow.marker = null;
    });

    var windowContent = `<h4>${marker.title}</h4><p>${address}</p><p>${city}</p>`

    infowindow.setContent(windowContent);
    infowindow.open(map, marker);
  }
}

// Toggle to bounce markers
function toggleMarkerBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
      marker.setAnimation(null);
    }, 1400);
  }
}
