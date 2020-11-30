const widthCluster = 400,
	heightCluster = 400;

let dataCluster;
let dataClusterEdge;

let clusterLevel = 1;

let toggleDisplay;

let nodesIndepth = [];
let linksIndepth = [];

const drag = (simulation) => {
	function dragstarted(event) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}

	function dragged(event) {
		event.subject.fx = event.x;
		event.subject.fy = event.y;
	}

	function dragended(event) {
		if (!event.active) simulation.alphaTarget(0);
		event.subject.fx = null;
		event.subject.fy = null;
	}

	return d3
		.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended);
};

const scale = d3.scaleOrdinal(
	d3.schemeCategory10.filter((colorValue) => colorValue !== "#7f7f7f")
);

const colorCluster = (id) => {
	return scale(id);
};

const showClusterIndepthGraph = (id) => {
	const latencyRange = parseInt(document.getElementById("myRange").value);

	dataClusterEdge.nodes.forEach((data) => {
		if (
			data.communityMembership.includes(id.toString()) &&
			data.latencies <= parseInt(latencyRange)
		) {
			nodesIndepth.push({
				...data,
				source: true,
			});
		}
	});

	dataClusterEdge.links.forEach((data) => {
		const latencyMax = data.latencies[data.latencies.length - 1];
		if (
			data.community_membership.includes(id.toString()) &&
			latencyMax <= latencyRange
		) {
			linksIndepth.push({
				...data,
			});
		}
	});

	linksIndepth.forEach((linkData) => {
		if (!nodesIndepth.some((data) => linkData.target === data.id)) {
			const remainingNodeData = {
				id: linkData.target,
				communityMembership: linkData.community_membership,
				source: false,
			};
			nodesIndepth.push({
				...remainingNodeData,
			});
		}
	});

	prepareData(id, linksIndepth);

	const simulationClusterInDepth = d3
		.forceSimulation(nodesIndepth)
		.force(
			"link",
			d3
			.forceLink(linksIndepth)
			.id((d) => d.id)
			.distance(150)
		)
		.force("charge", d3.forceManyBody())
		.force(
			"center",
			d3.forceCenter(widthCluster / 2 + 30, heightCluster / 2 + 70)
		)
		.force("forceX", d3.forceX().strength(0.1));

	const svgClusterInDepth = d3
		.select(".indepth-graph")
		.append("svg")
		.attr("id", "svgClusterInDepth")
		//.attr("viewBox", [0, 0, widthCluster + 100, heightCluster + 100]);
		.attr("width", widthCluster + 100)
		.attr("height", heightCluster + 100);

	const linkClusterInDepth = svgClusterInDepth
		.append("g")
		.attr("stroke", "#666")
		.attr("stroke-opacity", 0.6)
		.selectAll("line")
		.data(linksIndepth)
		.join("line")
		.attr("stroke-width", (d) => 1);

	const nodeClusterInDepth = svgClusterInDepth
		.append("g")
		.selectAll("circle")
		.data(nodesIndepth)
		.join("circle")
		.attr("stroke", "#fff")
		.attr("stroke-width", (d) => (d.source ? 3 : 1))
		.attr("r", (d) => (d.source ? 10 : 5))
		.attr("fill", colorCluster(id))
		.on("click", (event, d) => {
			console.log(id);
			if (d.source) toggleDisplay({
				...d,
				communityID: id
			});
		})
		.call(drag(simulationClusterInDepth));

	simulationClusterInDepth.on("tick", () => {
		linkClusterInDepth
			.attr("x1", (d) => d.source.x + 1)
			.attr("y1", (d) => d.source.y + 1)
			.attr("x2", (d) => d.target.x + 1)
			.attr("y2", (d) => d.target.y + 1);

		nodeClusterInDepth.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
	});
};

const showClusterSourceGraph = (data) => {
	console.log(data);
	const stNodeList = [];
	const stLinksList = [];
	nodesIndepth.forEach((dataIndepth) => {
		if (dataIndepth.id == data.id) {
			const sourceNodeData = {
				id: dataIndepth.id,
				communityID: data.communityID,
				source: true,
			};
			stNodeList.push({
				...sourceNodeData,
			});
		}
	});
	linksIndepth.forEach((dataLinks) => {
		if (dataLinks.source.id == data.id) {
			const sourceLinksData = {
				source: dataLinks.source.id,
				target: dataLinks.target.id,
				weight: dataLinks.weight,
				transition_probabilities: dataLinks.transition_probabilities,
			};
			stLinksList.push({
				...sourceLinksData,
			});
		}
	});
	stLinksList.forEach((linkData) => {
		if (!stNodeList.some((data) => linkData.target === data.id)) {
			const remainingNodeData = {
				id: linkData.target,
				communityID: data.communityID,
				source: false,
			};
			stNodeList.push({
				...remainingNodeData,
			});
		}
	});

	console.log(stNodeList);
	console.log(stLinksList);

	const simulationClusterSTDepth = d3
		.forceSimulation(stNodeList)
		.force(
			"link",
			d3
			.forceLink(stLinksList)
			.id((d) => d.id)
			.distance(150)
		)
		.force("charge", d3.forceManyBody())
		.force(
			"center",
			d3.forceCenter(widthCluster / 2 + 30, heightCluster / 2 + 70)
		)
		.force("forceX", d3.forceX().strength(0.1));

	const svgClusterSTDepth = d3
		.select(".st-graph")
		.append("svg")
		.attr("id", "svgClusterSTDepth")
		//.attr("viewBox", [0, 0, widthCluster + 100, heightCluster + 100]);
		.attr("width", widthCluster + 100)
		.attr("height", heightCluster + 100);

	const linkClusterSTDepth = svgClusterSTDepth
		.append("g")
		.attr("stroke", "#666")
		.attr("stroke-opacity", 0.6)
		.selectAll("line")
		.data(stLinksList)
		.join("line")
		.attr("stroke-width", (d) => 1);

	const nodeClusterSTDepth = svgClusterSTDepth
		.append("g")
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.selectAll("circle")
		.data(stNodeList)
		.join("circle")
		.attr("r", (d) => (d.source ? 10 : 5))
		.attr("fill", (d) => colorCluster(d.communityID))
		.call(drag(simulationClusterSTDepth));

	simulationClusterSTDepth.on("tick", () => {
		linkClusterSTDepth
			.attr("x1", (d) => d.source.x + 1)
			.attr("y1", (d) => d.source.y + 1)
			.attr("x2", (d) => d.target.x + 1)
			.attr("y2", (d) => d.target.y + 1);

		nodeClusterSTDepth.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
	});
};

async function initClustersGraph() {
	dataCluster = await d3.json("../data/cluster_membership.json");
	dataClusterEdge = await d3.json("../data/edges_data.json");

	const backBtn = document.getElementById("clusterBackBtn");
	const clusterGraphMain = document.getElementById("clusterMainGraph");
	const clusterIndepthGraph = document.getElementById("clusterIndepthGraph");
	const clusterThirdGraph = document.getElementById("clusterThirdGraph");

	const linkExtent = d3.extent(dataCluster.links.map((data) => data.value));
	const linkValue = d3.scaleOrdinal().domain(linkExtent).range([1, 10]);

	const simulationCluster = d3
		.forceSimulation(dataCluster.nodes)
		.force(
			"link",
			d3
			.forceLink(dataCluster.links)
			.id((d) => d.id)
			.distance(150)
		)
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(widthCluster / 2, heightCluster / 2));

	toggleDisplay = (data = {}) => {
		if (clusterLevel === 1) {
			backBtn.classList.remove("d-none");
			clusterIndepthGraph.classList.remove("d-none");
			clusterGraphMain.classList.add("d-none");
			clusterLevel = 2;
			showClusterIndepthGraph(data.id);
		} else if (clusterLevel === 2) {
			clusterThirdGraph.classList.remove("d-none");
			clusterIndepthGraph.classList.add("d-none");
			clusterLevel = 3;
			showClusterSourceGraph(data);
		}
	};

	backBtn.addEventListener("click", () => {
		//toggleDisplay();
		//d3.select("#svgClusterInDepth").remove();
		if (clusterLevel == 2) {
			backBtn.classList.add("d-none");
			clusterGraphMain.classList.remove("d-none");
			d3.select("#svgClusterInDepth").remove();
			nodesIndepth = [];
			linksIndepth = [];
			clusterLevel = 1;
		}
		if (clusterLevel == 3) {
			clusterThirdGraph.classList.add("d-none");
			clusterIndepthGraph.classList.remove("d-none");
			d3.select("#svgClusterSTDepth").remove();
			clusterLevel = 2;
		}
	});

	const svgCluster = d3
		.select(".main-graph")
		.append("svg")
		.attr("width", widthCluster)
		.attr("height", heightCluster);

	const linkCluster = svgCluster
		.append("g")
		.attr("stroke", "#666")
		.attr("stroke-opacity", 0.6)
		.selectAll("line")
		.data(dataCluster.links)
		.join("line")
		.attr("stroke-width", (d) => linkValue(d.value) * 1.5);

	const nodeCluster = svgCluster
		.append("g")
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.selectAll("g")
		.data(dataCluster.nodes)
		.enter()
		.append("g")
		.attr("class", "g-circle")
		.append("circle")
		.attr("r", 20)
		.attr("fill", (data) => colorCluster(data.id))
		.call(drag(simulationCluster))
		.on("click", (mouseEvent, data) => {
			toggleDisplay(data);
		});

	const textCluster = d3.selectAll(".g-circle")
		.data(dataCluster.nodes)
		.append("text")
		.text(d => d.id)

	simulationCluster.on("tick", () => {
		linkCluster
			.attr("x1", (d) => d.source.x + 1)
			.attr("y1", (d) => d.source.y + 1)
			.attr("x2", (d) => d.target.x + 1)
			.attr("y2", (d) => d.target.y + 1);

		nodeCluster.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		textCluster.attr("x", (d) => d.x - 5).attr("y", (d) => d.y + 5);
	});
}

initClustersGraph();