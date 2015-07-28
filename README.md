# AddLayerFromWeb-widget-js (OEI)

## Updates
7/28/2015 - Removed configuration panel from widget

## Description
Allows user to add web-service based map layer to the map.  
Supported types include ArcGIS Server Web Service, OGC Web Service (WMS), KML/KMZ, and GeoRSS. 

## Notes
There is a known issue with ESRI's LayerList widget when used in conjunction with this widget.  When a new layer has been added to the map with this widget, the LayerList widget will refresh to show the new layer, but the layer visibility of all layers will be reset to their default state, potentially making the visibile layers out of sync with what it shown in the LayerList widget.  This issue has been reported to ESRI.