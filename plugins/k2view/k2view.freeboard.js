/**
 * Author: Peter Nijem
 * Date: 26.06.2016
 */
this.loadInstance = function(){
	var instanceId = $('#instanceId').val();
	var url = window.location.toString();
	var newUrl = url.replace(new RegExp("iid=.*", "g"), "iid=" + instanceId);
	//if instanceId is not undefined and is a number
	if(!_.isUndefined(instanceId)){
		window.location = newUrl;
		window.location.reload(true);
	}//else{
	//	$('#resultMsg').text('Please enter a valid instance ID');
   	//    $( '#resultMsg' ).fadeIn(300).delay(5000).fadeOut(400);
	//}
	fabricDatasource.updateNow();
}


$( document ).ready(function() {
	$( "#instanceId" ).val (getQueryString('iid'));
	var modal = document.getElementById("myModal");
	// Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];

	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
		modal.style.display = "none";
	}
});


var getQueryString = function ( field , url) {
	var href = url ? url : window.location.href;
	var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
	var string = reg.exec(href);
	return string ? string[1] : null;
};
