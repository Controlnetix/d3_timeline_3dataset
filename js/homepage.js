/* d3.json("/get_timeline_data", {
    method: "POST",
    body: JSON.stringify({
        date: Date.now(),
    })
}).then((data) => {
    DrawTimeLine(data["ProductionData"], data["DowntimeData"]);
    DrawTimeLinePanel(data["ProductionData"], data["DowntimeData"]);
}).catch((error) => {
    console.error("Error loading the data: " + error);
});
 */

function DrawTimeLinePanel(productionDataset, downtimeDataset, poweroffDataset) {
    const xAccessor = d => d["Date"]
    const yAccessor = d => d["Value"]
    let dimensionsPanel = {
        width: screen.width - 500,
        height: 40,
        margin: {top: 0, right: 40, bottom: 20, left: 40,},
    }

    const wrapperPanel = d3.select("#timeline-panel")
        .append("svg")
        .attr("viewBox", "0 0 " + dimensionsPanel.width + " " + dimensionsPanel.height)
    const boundsPanel = wrapperPanel.append("g")

    const chartStartsAt = productionDataset[0]["Date"]
    const chartEndsAt = productionDataset[productionDataset.length - 1]["Date"]

    const xScalePanel = d3.scaleTime()
        .domain([chartStartsAt, chartEndsAt])
        .range([dimensionsPanel.margin.left, dimensionsPanel.width - dimensionsPanel.margin.right])
    const yScalePanel = d3.scaleLinear()
        .domain(d3.extent(productionDataset, yAccessor))
        .range([dimensionsPanel.height - dimensionsPanel.margin.bottom, 0])

    const productionAreaGeneratorPanel = d3.area()
        .x(d => xScalePanel(xAccessor(d)))
        .y0(dimensionsPanel.height - dimensionsPanel.margin.bottom)
        .y1(d => yScalePanel(yAccessor(d)))
        .curve(d3.curveStepAfter)
    const downtimeAreaGeneratorPanel = d3.area()
        .x(d => xScalePanel(xAccessor(d)))
        .y0(dimensionsPanel.height - dimensionsPanel.margin.bottom)
        .y1(d => yScalePanel(yAccessor(d)))
        .curve(d3.curveStepAfter);
    //add poweroff
    const poweroffAreaGeneratorPanel = d3.area()
        .x(d => xScalePanel(xAccessor(d)))
        .y0(dimensionsPanel.height - dimensionsPanel.margin.bottom)
        .y1(d => yScalePanel(yAccessor(d)))
        .curve(d3.curveStepAfter);

    const timeScalePanel = d3.scaleTime()
        .domain([new Date(chartStartsAt * 1000), new Date(chartEndsAt * 1000)])
        .range([dimensionsPanel.margin.left, dimensionsPanel.width - dimensionsPanel.margin.right])
    boundsPanel.append("g")
        .attr("transform", "translate(0," + (dimensionsPanel.height - dimensionsPanel.margin.bottom) + ")")
        .call(d3.axisBottom(timeScalePanel))

    boundsPanel.append("path")
        .attr("d", productionAreaGeneratorPanel(productionDataset))
        .attr("fill", "green")
    boundsPanel.append("path")
        .attr("d", downtimeAreaGeneratorPanel(downtimeDataset))
        .attr("fill", "orange")
    //add poweroff
    boundsPanel.append("path")
        .attr("d", poweroffAreaGeneratorPanel(poweroffDataset))
        .attr("fill", "red")

    const brush = d3.brushX()
        .extent([[dimensionsPanel.margin.left, 0.5], [dimensionsPanel.width - dimensionsPanel.margin.right, dimensionsPanel.height - dimensionsPanel.margin.bottom + 0.5]])
        .on("brush", updateData)
        .on("end", updateData)

    wrapperPanel.append("g")
        .call(brush)

    function updateData({selection}) {
        if (selection) {
            let startBrush = xScalePanel.invert(selection[0]) / 1000
            let endBrush = xScalePanel.invert(selection[1]) / 1000
            if (selection[0] > 0) {
                document.getElementById("timeline").innerHTML = ""
                let {productionDatasetUpdated, downtimeDatasetUpdated, poweroffDatasetUpdated} = updateDatasets(productionDataset, downtimeDataset, poweroffDataset, startBrush, endBrush);
                DrawTimeLine(productionDatasetUpdated, downtimeDatasetUpdated, poweroffDatasetUpdated);
            }
        }

    }
}

function updateDatasets(productionDataset, downtimeDataset, poweroffDataset, startBrush, endBrush) {
    let productionDatasetUpdated
    productionDatasetUpdated = []
    let downtimeDatasetUpdated
    downtimeDatasetUpdated = []
    let poweroffDatasetUpdated
    poweroffDatasetUpdated = []
    let startBrushing1 = true
    let startBrushing2 = true
    let startBrushing3 = true
    let lastValueInBrush1 = 0
    let lastValueInBrush2 = 0
    let lastValueInBrush3 = 0
    let lastValueBeforeBrush1 = 0
    let lastValueBeforeBrush2 = 0
    let lastValueBeforeBrush3 = 0

    //productionDataset
    for (const actualElement1 of productionDataset) {
        if (+(actualElement1["Date"] / 1000) < +startBrush) {
            lastValueBeforeBrush1 = actualElement1["Value"]
        } else if ((+(actualElement1["Date"] / 1000) >= +startBrush) && (+(actualElement1["Date"] / 1000) <= +endBrush)) {
            if (startBrushing1) {
                console.log("First value from brush selection, inserting initial data into both datasets, based on actual value")
                if (actualElement1["Value"] === 1) {
                    productionDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
                    productionDatasetUpdated.push({Date: actualElement1["Date"], Value: 1})
                } else {
                    productionDatasetUpdated.push({Date: startBrush * 1000, Value: 1}) //*
                    productionDatasetUpdated.push({Date: actualElement1["Date"], Value: 0})
                }
                startBrushing1 = false
            } else {
                console.log("Adding data to new datasets")
                if (actualElement1["Value"] === 1) {
                    productionDatasetUpdated.push({Date: actualElement1["Date"], Value: 1})
                } else {
                    productionDatasetUpdated.push({Date: actualElement1["Date"], Value: 0})
                }
            }
            lastValueInBrush1 = actualElement1["Value"]
        }
    }
    if (productionDatasetUpdated.length > 0) {
        console.log("Closing new dataset with proper value, based on last value in brush selection")
        if (lastValueInBrush1 === 1) {
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        } else {
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 1})
        }
        
    } else {
        console.log("No data in brush selection, inserting data based on last value before brush")
        if (lastValueBeforeBrush1 === 1) {
            productionDatasetUpdated.push({Date: startBrush * 1000, Value: 1})
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        } else {
            productionDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 1})
        }
        
    }

    //downtimeDataset
    for (const actualElement2 of downtimeDataset) {
        if (+(actualElement2["Date"] / 1000) < +startBrush) {
            lastValueBeforeBrush2 = actualElement2["Value"]
        } else if ((+(actualElement2["Date"] / 1000) >= +startBrush) && (+(actualElement2["Date"] / 1000) <= +endBrush)) {
            if (startBrushing2) {
                console.log("First value from brush selection, inserting initial data into both datasets, based on actual value")
                if (actualElement2["Value"] === 2) {
                    downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
                    downtimeDatasetUpdated.push({Date: actualElement2["Date"], Value: 2})
                } else {
                    downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 2}) //*
                    downtimeDatasetUpdated.push({Date: actualElement2["Date"], Value: 0})
                }
                startBrushing2 = false
            } else {
                console.log("Adding data to new datasets")
                if (actualElement2["Value"] === 2) {
                    downtimeDatasetUpdated.push({Date: actualElement2["Date"], Value: 2})
                } else {
                    downtimeDatasetUpdated.push({Date: actualElement2["Date"], Value: 0})
                }
            }
            lastValueInBrush2 = actualElement2["Value"]
        }
    }
    if (downtimeDatasetUpdated.length > 0) {
        console.log("Closing new dataset with proper value, based on last value in brush selection")
        if (lastValueInBrush2 === 2) {
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        } else {
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 2})
        }
        
    } else {
        console.log("No data in brush selection, inserting data based on last value before brush")
        if (lastValueBeforeBrush2 === 2) {
            downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 2})
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        } else {
            downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 2})
        }
        
    }

    //poweroffDataset
    for (const actualElement3 of poweroffDataset) {
        if (+(actualElement3["Date"] / 1000) < +startBrush) {
            lastValueBeforeBrush3 = actualElement3["Value"]
        } else if ((+(actualElement3["Date"] / 1000) >= +startBrush) && (+(actualElement3["Date"] / 1000) <= +endBrush)) {
            if (startBrushing3) {
                console.log("First value from brush selection, inserting initial data into both datasets, based on actual value")
                if (actualElement3["Value"] === 3) {
                    poweroffDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
                    poweroffDatasetUpdated.push({Date: actualElement3["Date"], Value: 3})
                } else {
                    poweroffDatasetUpdated.push({Date: startBrush * 1000, Value: 3}) //*
                    poweroffDatasetUpdated.push({Date: actualElement3["Date"], Value: 0})   
                }
                startBrushing3 = false
            } else {
                console.log("Adding data to new datasets")
                if (actualElement3["Value"] === 3) {
                    poweroffDatasetUpdated.push({Date: actualElement3["Date"], Value: 3})
                } else {
                    poweroffDatasetUpdated.push({Date: actualElement3["Date"], Value: 0})
                }
            }
            lastValueInBrush3 = actualElement3["Value"]
        }
    }
    if (poweroffDatasetUpdated.length > 0) {
        console.log("Closing new dataset with proper value, based on last value in brush selection")
        if (lastValueInBrush3 === 3) {
            poweroffDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        } else {
            poweroffDatasetUpdated.push({Date: endBrush * 1000, Value: 3})
        }
        
    } else {
        console.log("No data in brush selection, inserting data based on last value before brush")
        if (lastValueBeforeBrush3 === 3) {
            poweroffDatasetUpdated.push({Date: startBrush * 1000, Value: 3})
            poweroffDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        } else {
            poweroffDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
            poweroffDatasetUpdated.push({Date: endBrush * 1000, Value: 3})
        }
        
    }


    console.log(productionDatasetUpdated, downtimeDatasetUpdated, poweroffDatasetUpdated);
    return {productionDatasetUpdated, downtimeDatasetUpdated, poweroffDatasetUpdated};
}


function DrawTimeLine(productionDataset, downtimeDataset, poweroffDataset) {
    // access data
    const xAccessor = d => d["Date"]
    const yAccessor = d => d["Value"]

    //set dimensions
    let dimensions = {
        width: screen.width - 500,
        height: 100,
        margin: {top: 0, right: 40, bottom: 20, left: 40,},
    }
    //draw canvas
    const wrapper = d3.select("#timeline")
        .append("svg")
        .attr("viewBox", "0 0 " + dimensions.width + " " + dimensions.height)
    const bounds = wrapper.append("g")


    //set scales
    const chartStartsAt = productionDataset[0]["Date"]
    const chartEndsAt = productionDataset[productionDataset.length - 1]["Date"]
    const xScale = d3.scaleTime()
        .domain([chartStartsAt, chartEndsAt])
        .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
    const yScale = d3.scaleLinear()
        .domain(d3.extent(productionDataset, yAccessor))
        .range([dimensions.height - dimensions.margin.bottom, 0])


    // prepare data
    const productionAreaGenerator = d3.area()
        .x(d => xScale(xAccessor(d)))
        .y0(dimensions.height - dimensions.margin.bottom)
        .y1(d => yScale(yAccessor(d)))
        .curve(d3.curveStepAfter);
    const downtimeAreaGenerator = d3.area()
        .x(d => xScale(xAccessor(d)))
        .y0(dimensions.height - dimensions.margin.bottom)
        .y1(d => yScale(yAccessor(d)))
        .curve(d3.curveStepAfter);
    //add poweroff
    const poweroffAreaGenerator = d3.area()
        .x(d => xScale(xAccessor(d)))
        .y0(dimensions.height - dimensions.margin.bottom)
        .y1(d => yScale(yAccessor(d)))
        .curve(d3.curveStepAfter);


    // prepare tooltip
    let div = d3.select("#timeline").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0.7)
        .style("visibility", "hidden");
    const timeScale = d3.scaleTime()
        .domain([new Date(chartStartsAt * 1000), new Date(chartEndsAt * 1000)])
        .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
    bounds.append("g")
        .attr("transform", "translate(0," + (dimensions.height - dimensions.margin.bottom) + ")")
        .call(d3.axisBottom(timeScale))

    // draw data with tooltip
    bounds.append("path")
        .attr("d", productionAreaGenerator(productionDataset))
        .attr("fill", "green")
        .on('mousemove', (event) => {
                let coords = d3.pointer(event);
                let timeEntered = timeScale.invert(coords[0]) / 1000
                let now = new Date(timeEntered * 1000).toLocaleString()
                let start = new Date(productionDataset.filter(i => i["Date"] < timeEntered).pop()["Date"] * 1000).toLocaleString()
                let end = new Date(productionDataset.filter(i => i["Date"] > timeEntered)[0]["Date"] * 1000).toLocaleString()
                div.html(now + "<br/>Production<br/>" + start + "<br/>" + end)
                    .style("visibility", "visible")
                    .style("top", (event.pageY) - 60 + "px")
                    .style("left", (event.pageX) - 60 + "px")
            }
        )
        .on('mouseout', () => {
                div.transition()
                div.style("visibility", "hidden")
            }
        )
    bounds.append("path")
        .attr("d", downtimeAreaGenerator(downtimeDataset))
        .attr("fill", "orange")
        .on('mousemove', (event) => {
                let coords = d3.pointer(event);
                let timeEntered = timeScale.invert(coords[0]) / 1000
                let now = new Date(timeEntered * 1000).toLocaleString()
                let start = new Date(downtimeDataset.filter(i => i["Date"] < timeEntered).pop()["Date"] * 1000).toLocaleString()
                let end = new Date(downtimeDataset.filter(i => i["Date"] > timeEntered)[0]["Date"] * 1000).toLocaleString()
                div.html(now + "<br/>Downtime<br/>" + start + "<br/>" + end)
                    .style("visibility", "visible")
                    .style("top", (event.pageY) - 60 + "px")
                    .style("left", (event.pageX) - 60 + "px")
            }
        )
        .on('mouseout', () => {
                div.style("visibility", "hidden")
            }
        )

        bounds.append("path")
        .attr("d", poweroffAreaGenerator(poweroffDataset))
        .attr("fill", "red")
        .on('mousemove', (event) => {
                let coords = d3.pointer(event);
                let timeEntered = timeScale.invert(coords[0]) / 1000
                let now = new Date(timeEntered * 1000).toLocaleString()
                let start = new Date(downtimeDataset.filter(i => i["Date"] < timeEntered).pop()["Date"] * 1000).toLocaleString()
                let end = new Date(downtimeDataset.filter(i => i["Date"] > timeEntered)[0]["Date"] * 1000).toLocaleString()
                div.html(now + "<br/>Poweroff<br/>" + start + "<br/>" + end)
                    .style("visibility", "visible")
                    .style("top", (event.pageY) - 60 + "px")
                    .style("left", (event.pageX) - 60 + "px")
            }
        )
        .on('mouseout', () => {
                div.style("visibility", "hidden")
            }
        )

}