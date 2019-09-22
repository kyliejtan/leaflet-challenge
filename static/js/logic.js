// Store our API endpoint inside queryUrl
let earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

function colorSelector(magnitude) {
    if (magnitude < 1) {
        return "#4FFF2F"
    }
    else if (magnitude < 2) {
        return "#BAFF2F"
    }
    else if (magnitude < 3) {
        return "#FFC300"
    }
    else if (magnitude < 4) {
        return "#FF5733"
    }
    else if (magnitude < 5) {
        return "#C70039"
    }
    else if (magnitude < 6) {
        return "#900C3F"
    }
    else {
        return "#581845"
    };
};

function getColor(d) {
    return d > 6 ? '#581845' :
           d > 5  ? '#900C3F' :
           d > 4  ? '#C70039' :
           d > 3  ? '#FF5733' :
           d > 2   ? '#FFC300' :
           d < 1   ? '#BAFF2F' :
           d > 0   ? '#4FFF2F' :
                      '#FFEDA0';
}

// Perform a GET request to the query URL
d3.json(earthquakeUrl, function(data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");

  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  let earthquakes = L.geoJSON(earthquakeData, {
      pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
              radius: Math.pow(2,feature.properties.mag),
              fillColor: colorSelector(feature.properties.mag),
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
          });
      },
      onEachFeature: onEachFeature
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Define streetmap and darkmap layers
  let streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: API_KEY
  });

  let darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.dark",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layers
  let baseMaps = {
    "Street Map": streetmap,
    "Dark Map": darkmap
  };

  // Create overlay object to hold our overlay layer
  let overlayMaps = {
    Earthquakes: earthquakes
  };

  let boundaryUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

  //access data and create layer
  d3.json(boundaryUrl, function(response) {
    //create geoJSON layer and add to map
    plateBoundaries = L.geoJSON(response, {
        style: {
            color: "orange",
            weight: 2,
            smoothFactor: 1,
            opacity: 1
        }
    })
    overlayMaps = {
      Earthquakes: earthquakes,
      'Plate Boundaries': plateBoundaries
    };

    // Create our map, giving it the streetmap and earthquakes layers to display on load
    let myMap = L.map("map", {
      center: [
        30, 0
      ],
      zoom: 2.6,
      minZoom: 2.6,
      layers: [darkmap, earthquakes, plateBoundaries]
    });

    let layerControl = L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);

    //set up the legend
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function() {
        //create a legend element
        var div = L.DomUtil.create('div', 'info legend');

        //create labels and values to find colors
        var labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];
        var grades = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

        //create legend html
        div.innerHTML = '<div><strong>Legend</strong></div>';
        for(var i = 0; i < grades.length; i++) {
            div.innerHTML += '<i style = "background: ' + getColor(grades[i]) + '">&nbsp;</i>&nbsp;&nbsp;'
            + labels[i] + '<br/>';
        };
        return div;
    };
    //add legend to map
    legend.addTo(myMap);
  });
}
