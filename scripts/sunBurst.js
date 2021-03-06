function showSunBurst(clusterId, data) {
    d3.select('.sunburst-chart').remove()
    d3.select('.cluster-text')
        .text(`Procedures:  Cluster-${clusterId}`)

    const width = 400,
        height = 400,
        radius = width / 7

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

    const partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => (d.value))
            .sort((a, b) => b.value - a.value);
        return d3.partition()
            .size([2 * Math.PI, root.height + 1])
            (root);
    }
    const root = partition(data);
    const color = d3.scaleOrdinal(d3.quantize(customInterpolater(clusterId), data.children.length + 1).reverse())
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
        .style("font-size", "8px")
        .style("fill", "white")
        .style("opacity", 0.8)

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
            .attr("y", (width / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "0.5em")
            .attr('id', "center-text")
            .style("font-style", "italic")
            .text(d => {
                if (Number.isInteger(d.data.name)) {
                    return "Source : " + d.data.name;
                }
            })
            .style("fill", "white")
            .style("opacity", 0.8);

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
            let clusterInfo = nodeData.parent.data.name.split(":")[1]
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

    function customInterpolater(clusterId) {
        switch (clusterId) {
            case 0:
                return d3.interpolateBlues;
            case 1:
                return d3.interpolateOranges
            case 2:
                return d3.interpolateGreens
            case 3:
                return d3.interpolateReds
            case 4:
                return d3.interpolatePurples
            case 5:
                return d3.interpolateYlOrBr
            case 6:
                return d3.interpolateRdPu
            case 7:
                return d3.interpolateYlGn
            case 8:
                return d3.interpolateGnBu
        }
    }
};

function prepareData(clusterId, data) {
    let indClusterData = {}
    indClusterData = {
        "name": `Cluster:${clusterId}`,
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
    showSunBurst(clusterId, indClusterData);
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
    showEncodings(indBarData);
}

function showEncodings(indBarData) {

    d3.select('.text-risk')
        .html(`<p>Associated <br/><span>Risk</span></p>`)

    d3.selectAll(".risk-image").remove();
    d3.selectAll(".risk-text").remove();

    d3.select(".risk-low")
        .append("img")
        .attr("class", "risk-image")
        .attr("src", "assets/risk-low.svg")
        .attr("alt", "low-risk-svg")
        .attr("width", "60px")
        .attr("height", "60px")
        .exit()
        .append("span")

    d3.select(".risk-mod")
        .append("img")
        .attr("class", "risk-image")
        .attr("src", "assets/risk-mod.svg")
        .attr("alt", "mod-risk-svg")
        .attr("width", "60px")
        .attr("height", "60px")

    d3.select(".risk-high")
        .append("img")
        .attr("class", "risk-image")
        .attr("src", "assets/risk-high.svg")
        .attr("alt", "high-risk-svg")
        .attr("width", "60px")
        .attr("height", "60px")

    d3.select(".risk-low")
        .append("div")
        .attr("class", "risk-text")
        .text(indBarData.find(data => data.name === "Low").value === undefined ? 0 : indBarData.find(data => data.name === "Low").value)


    d3.select(".risk-mod")
        .append("div")
        .attr("class", "risk-image")
        .text(indBarData.find(data => data.name === "Moderate").value === undefined ? 0 : indBarData.find(data => data.name === "Moderate").value)

    d3.select(".risk-high")
        .append("div")
        .attr("class", "risk-image")
        .text(indBarData.find(data => data.name === "High").value === undefined ? 0 : indBarData.find(data => data.name === "High").value)
}