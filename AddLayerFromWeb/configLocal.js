define(
[],
function() {
  var _config = {"sampleURL": {
        "arcgis": { "url": "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer"
                , "note": "(http://&lt;server&gt;/arcgis/rest/services/&lt;service name&gt;/MapServer)"
        }
	    , "wms": { "url": "http://sampleserver1.arcgisonline.com/arcgis/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/WMSServer?layers=1,2"
	                , "note": "<font color=red>Note: WMS service will not overlay well if the service does not have Mecator projection available.</font>"
	    }
	    , "kml": { "url": "http://www.epa.gov/airnow/today/airnow_today.kml"
	                , "note": "<font color=red>Note: The KML/KMZ url must be publicly accessible.</font>"
	    }
	    , "georss": { "url": "http://dev.openlayers.org/examples/georss.xml"
	                , "note": "<font color=red>Note: The GeoRSS url must be publicly accessible.</font>"
	    }
    }
}
return _config;
  
});

