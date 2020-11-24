// Hide submenus
$("#body-row .collapse").collapse("hide");

// Collapse/Expand icon
$("#collapse-icon").addClass("fa-angle-double-left");

// Collapse click
$("[data-toggle=sidebar-colapse]").click(function () {
	SidebarCollapse();
});

const baseUrl = "https://episode-of-care-heroku.herokuapp.com";
const baseUrl1 = "http://localhost:3000";

function SidebarCollapse() {
	$(".menu-collapsed").toggleClass("d-none");
	$(".sidebar-submenu").toggleClass("d-none");
	$(".submenu-icon").toggleClass("d-none");
	$("#sidebar-container").toggleClass("sidebar-expanded sidebar-collapsed");

	// Treating d-flex/d-none on separators with title
	var SeparatorTitle = $(".sidebar-separator-title");
	if (SeparatorTitle.hasClass("d-flex")) {
		SeparatorTitle.removeClass("d-flex");
	} else {
		SeparatorTitle.addClass("d-flex");
	}

	// Collapse/Expand icon
	$("#collapse-icon").toggleClass("fa-angle-double-left fa-angle-double-right");
}

$("#inputGroupFile02").on("change", function () {
	let fileName = $(this).val().split("\\").pop();
	$(this).next(".custom-file-label").html(fileName);
	$("#inputGroupFileAddon02").click(function () {
		$(".toast").toast("show");
	});
});

const range = document.getElementById("myRange");
const rangeV = document.getElementById("rangeV");
const setValue = () => {
	const newValue = Number(
		((range.value - range.min + 270) * 100) / (range.max - range.min + 270)
	);
	const newPosition = 10 - newValue * 0.5;
	rangeV.innerHTML = `<span>${range.value}</span>`;
	rangeV.style.left = `calc(${newValue}% + (${newPosition}px))`;
};
document.addEventListener("DOMContentLoaded", setValue);
range.addEventListener("input", setValue);

//Upload Files to S3
function uploadFile() {
	const inputFile = document.getElementById("inputGroupFile02").files[0];
	if (inputFile == null) {
		alert("No File selected");
	} else {
		getSignedRequest(inputFile);
	}
}

function getSignedRequest(file) {
	fetch(`${baseUrl}/sign-s3?file-name=${file.name}&file-type=${file.type}`)
		.then(function (response) {
			if (response.status === 200) {
				response.json().then(function (data) {
					uploadFileToS3(file, data.signedRequest, data.url);
				});
			} else {
				alert("Could not get signed URL.");
				return;
			}
		})
		.catch(function (err) {
			console.log("Fetch Error :-S", err);
		});
}

function uploadFileToS3(file, signedRequest, url) {
	fetch(signedRequest, {
			method: "PUT",
			body: file
		})
		.then(function (response) {
			if (response.status === 200) {
				console.log("DONE!");
			} else {
				alert("Could not upload file.");
				return;
			}
		})
		.catch(function (err) {
			console.log("Fetch Error :-S", err);
		});
}

const toolTip = d3
	.select('body')
	.append('div')
	.attr('class', 'tooltip')
	.style('opacity', 0);