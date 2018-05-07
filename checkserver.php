<?php
$rules = array(
	"SVT4"=>array(
		"data.status"=>array("expect"=>"Normal", "ignore"=>array("Upgrading"))
	),
	"SVT5"=>array(
		"data.status"=>array("expect"=>"Normal", "ignore"=>array("Upgrading"))
	),
	"SVT6"=>array(
		"data.status"=>array("expect"=>"Normal", "ignore"=>array("Upgrading"))
	),
	"Optimizer"=>array(
		"data.status"=>array("expect"=>"Normal", "ignore"=>array("Upgrading"))
	),
);

foreach ($rules as $server => $rules) {
	if (!checkServer($server, $rules)) {
		echo "WARNING: {$server} is not healthy....\n";
		beep();
		break;
	}
}

function checkServer($server, $rules=array("data.status"=>"Normal")) {

	// create a new cURL resource
	$ch = curl_init("http://scmonitor.rtp.raleigh.ibm.com:8000/api/data.php?name={$server}");

	// set URL and other appropriate options
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_0);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 0);

	$status = curl_exec($ch);
	curl_close($ch);

	if (!empty($status)) {
		$statusDec = json_decode($status, true);
		if (!empty($statusDec) && validate_status($statusDec, $rules)) {
			return false;

		}
	}

	// close cURL resource, and free up system resources

	return true;
}

function validate_status($result, $rule) {
	$is_error = false;
	foreach($rule as $k=>$v) {
		$_fields  = str_replace('.', "']['", $k);
		$evlExpr = '$realV=$result[\'' . $_fields . "'];";
		eval($evlExpr);
		if (!empty($realV) && $realV != $v['expect'] && !in_array($realV, $v['ignore'])) {
			$is_error = true;
		} 
	}
	return $is_error;
}

function beep() {
	if (file_exists("/usr/bin/beep")) {
		exec("/usr/bin/beep -f 300.7 -r 2 -d 100 -l 400");
	}
}
