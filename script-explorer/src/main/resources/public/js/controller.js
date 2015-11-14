/*
 * Support javascript for control stream server
 *
 * Copyright (c) 2016 http://wortschatz.uni-leipzig.de/
 * Copyright (c) 2016 Immanuel Plath
 */
 
$(document).ready(function () {
	
	// Click Events
	$('#firstStep').click(function () {
		$("#intro").slideUp();
	});
	
	$('#menuAddLinks').click(function () {
		$("#intro").slideUp();
	});
	
	$('#logoLink').click(function () {
		$("#intro").slideDown();
	});
});