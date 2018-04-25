<?php

require_once("common.php");

// $_GET['name']='SVT6';
// $_GET['data']='{"IP":"192.168.1.123"}';

$request = array();
$message = array(
	"status" => "OK",
	"name" => '',
	"error" => '',
	"last_update" => date("F j, Y, g:i a"),
	"data" => array()
);

if (!empty($_GET)) {
	$request = $_GET;
} else {
	$message['status'] = 'NG';
	$message['error'] = 'API: [POST]/report.php?name=xx  Data: <Json message>';	
	echo json_encode($message);
	exit(1);
}


$host_dir = "";

if (!empty($request['name'])) {
	$host_dir = $request['name'];
	$host_dir = hash("crc32", $host_dir, false);
	$message['name'] = $request['name'];
} else {
	$message['status'] = 'NG';
	$message['error'] = 'Lacking of name in parameters: eg. name=xxx';	
	echo json_encode($message);
	exit(1);
}

$data = file_get_contents('php://input', 'r');

if (!empty($data)) {
	$message['data'] = json_decode($data);
	if (empty($message['data'])) {
		$message['data'] = $request['data'];
	}
} else {
	$message['status'] = 'WARN';
	$message['error'] = 'No information or information is not a valid json message.';
	echo json_encode($message);
	exit(1);
}

$commonHandler = new common();
$message['host_dir'] = $host_dir;
if (!$commonHandler->create_data_dir($host_dir)) {
	$message['status'] = 'NG';
	$message['error'] = 'SYSTEM ERROR: 001';	
	echo json_encode($message);
	exit(1);
}

$info = json_encode($message);

if (!$commonHandler->write_info($info)) {
	$message['status'] = 'NG';
	$message['error'] = 'SYSTEM ERROR: 002';	
	echo json_encode($message);
	exit(1);
}

echo $info;
exit(0);




