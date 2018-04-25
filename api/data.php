<?php
require_once("common.php");

$request = array();
// $_GET['name']='SVT6';
if (!empty($_GET) || !empty($_POST)) {
	$request = array_merge($_GET, $_POST);
}
if (empty($request['name'])) {
	$message['status'] = 'NG';
	$message['error'] = 'Lacking of name in parameters: eg. name=xxx';	
	echo json_encode($message);
	exit(1);
}

$commonHandler = new common();
$host_dir = $commonHandler->get_data_dir_by_name($request['name']);
$commonHandler->set_data_dir($host_dir);
$message = $commonHandler->get_info();
if (empty($message)) {
	$message['status'] = 'NG';
	$message['error'] = 'No information yet to '.$request['name'];	
	echo json_encode($message);
	exit(1);
} else {
	echo $message;
}
exit(0);
