require([
    "esri/config",
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/FeatureLayer",
      "esri/smartMapping/renderers/color",
      "esri/smartMapping/statistics/histogram",
      "esri/widgets/smartMapping/ColorSlider",
      "esri/widgets/LayerList",
      "esri/core/reactiveUtils",
      "esri/widgets/Expand",
      "esri/widgets/Search",
      "esri/widgets/ScaleBar",
    ], (
      esriConfig,
      Map,
      MapView,
      FeatureLayer,
      colorRendererCreator,
      histogram,
      ColorSlider,
      LayerList,
      reactiveUtils,
      Expand,
      Search,
      ScaleBar
    ) => {
      esriConfig.apiKey = "AAPKb38add0673b448b69fc5ae5dd3a59476AT2hLCqPGMIFZZLlPWJOsOGVXxdj-oAyJElXg-ziBl0k4ypFRGp9lMqYw6rNtxoH";

      // Create FeatureLayer instance with popupTemplate
      const layer = new FeatureLayer({
        portalItem: {
          id: "b087dbafde2349f086c5667b5d3982bc"
        },
        popupTemplate: {
          // Autocasts as new PopupTemplate()
          title: "{NAME_1}",
          content:
            "Household median income (dollars): {MEDINCOM}",
          fieldInfos: [
            {
              fieldName: "MEDINCOM",
              format: {
                digitSeparator: true,
                places: 0
              }
            }
          ]
        }
      });

      // Create a map and add it to a MapView
      const map = new Map({
        basemap: "gray-vector",
        layers: [layer]
      });

      const view = new MapView({
        container: "viewDiv2",
        map: map,
        center: [-82.225166, 27.849889],
        zoom: 7
      });

      reactiveUtils
        .whenOnce(() => !view.updating)
        .then(() => {
          generateRenderer();
        });

      function generateRenderer() {
        // Configure parameters for the color renderer generator
        // the layer must be specified along with a field name
        // or arcade expression. The view and other properties determine
        // the appropriate default color scheme.
        const colorParams = {
          layer: layer,
          valueExpression:
            "$feature.MEDINCOM ",
          view: view,
          theme: "above-and-below",
          outlineOptimizationEnabled: true
        };

        // Generate a continuous color renderer based on the
        // statistics of the data in the provided layer
        // and field normalized by the normalizationField.
        //
        // This resolves to an object containing several helpful
        // properties, including color scheme, statistics,
        // the renderer and visual variable
        let rendererResult;

        colorRendererCreator
          .createContinuousRenderer(colorParams)
          .then((response) => {
            // Set the renderer to the layer and add it to the map
            rendererResult = response;
            layer.renderer = rendererResult.renderer;

            // Generate a histogram for use in the slider. Input the layer
            // and field or arcade expression to generate it.
            return histogram({
              layer: layer,
              valueExpression: colorParams.valueExpression,
              view: view,
              numBins: 70
            });
          })
          .then((histogramResult) => {
            // Construct a color slider from the result of both
            // smart mapping renderer and histogram methods
            const colorSlider = ColorSlider.fromRendererResult(
              rendererResult,
              histogramResult
            );
             colorSlider.container = "slider";
            colorSlider.primaryHandleEnabled = true;
            // Round labels to 1 decimal place
            colorSlider.labelFormatFunction = (value, type) => {
              return value.toFixed(1);
            };
            colorSlider.viewModel.precision = 1;

            const sliderExpand = new Expand({
              expandTooltip: "Show Slider",
              expanded: false,
              view: view,
              content: colorSlider
            });

            //view.ui.add(sliderExpand, "bottom-right");

            // When the user slides the handle(s), update the renderer
            // with the updated color visual variable object
            function changeEventHandler() {
              const renderer = layer.renderer.clone();
              const colorVariable = renderer.visualVariables[0].clone();
              const outlineVariable = renderer.visualVariables[1];
              colorVariable.stops = colorSlider.stops;
              renderer.visualVariables = [colorVariable, outlineVariable];
              layer.renderer = renderer;
            }

            colorSlider.on(
              ["thumb-change", "thumb-drag", "min-change", "max-change"],
              changeEventHandler
            );
          })
          .catch((error) => {
            console.error("Error: ", error);
          });
      }

      // helper function for returning a layer instance
        // based on a given layer title


        // When the view loads, set up UI elements
        let layerList, predominanceLayer;

        view.when(function () {
          predominanceLayer = layer 
          predominanceLayer.outFields = ["*"];

          // Update the pie chart after once the layer view updating becomes false
          view.whenLayerView(predominanceLayer).then((layerView) => {
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
            view: view,
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
          let panelDiv = document.getElementById("panel2");
          panelDiv.appendChild(layerList.container);
        });

        // Query the layer view for statistics on each education variable in the layer
        function queryLayerViewStats(layerView) {
          const educationFields = [
            "EDUC01_CY",
            "EDUC02_CY",
            "EDUC03_CY",
            "EDUC04_CY",
            "EDUCA_BASE"
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
          query.geometry = view.extent;

          // query features within the view's extent on the client
          return layerView.queryFeatures(query).then(function (response) {
            const stats = response.features[0].attributes;

            const updatedData = [
              stats.EDUC01_CY_TOTAL, // 15-24
              stats.EDUC02_CY_TOTAL, // 25-44
              stats.EDUC03_CY_TOTAL, // 45-64
              stats.EDUC04_CY_TOTAL, // 65+

            ];

            // data used to update the pie chart
            return {
              total: stats.EDUCA_BASE_TOTAL, // total population 12+
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
          const title = "Median income";
          if (!chart) {
            // get the canvas element created in the LayerList
            // and use it to render the chart
            const canvasElement = layerList.operationalItems.find(function (
              item
            ) {
              return predominanceLayer.title === item.title;
            }).panel.content[1];
            const canvasElement2 = document.getElementById("panel2").getContext("2d");

            // chart = new Chart(canvasElement.getContext("2d"), {
            chart = new Chart(canvasElement2, {
              type: "bar",
              data: {
                labels: [
                  "15 to 24 years",
                  "25 to 44 years",
                  "45 to 64 years",
                  "65 years and over"
                  
                ],
                datasets: [
                  {
                    label: "Median income",
                    backgroundColor: [
                      "#9e549c",
                      "#ffde3e",
                      "#149dcf",
                      "#ed5050",
                    ],
                    borderColor: "rgb(255, 255, 255)",
                    borderWidth: 1,
                    data: newData
                  }
                ]
              },
              options: {
                responsive: true,
                // height:200,
                maintainAspectRatio: false,
                scales: {
                  yAxes: [{
                    ticks: {
                      reverse: false,
                      // stepSize:5000
                    }
                  }]
                },
                // cutoutPercentage: 35,
                // Not an ArcGIS legend instance. This legend
                // is constructed for the pie chart, not the
                // features in the view, though the colors match
                // the colors of the features displayed in the map view
                legend: {
                  display: false
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


        const search = new Search({
          view: view,
          resultGraphicEnabled: false,
          popupEnabled: false
        });
        view.ui.add(search, "top-right");

        const scalebar = new ScaleBar({
          view: view
        });

        view.ui.add(scalebar, "bottom-right");


    });