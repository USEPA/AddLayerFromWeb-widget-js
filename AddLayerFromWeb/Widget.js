define(

['dojo/_base/declare',
'jimu/BaseWidget',
'dojo/_base/lang',
'dojo/on',
'dojo/dom-construct',
 'dijit/_Widget',
 'dijit/_Templated',
 'dijit/_WidgetBase',
 'dijit/_TemplatedMixin',
 'dijit/_WidgetsInTemplateMixin',
 'dojo/Evented',
 'dijit/form/Form',
 'dijit/form/RadioButton', 'dijit/form/DropDownButton', 'dijit/form/Button', 'dijit/form/TextBox', 'dijit/form/ComboBox', 'dijit/form/FilteringSelect',
 'dojox/layout/FloatingPane',
 "esri/request",
 'esri/layers/ArcGISDynamicMapServiceLayer', 'esri/layers/ArcGISTiledMapServiceLayer', 'esri/layers/FeatureLayer',"esri/layers/ArcGISImageServiceLayer","esri/layers/ImageServiceParameters",
 'esri/layers/GeoRSSLayer', 'esri/layers/KMLLayer', 'esri/layers/WMSLayer',
 'esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleLineSymbol',
 'esri/renderers/SimpleRenderer',
 './configLocal'
], function (
  declare,
  BaseWidget,
  lang,
  on,
  domConstruct,
  _Widget,
  _Templated,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  Evented,
  Form,
  RadioButton, DropDownButton, Button, TextBox, ComboBox, FilteringSelect,
  FloatingPane,
  esriRequest,
  ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, FeatureLayer,ArcGISImageServiceLayer,ImageServiceParameters,
  GeoRSSLayer, KMLLayer, WMSLayer,
  SimpleMarkerSymbol, SimpleLineSymbol,
  SimpleRenderer,
  _config
) {
    
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget,_WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    baseClass: 'jimu-widget-AddLayerFromWeb',
    
    //this property is set by the framework when widget is loaded.
     name: 'AddLayerFromWeb',
     servicetype: 'arcgis',

 
        postCreate: function () {
            
            this._doService();
        },
        _doService: function () {
            var sampleURL = _config.sampleURL;
            var stype = this.servicetype;
            dojo.query('[name=layerType]').filter(function (radio) {
                if (radio.checked) stype = radio.value;
            });
            this.servicetype = stype;
            this.urlNode.value = "http://";

            this.notediv1.innerHTML = sampleURL[stype].note;
            this.samplediv.innerHTML = "Sample URL: <br/>" + sampleURL[stype].url;

        },
        _boxenter: function(e) {
          
          if (e && e.keyCode === 13) {
               this._addRemoteLyr();
           } else {
               return false;
           }

           },
        _addRemoteLyr: function (e) {
            this.statusdiv.innerHTML = "Adding service to the map...";
            var svcurl = this.urlNode.value;
            svcurl = dojo.trim(svcurl);
            var svctype = this.servicetype;

            if (svcurl.substr(0, 4).toLowerCase() != "http") {
                this.statusdiv.innerHTML = "invalid URL. Please enter a url starts with 'http'!";
                return false;
            }
            var rid = this._getUniqueId(svctype);
            this._addServiceLayer(svctype, svcurl, rid);
        },
        _addServiceLayer: function (stype, surl, sid) {
            switch (stype.toLowerCase()) {
                case 'arcgis':
                    if (surl.substr(surl.length - 1) == "/") surl = surl.substr(0, surl.length - 1);
                    var agsurl = surl;
                    var imgpattern = /\/imageserver$/i;
                    var mapserverptn = /\/mapserver$/i;
                    var featpattern = /\/featureserver/i;
                    if (imgpattern.test(agsurl)) {
                        var params = new ImageServiceParameters();
                        params.noData = 0;
                        var templayer = new ArcGISImageServiceLayer(agsurl, {
                          imageServiceParameters: params,
                          opacity: 0.8
                        });
                        this.map.addLayer(templayer);
                        templayer.on("error", this.errorHandler);
                        templayer.on("load",lang.hitch(this, this.removespining));
                    } else if (featpattern.test(agsurl)) {
                        var fpattern = /\/featureserver$/i;
                        var spattern = /\/featureserver\/\d+$/i;
                        if (fpattern.test(surl)) {
                            
                            esri.request({
                             url: agsurl,
                             content: { f: "json" },
                             callbackParamName: "callback",
                             handleAs: "json",
                             load: dojo.hitch(this, function (r) {
                                 if (r.layers) {
                                    for (var m=0; m< r.layers.length; m++){
                                        var layerid = r.layers[m].id;
                                        var featurl = agsurl + "/" + layerid;
                                        var ftemplate = new esri.InfoTemplate();
                                        var templayer = new FeatureLayer(featurl, {
                                          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
                                          id: sid + "_" + layerid,
                                          infoTemplate: ftemplate,
                                          outFields: ["*"]
                                      });
                                      this.map.addLayer(templayer);
                                      templayer.on("error", this.errorHandler);
                                      templayer.on("load", lang.hitch(this, this.removespining));
                                      
                                    }
                                 }
                                 
                             }),
                             error: function (e) {
                                 alert("error occurred on getting feature layers:" + e.message);
                             }
                         });
                            
                        } else if (spattern.test(surl)) {
                            var ftemplate = new esri.InfoTemplate();
                            var templayer = new FeatureLayer(surl, {
                              mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
                              id: sid,
                              infoTemplate: ftemplate,
                              outFields: ["*"]
                          });
                          this.map.addLayer(templayer);
                          templayer.on("error", this.errorHandler);
                          templayer.on("load", lang.hitch(this, this.removespining));
                          
                      }

                    } else if (mapserverptn.test(agsurl)) {
                        var wobj = this;
                        var serviceRequest = esriRequest({
                          url: agsurl + "?f=json",
                          handleAs: "json"
                        });
                        serviceRequest.then(function (robj) {
                            var parentLayerName = robj.documentInfo.Title;
                            var templayer;
                            if (robj.tileInfo) {
                                if (robj.tileInfo.rows == "256") {
                                    templayer = new ArcGISTiledMapServiceLayer(agsurl, {
                                        id: sid,
                                        opacity: 0.8
                                    });
                                } else {
                                    templayer = new ArcGISDynamicMapServiceLayer(agsurl, {
                                        id: sid,
                                        opacity: 0.8
                                    });
                                }
                            } else if (robj.layers) {
                                templayer = new ArcGISDynamicMapServiceLayer(agsurl, {
                                    id: sid,
                                    opacity: 0.8
                                });
                            }
                            templayer.name = parentLayerName;
                            wobj.map.addLayer(templayer);
                            templayer.on("error", wobj.errorHandler);
                            templayer.on("load",lang.hitch(wobj, wobj.removespining));
                        }, function(err) { console.log("Error occurred: " + err.message)});
                        
                    } else {
                        //alert("Invalid ArcGIS map service URL. Please modify the URL and try again.");
                        this.statusdiv.innerHTML = "Invalid ArcGIS map service URL. Please modify the URL and try again.";
                    }
                    
                    break;
                case 'wms':
                    var wmsarray = surl.split("?");
                    var wmsbaseurl = wmsarray[0];
                    var wmsparas = unescape(wmsarray[1]);
                    var paras = wmsparas.split("&");
                    var wmslayers = [];
                    for (var m = 0; m < paras.length; m++) {
                        var pairstr = paras[m];
                        if (pairstr.split("=")[0].toLowerCase() == "layers") {
                            players = pairstr.split("=")[1];
                            if (players.length > 0) {
                                if (players.indexOf(",") > 0) {
                                    var parray = players.split(",");
                                    for (var k = 0; k < parray.length; k++) {
                                        wmslayers.push(parray[k]);
                                    }
                                } else {
                                    wmslayers.push(players);
                                }
                            }
                        }
                    }
                    var wmsLayer = new WMSLayer(wmsbaseurl, { id: sid });
                    if (wmslayers.length > 0) {
                        wmsLayer.setVisibleLayers(wmslayers);
                    }
                    wmsLayer.setImageFormat("png");
                    this.map.addLayer(wmsLayer);
                    wmsLayer.on("load",lang.hitch(this, this.removespining));

                    break;
                case 'kml':
                    var kml = new KMLLayer(surl, { id: sid });
                    this.map.addLayer(kml);
                    kml.on("load",lang.hitch(this, this.removespining));
                   break;
                case 'georss':
                    var georss = new GeoRSSLayer(surl, { id: sid });
                    this.map.addLayer(georss);
                    georss.on("load",lang.hitch(this, this.removespining));
                    break;
                
            }
            return false;
        },
        errorHandler: function (err) {
            alert("error occurred: " + err.message);
        },
        _getUniqueId: function (svctype) {
            var ulayerid = "";
            var scount = 1;
            var condition = true;
            while (condition) {
                if (this.map.getLayer(svctype + scount)) {
                    scount = scount + 1;
                    contition = true;
                } else {
                    ulayerid = svctype + scount;
                    condition = false;
                }
            }
            return ulayerid;
        },
        
        removespining: function () {
            this.statusdiv.innerHTML = "The service has been added to the map.";
        },
        onOpen: function(){
          this.statusdiv.innerHTML = "";
          this.urlNode.value = "http://";
        },
        destroy: function () {

            //this.Render.destroy();
            dojo.empty(this.domNode);
            this.inherited(arguments);
        }

    

    // onClose: function(){
    //   console.log('onClose');
    // },

    // onMinimize: function(){
    //   console.log('onMinimize');
    // },

    // onMaximize: function(){
    //   console.log('onMaximize');
    // },

    // onSignIn: function(credential){
    //   /* jshint unused:false*/
    //   console.log('onSignIn');
    // },

    // onSignOut: function(){
    //   console.log('onSignOut');
    // }
      
    // onPositionChange: function(){
    //   console.log('onPositionChange');
    // },

    // resize: function(){
    //   console.log('resize');
    // }

//methods to communication between widgets:

  });
});