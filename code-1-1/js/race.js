require([
    "esri/config",
    "esri/WebMap",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/renderers/DotDensityRenderer",
    "esri/widgets/Legend",
    "esri/widgets/Bookmarks",
    "esri/widgets/Expand",
    "esri/widgets/LayerList",
    "esri/core/reactiveUtils",
    "esri/widgets/Search",
    "esri/widgets/ScaleBar",
  ], function (
    esriConfig,
    WebMap,
    MapView,
    FeatureLayer,
    DotDensityRenderer,
    Legend,
    Bookmarks,
    Expand,
    LayerList,
    reactiveUtils,
    Search,
    ScaleBar
  ) {

    esriConfig.apiKey = "AAPK5bea060f3e5542f49beb3df87425c165lUc75WZfes0WkEhNQBxK8AUn34ef6Hh2QMOrfNSnbbysAAwnJUOIFEAeqTtKrrNk";

    const map3 = new WebMap({
      portalItem: {
        id: "f30090788f8e48ec992cc130dc94981c"
      }
    });

    const view3 = new MapView({
      container: "viewDiv3",
      map: map3,
      zoom: 8,
      center: [-82.225166, 27.849889],
      highlightOptions: {
        fillOpacity: 0,
        color: [50, 50, 50]
      },
      popup: {
        dockEnabled: true,
        dockOptions: {
          position: "top-right",
          breakpoint: false
        }
      },
      constraints: {
        maxScale: 35000,
        snapToZoom: false
      }
    });

    view3.when().then(function () {


      const dotDensityRenderer = new DotDensityRenderer({
        dotValue: 100,
        outline: null,
        referenceScale: 577790, // 1:577,790 view scale
        legendOptions: {
          unit: "people"
        }
      });



      dotDensityRenderer.attributes = [
        {
          field: "P1_003N",
          color: "#f23c3f",
          label: "White"
        },
        {
          field: "P1_004N",
          color: "#00b6f1",
          label: "Black or African American"
        },
        {
          field: "P1_006N",
          color: "#32ef94",
          label: "Asian"
        },
        {
          field: "P1_005N",
          color: "#ff7fe9",
          label: "American Indian/Alaskan Native"
        },
        {
          field: "P1_007N",
          color: "#e2c4a5",
          label: "Pacific Islander/Hawaiian Native"
        },
        {
          field: "P1_008N",
          color: "#ff6a00",
          label: "Other race"
        },
        {
          field: "P1_009N",
          color: "#96f7ef",
          label: "Two or more races"
        }
      ];


      // Add renderer to the layer and define a popup template
      const url = "https://services5.arcgis.com/KiRa9d9aHfdXiCqt/arcgis/rest/services/Florida_2020/FeatureServer";
      const racelayer = new FeatureLayer({
        url: url,
        minScale: 20000000,
        maxScale: 35000,
        title: "Population by race (2020)",
        popupTemplate: {
          title: "{NAME_1}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "P1_001N",
                  label: "Total Population",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                },
                {
                  fieldName: "P1_003N",
                  label: "White",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                },
                {
                  fieldName: "P1_004N",
                  label: "Black or African American",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                },
                {
                  fieldName: "P1_006N",
                  label: "Asian",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                },
                {
                  fieldName: "P1_005N",
                  label: "American Indian/Alaskan Native",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                },
                {
                  fieldName: "P1_007N",
                  label: "Pacific Islander/Hawaiian Native",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                },
                {
                  fieldName: "P1_008N",
                  label: "Other race",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                },
                {
                  fieldName: "P1_009N",
                  label: "Two or more races",
                  format: {
                    digitSeparator: true,
                    places: 0
                  }
                }
              ]
            }
          ]
        },
        renderer: dotDensityRenderer
      });

      map3.add(racelayer);

      view3.ui.add(
        [
          new Expand({
            view: view3,
            content: new Legend({ view: view3 }),
            group: "top-right",
            expanded: true
          }),
          new Expand({
            view: view3,
            content: new Bookmarks({ view: view3, editingEnabled: true }),
            group: "top-right"
          })
        ],
        "top-right"
      );
    
    
////////////////////////////////////////////////////////////////////////////////
        // helper function for returning a layer instance
        // based on a given layer title
        function findLayerByTitle(title) {
          return view3.map3.allLayers.find(function (layer) {
            return layer.title === title;
          });
        }


        // When the view loads, set up UI elements
        let layerList, predominanceLayer;

        view3.when(function () {
          predominanceLayer = racelayer; 
          predominanceLayer.outFields = ["*"];

          // Update the pie chart after once the layer view updating becomes false
          view3.whenLayerView(predominanceLayer).then((layerView) => {
            reactiveUtils.when(
              () => !layerView.updating,
              () => {
                queryLayerViewStats(layerView).then(function (newData) {
                  updateChart(newData);
                });
              }
            );
          });

          // Add a LayerList instance to the view with
          // custom text and a canvas element in the list item panel
          // for rendering a chart to display query results

          layerList = new LayerList({
            view: view3,
            container: document.createElement("div"),
            listItemCreatedFunction: function (event) {
              const item = event.item;

              // add the pie chart to the Predominance layer list item panel
              if (item.title === predominanceLayer.title) {
                item.panel = {
                  content: [
                    [
                      //"<b>Median income</b>"
                    ].join(""),

                    document.createElement("canvas"),

                    
                  ],
                  className: "esri-icon-pie-chart",
                  open: item.visible
                };
              }
            }
          });
          layerList.container.style = "height: 100%";
          let panelDiv = document.getElementById("panel3");
          panelDiv.appendChild(layerList.container);
        });

        // Query the layer view for statistics on each education variable in the layer
        function queryLayerViewStats(layerView) {
          const educationFields = [
            "P1_003N",
            "P1_004N",
            "P1_005N",
            "P1_006N",
            "P1_007N",
            "P1_008N",
            "P1_009N",
            "P1_001N"
            
          ];

          // Creates a query object for statistics of each of the fields listed above
          const statDefinitions = educationFields.map(function (fieldName) {
            return {
              onStatisticField: fieldName,
              outStatisticFieldName: fieldName + "_TOTAL",
              statisticType: "sum"
            };
          });

          // query statistics for features only in view extent
          const query = layerView.layer.createQuery();
          query.outStatistics = statDefinitions;
          query.geometry = view3.extent;

          // query features within the view's extent on the client
          return layerView.queryFeatures(query).then(function (response) {
            const stats = response.features[0].attributes;

            const updatedData = [
              stats.P1_003N_TOTAL, 
              stats.P1_004N_TOTAL, 
              stats.P1_005N_TOTAL, 
              stats.P1_006N_TOTAL,
              stats.P1_007N_TOTAL, 
              stats.P1_008N_TOTAL, 
              stats.P1_009N_TOTAL,

            ];

            // data used to update the pie chart
            return {
              total: stats.P1_001N_TOTAL, // total population 12+
              values: updatedData
            };
          });
        }

        // Create a chart to display in a LayerList panel
        // The chart is created using the Chart.js library
        let chart, totalCount;

        function updateChart(response) {
          const newData = response.values;
          totalCount = response.total;
          const title = "Race";
          if (!chart) {
            // get the canvas element created in the LayerList
            // and use it to render the chart
            const canvasElement = layerList.operationalItems.find(function (
              item
            ) {
              return predominanceLayer.title === item.title;
            }).panel.content[1];
            const canvasElement2 = document.getElementById("panel3");

            // chart = new Chart(canvasElement.getContext("2d"), {
            chart = new Chart(canvasElement2, {
              type: "doughnut",
              data: {
                labels: [
                  "White",
                  "Black or African American",
                  "American Indian and Alaska Native",
                  "Asian",
                  "Native Hawaiian and Other Pacific Islander",
                  "Some Other Race",
                  "two or more races",
                  
                ],
                datasets: [
                  {
                    label: "Population by educational attainment",
                    backgroundColor: [
                      "#f23c3f",
                      "#00b6f1",
                      "#32ef94",
                      "#ff7fe9",
                      "#e2c4a5",
                      "#ff6a00",
                      "#96f7ef",
                    ],
                    borderColor: "rgb(255, 255, 255)",
                    borderWidth: 1,
                    data: newData
                  }
                ]
              },
              options: {
                responsive: true,
                cutoutPercentage: 35,
                // Not an ArcGIS legend instance. This legend
                // is constructed for the pie chart, not the
                // features in the view, though the colors match
                // the colors of the features displayed in the map view
                legend: {
                  position: "bottom"
                },
                title: {
                  display: true,
                  text: title
                },

              }
            });
          } else {
            chart.options.title.text = title;
            chart.data.datasets[0].data = newData;
            chart.update();
          }
        }
      });

      const search = new Search({
        view: view3,
        resultGraphicEnabled: false,
        popupEnabled: false
      });

      const scalebar = new ScaleBar({
            view: view3
          });
      view3.ui.add(search, "top-right");
      view3.ui.add(scalebar, "bottom-right");
});