function showSunBurst(data) {
    d3.select('.sunburst-chart').remove()

    const width = 350,
        height = 350,
        radius = width / 7

    valueScale = d3.scaleLinear()
        .domain([0, 45])
        .range([100, 1000])

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

    const partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => valueScale(d.value))
            .sort((a, b) => b.value - a.value);
        return d3.partition()
            .size([2 * Math.PI, root.height + 1])
            (root);
    }
    const root = partition(data);
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1))
    root.each(d => d.current = d);

    const svg = d3.select(".sunburst-graph")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "sunburst-chart")
        .style("font", "20px sans-serif")

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${width / 2})`)

    const path = g.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("fill", d => {
            while (d.depth > 1) d = d.parent;
            return color(d.data.name);
        })
        .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("d", d => arc(d.current))

    path.filter(d => d.children)
        .style("cursor", "pointer")

        .on("click", clicked)

    path.on("mouseover", hovered)
        .on("mouseout", hoveredOut)

    const label = g.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
        .attr("dy", "0.40em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .text(d => d.data.name)
        .style("font-size", "7px");

    const cluster_number = svg.append("text")
        .attr("id", "title")
        .attr("x", (width / 2))
        .attr("y", (width / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "0.8em")
        .text(data.name)

    const parent = g.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .style("cursor", "pointer")
        .on("click", clicked);


    function clicked(event, p) {
        parent.datum(p.parent || root);

        root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
        });

        d3.select("#center-text").remove()

        const t = g.transition().duration(750);

        svg.append("text")
            .data(p)
            .attr("id", "title")
            .attr("x", (width / 2))
            .attr("y", (width / 2 + 20))
            .attr("text-anchor", "middle")
            .style("font-size", "0.5em")
            .attr('id', "center-text")
            .style("font-style", "italic")
            .text(d => {
                if (Number.isInteger(d.data.name)) {
                    return "Source : " + d.data.name;
                }
            });

        path.transition(t)
            .tween("data", d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function (d) {
                return +this.getAttribute("fill-opacity") || arcVisible(d.target);
            })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attrTween("d", d => () => arc(d.current));

        label.filter(function (d) {
                return +this.getAttribute("fill-opacity") || labelVisible(d.target);
            }).transition(t)
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));
    }

    function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.08;
    }

    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    function hovered(d, i) {
        toolTip.transition().duration(200)
            .style('opacity', 0.9);
        toolTip.html(generateToolTipData(i))
            .style('left', d.pageX + 'px')
            .style('top', d.pageY + 'px');
    }

    function generateToolTipData(nodeData) {
        let text;
        if (nodeData.depth == 2) {
            text = `<table>
                            <tr><td>Source: </td><td>` + nodeData.parent.data.name + `</td></tr>
                            <tr><td>Target: </td><td>` + nodeData.data.name + `</td></tr>
                            <tr><td> Transition Prob: </td><td>` + nodeData.data.value + `</td> </tr>
                    </table>`
        } else {
            let clusterInfo = nodeData.parent.data.name.split("-")[1]
            text = `<table>
                            <tr><td>Cluster: </td><td>` + clusterInfo + `</td></tr>
                            <tr><td>Source: </td><td>` + nodeData.data.name + `</td></tr>
                            <tr><td>No of Targets: </td><td>` + nodeData.data.children.length + `</td> </tr>
                    </table>`
        }
        return text;
    }

    function hoveredOut(d, i) {
        toolTip.transition()
            .duration(500)
            .style('opacity', 0);
    }
};

function prepareData(clusterId, data) {
    let indClusterData = {}
    indClusterData = {
        "name": `Cluster-${clusterId}`,
        "children": []
    };
    data.forEach(clusterElement => {
        if (indClusterData.children.findIndex(source => source.name == clusterElement.source) === -1) {
            indClusterData.children.push({
                "name": +clusterElement.source,
                "children": []
            });
        }
        indClusterData.children.forEach(source => {
            if (source.name == clusterElement.source) {
                source.children.push({
                    "name": +clusterElement.target,
                    "value": +clusterElement.transition_probabilities
                })
            }
        });
    });
    showSunBurst(indClusterData);
    let counts = _.countBy(data, data => data.risk_classification)
    indBarData = [{
        "name": "Low",
        "value": counts["Low"]
    }, {
        "name": "Moderate",
        "value": counts["Moderate"]
    }, {
        "name": "High",
        "value": counts["High"]
    }];
    showBarChart(indBarData);
}

function showBarChart(dataset) {
    d3.select('.bar-graph').remove()
    const margin = {
            top: 40,
            right: 30,
            bottom: 30,
            left: 50
        },
        width = 200 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    const greyColor = "#898989";
    const barColor = d3.interpolateReds(0.4);
    const highlightColor = d3.interpolateReds(0.3);

    const svg = d3.select(".bar-chart")
        .append("div")
        .attr("class", "bar-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("class", "bar-svg-graph")

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .range([height, 0]);

    const xAxis = d3.axisBottom(x).tickSize([1]).tickPadding(10);
    const yAxis = d3.axisLeft(y);

    x.domain(dataset.map(d => {
        return d.name;
    }));
    y.domain([0, d3.max(dataset, d => {
        return d.value;
    })]);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    svg.selectAll(".bar")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .style("display", d => {
            return d.value === null ? "none" : null;
        })
        .style("fill", d => {
            return d.value === d3.max(dataset, d => {
                    return d.value;
                }) ?
                highlightColor : barColor
        })
        .on("mouseover", function (event, data) {
            d3.select(this).transition().duration(200).style('opacity', 0.5)
        })
        .on("mouseout", function (event, data) {
            d3.select(this).transition().duration(200).style('opacity', 1)
        })
        .attr("x", d => {
            return x(d.name);
        })
        .attr("width", x.bandwidth())
        .attr("y", d => {
            return height;
        })
        .attr("height", 0)
        .transition()
        .duration(750)
        .delay(function (d, i) {
            return i * 200;
        })
        .attr("y", d => {
            return y(d.value);
        })
        .attr("height", d => {
            return height - y(d.value);
        })

    svg.selectAll(".label")
        .data(dataset)
        .enter()
        .append("text")
        .attr("class", "label")
        .style("display", d => {
            return d.value === null ? "none" : null;
        })
        .attr("x", (d => {
            return x(d.name) + (x.bandwidth() / 2) - 8;
        }))
        .style("fill", d => {
            return d.value === d3.max(dataset, d => {
                    return d.value;
                }) ?
                highlightColor : greyColor
        })
        .attr("y", d => {
            return height;
        })
        .attr("height", 0)
        .transition()
        .duration(750)
        .delay((d, i) => {
            return i * 200;
        })
        .text(d => {
            return (d.value);
        })
        .attr("y", d => {
            return y(d.value) + .1;
        })
        .attr("dy", "-.5em");
}