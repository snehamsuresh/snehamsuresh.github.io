$("#body-row .collapse").collapse("hide");

$("#collapse-icon").addClass("fa-angle-double-left");

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

	var SeparatorTitle = $(".sidebar-separator-title");
	if (SeparatorTitle.hasClass("d-flex")) {
		SeparatorTitle.removeClass("d-flex");
	} else {
		SeparatorTitle.addClass("d-flex");
	}

	$("#collapse-icon").toggleClass("fa-angle-double-left fa-angle-double-right");
}

const range = document.getElementById("myRange");
const rangeV = document.getElementById("rangeV");
const setValue = () => {
	const newValue = Number(
		((range.value - range.min + 400) * 100) / (range.max - range.min + 400)
	);
	const newPosition = 10 - newValue * 0.5;
	rangeV.innerHTML = `<span>${range.value}</span>`;
	rangeV.style.left = `calc(${newValue}% + (${newPosition}px))`;
};
document.addEventListener("DOMContentLoaded", setValue);
range.addEventListener("input", setValue);

const min = range.min
const max = range.max
const value = range.value
range.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(value-min)/(max-min)*100}%, #DEE2E6 ${(value-min)/(max-min)*100}%, #DEE2E6 100%)`
range.oninput = function () {
	this.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(this.value-this.min)/(this.max-this.min)*100}%, #DEE2E6 ${(this.value-this.min)/(this.max-this.min)*100}%, #DEE2E6 100%)`
};

const toolTip = d3
	.select('body')
	.append('div')
	.attr('class', 'tooltip')
	.style('opacity', 0);

$('.carousel').carousel({
	interval: 5000
})

$(window).on('load', function () {
	$('#clusterModal').modal('show');
});