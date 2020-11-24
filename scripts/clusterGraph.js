const widthCluster = 500,
	heightCluster = 500;

let dataCluster;
let dataClusterEdge;

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

const scale = d3.scaleOrdinal(d3.schemeCategory10);

const colorCluster = (id) => {
	return scale(id);
};

const showClusterIndepthGraph = (id) => {
	const nodesIndepth = [];
	const linksIndepth = [];

	dataClusterEdge.nodes.forEach((data) => {
		if (data.communityMembership.includes(id.toString())) {
			nodesIndepth.push({ ...data });
		}
	});

	dataClusterEdge.links.forEach((data) => {
		if (data.community_membership.includes(id.toString())) {
			linksIndepth.push({ ...data });
		}
	});

	linksIndepth.forEach((linkData) => {
		if (!nodesIndepth.some((data) => linkData.target === data.id)) {
			const remainingNodeData = {
				id: linkData.target,
				communityMembership: linkData.community_membership,
			};
			nodesIndepth.push({ ...remainingNodeData });
		}
	});

	const simulationClusterInDepth = d3
		.forceSimulation(nodesIndepth)
		.force(
			"link",
			d3
				.forceLink(linksIndepth)
				.id((d) => d.id)
				.distance(250)
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
		.attr("viewBox", [0, 0, widthCluster + 100, heightCluster + 100]);

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
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.selectAll("circle")
		.data(nodesIndepth)
		.join("circle")
		.attr("r", 10)
		.attr("fill", colorCluster(id))
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

async function initClustersGraph() {
	dataCluster = await d3.json("../data/cluster_membership.json");
	dataClusterEdge = await d3.json("../data/edges_data.json");

	// dataClusterEdge.links.forEach((data) => {
	// 	data.community_membership = data.community_membership
	// 		.replace('"', "")
	// 		.replace("[", "")
	// 		.replace("]", "")
	// 		.split(", ");
	// });
	// const nodes = [];

	// dataClusterEdge.edge_table.forEach((data) => {
	// 	let source,
	// 		target = false;
	// 	if (data.source === data.target) {
	// 		if (!nodes.some((nodeData) => nodeData.id === data.source)) {
	// 			nodes.push({ id: data.source });
	// 		}
	// 	} else {
	// 		if (!nodes.some((nodeData) => nodeData.id === data.source)) source = true;
	// 		else if (!nodes.some((nodeData) => nodeData.id === data.target))
	// 			target = true;
	// 	}
	// 	if (source) nodes.push({ id: data.source });
	// 	if (target) nodes.push({ id: data.target });
	// });

	// nodes.forEach((data) => {
	// 	const edgeObj = dataClusterEdge.edge_table.filter(
	// 		(edgeData) => edgeData.source === data.id
	// 	);
	// 	if (edgeObj !== null)
	// 		data.communityMembership = edgeObj[0].community_membership;
	// 	else data.communityMembership = [];
	// });
	// console.log(dataClusterEdge);
	// console.log(nodes);

	const backBtn = document.getElementById("clusterBackBtn");
	const clusterGraphMain = document.getElementById("clusterMainGraph");

	const linkExtent = d3.extent(dataCluster.links.map((data) => data.value));
	const linkValue = d3.scaleOrdinal().domain(linkExtent).range([1, 10]);
	console.log(linkExtent);

	const simulationCluster = d3
		.forceSimulation(dataCluster.nodes)
		.force(
			"link",
			d3
				.forceLink(dataCluster.links)
				.id((d) => d.id)
				.distance(200)
		)
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(widthCluster / 2, heightCluster / 2));

	const toggleDisplay = () => {
		backBtn.classList.toggle("d-none");
		clusterGraphMain.classList.toggle("d-none");
	};

	backBtn.addEventListener("click", () => {
		toggleDisplay();
		d3.select("#svgClusterInDepth").remove();
	});

	const svgCluster = d3
		.select(".main-graph")
		.append("svg")
		.attr("viewBox", [0, 0, widthCluster, heightCluster]);

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
		.selectAll("circle")
		.data(dataCluster.nodes)
		.join("circle")
		.attr("r", 35)
		.attr("fill", (data) => colorCluster(data.id))
		.call(drag(simulationCluster))
		.on("click", (mouseEvent, data) => {
			//console.log(d, x);
			toggleDisplay();
			showClusterIndepthGraph(data.id);
		});

	simulationCluster.on("tick", () => {
		linkCluster
			.attr("x1", (d) => d.source.x + 1)
			.attr("y1", (d) => d.source.y + 1)
			.attr("x2", (d) => d.target.x + 1)
			.attr("y2", (d) => d.target.y + 1);

		nodeCluster.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
	});
}

initClustersGraph();
