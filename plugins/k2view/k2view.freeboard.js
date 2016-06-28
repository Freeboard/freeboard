/**
 * Author: Peter Nijem
 * Date: 26.06.89
 */
this.loadInstance = function(){
	var instanceId = $('#instanceId').val();
	var url = window.location.toString();
	var newUrl = url.replace(new RegExp("iid=[0-9]", "g"), "iid=" + instanceId);
	if(!_.isUndefined(instanceId)){
		window.location = newUrl;
		window.location.reload(true);
	}
	fabricDatasource.updateNow();
	
}