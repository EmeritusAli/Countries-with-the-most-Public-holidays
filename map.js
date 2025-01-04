async function drawMap() {
    const countryShapes = await d3.json('./world-geojson.json')
    const dataset = await d3.csv('./countries-with-the-most-holidays-2024.csv')

    const countryNameAccessor = d => d.properties['BRK_NAME']
    const countryIdAccessor = d => d.properties['ADM0_A3_IS']
    console.log(countryShapes.features)

    const metricAccessor = d => +d['Holidays']

    let dimensions = {
        width: window.innerWidth * 0.7,
        margin: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        },
      }
      dimensions.boundedWidth = dimensions.width
        - dimensions.margin.left
        - dimensions.margin.right

    const sphere = {type: "Sphere"}
    const projection = d3.geoEqualEarth()
        .fitWidth(dimensions.boundedWidth, sphere)

    const pathGenerator = d3.geoPath(projection)

    const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere)
    dimensions.boundedHeight = y1
    dimensions.height = dimensions.boundedHeight
        + dimensions.margin.top
        + dimensions.margin.bottom

    const wrapper = d3.select(".wrapper")
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)

    const bounds = wrapper.append("g")
        .style("transform", `translate(${
            dimensions.margin.left
        }px, ${
            dimensions.margin.top
        }px)`)

    const metricExtent = d3.extent(dataset, metricAccessor)
    // const matricChange = d3.max([-(metricExtent[0]), (metricExtent[1])])

    const colorScale = d3.scaleLinear()
        .domain([metricExtent[0],(metricExtent[1])/2,(metricExtent[1])])
        .range(["indigo","white", "darkgreen"])

    const earth = bounds.append("path")
        .attr("class", "earth")
        .attr("d", pathGenerator(sphere))

    const graticuleJson = d3.geoGraticule10()
    const graticule = bounds.append("path")
        .attr("class", "graticule")
        .attr("d", pathGenerator(graticuleJson))

    const countries = bounds.selectAll(".country")
        .data(countryShapes.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", pathGenerator)
        .attr("fill", d => {
            const holidays = dataset.find(country => country['country'] === countryNameAccessor(d))
            return holidays ? colorScale(metricAccessor(holidays)) : "#e2e2e2"
        })
        .attr("stroke", "#ccc")

    const legendGroup = wrapper.append("g")
        .attr("transform", `translate(${
            120
        }, ${
            dimensions.width < 800
            ? dimensions.boundedHeight - 30
            :dimensions.boundedHeight * 0.5
        })`)
    const legendTitle = legendGroup.append("text")
        .attr("y", -23)
        .attr("class", "legend-title")
        .text("Holidays per Country")

    const legendByline = legendGroup.append("text")
        .attr("y", -9)
        .attr("class", "legend-byline")
        .text("2024")

    const defs = wrapper.append("defs")
    const legendGradientId = "legend-gradient"
    const gradient = defs.append("linearGradient")
        .attr("id", legendGradientId)
        .selectAll("stop")
        .data(colorScale.range())
        .enter().append("stop")
        .attr("stop-color", d => d)
        .attr("offset", (d,i) => `${
            i * 100 / 2
        }%`)

    const legendWidth = 120
    const legendHeight = 16
    const legendGradient = legendGroup.append("rect")
        .attr("x", -legendWidth / 2)
        .attr("height", legendHeight)
        .attr("width", legendWidth)
        .style("fill", `url(#${legendGradientId})`)
        
    const legendValueRight = legendGroup.append("text")    
        .attr("class", "legend-value")
        .attr("x", legendWidth / 2 + 10)
        .attr("y", legendHeight/2)
        .text(metricExtent[1])
        .style("dominant-baseline", "middle")
    const legendValueLeft = legendGroup.append("text")
        .attr("class", "legend-value")
        .attr("x", -legendWidth / 2 - 10)
        .attr("y", legendHeight/2) 
        .text(metricExtent[0])
        .style("text-anchor", "end")
        .style("dominant-baseline", "middle")
    
    countries.on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave)

    const tooltip = d3.select("#tooltip")
    function onMouseEnter(datum) {
        tooltip.style("opacity", 1)

        const holidays = dataset.find(country => country['country'] === countryNameAccessor(datum))
        tooltip.select("#country")
            .text(countryNameAccessor(datum))
        tooltip.select("#value")
            .text(
                 holidays ? metricAccessor(holidays) : "No data"
                //metricAccessor(holidays) || 0
                )

        const [centerX, centerY] = pathGenerator.centroid(datum)

      

        const x =  centerX + dimensions.margin.left
        const y =  centerY + dimensions.margin.top

        tooltip.style("transform", `translate(`
            + `calc( -50% + ${x}px),`
            + `calc( -100% + ${y}px)`
            + `)`)

        }

    function onMouseLeave() {
                tooltip.style("opacity", 0)
            }

    
   









};

drawMap()