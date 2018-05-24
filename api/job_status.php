<?php
/**
0,1 5,3 * * * jobxx
array(
  "0"=>array(
       "5" => array(
            "*"=>array(
	            "*"=>array(
		            "*"=> array("jobxx")
		        )
	        )
        ),
        "3" => array(
            "*"=>array(
	            "*"=>array(
		            "*"=> array("jobxx")
		        )
	        )
        ),
  ),
  "1"=>array(
       "5" => array(
            "*"=>array(
	            "*"=>array(
		            "*"=> array("jobxx")
		        )
	        )
        )
		"3" => array(
			"*"=>array(
			    "*"=>array(
			        "*"=> array("jobxx")
			    )
			)
		),
  )
)
*/

$jobTree = array();
$fp = fopen("joblist.list", "r");
while($line = fgets($fp)) {
	processJobLine($jobTree, $line);
}
fclose($fp);

// $lines  = array(
// 	"00,10,20,30,40,50 * * * * /home/apache/sctgsaid_gce.sh /home/apache/sctgsaid_gce.dat > /dev/null 2>&1",
// 	"00,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48 * * * * (. $HOME/.profile; /var/www/htdocs/sales/salesconnect/batch/RTC_30016/rtc_30016_master.ksh) > /dev/null 2>&1",
// 	"00 09 * * * (. $HOME/.profile;cd /var/www/htdocs/sales/salesconnect/batch/RTC_32214; ./rtc_32214_master.ksh ) >/dev/null 2>&1",
// 	"30 01 * * 5 (. $HOME/.profile;cd /var/www/htdocs/sales/salesconnect/batch/RTC_37705; ./rtc_37705_master.ksh) >/dev/null 2>&1"
// );

// foreach($lines as $line) {
// 	processJobLine($jobTree, $line);
// }
//$jobs = getCurrentJobs($jobTree, strtotime("2018-04-20 1:43:12"));

$jobStatus = array(
	'GMTDT'=>gmdate("Y-m-d H:i:s w"),
	"last10MinsJobs" => null,
	"currentJobs" => null,
	"next10MinusJobs" => null,
);


$currDT = gmmktime();
$last10MinsJobs = array();
for($i=1; $i<11; $i++) {
	$last10MinsJobs = array_merge($last10MinsJobs, getCurrentJobs($jobTree, $currDT - $i*60));
}
$jobStatus['last10MinsJobs'] = $last10MinsJobs;

$currentJobs = getCurrentJobs($jobTree);
$jobStatus['currentJobs'] = $currentJobs;

$next10MinusJobs = array();
for($i=1; $i<11; $i++) {
	$next10MinusJobs = array_merge($next10MinusJobs, getCurrentJobs($jobTree, $currDT + $i*60));
}
$jobStatus['next10MinusJobs'] = $next10MinusJobs;
echo json_encode($jobStatus);
exit;

function processJobLine(&$_jobTree, $line) {
	$cronDetail = explode(" ", $line);
	if (count($cronDetail) >5) {
		constructJobTree($cronDetail, 0, $_jobTree, $line);
	}
	return $_jobTree;
}


function constructJobTree($values, $level, &$_jobTree, $jobDetail) {
	if ($level > 4) {
		$jobNumber = hash("crc32", $jobDetail, false);
		$_jobTree[$jobNumber] = $jobDetail;
		return $_jobTree[$jobNumber];
	}
	$nodeValue = explode(",", $values[$level]);
	foreach($nodeValue as $_n) {
		if (is_numeric($_n)) {
			$_n = str_pad($_n, 2, "0", STR_PAD_LEFT);
		} 
		if (!isset($_jobTree[$_n])) {
			$_jobTree[$_n] = array();
		}
		constructJobTree($values, $level + 1, $_jobTree[$_n], $jobDetail);
	}
}

function filterJobs($filters, $level, &$_jobTree) {
	if ($level > 4) {
		return $_jobTree;
	}
	$jobs = array();
	foreach($_jobTree as $_n=>$value) {
		// echo "Compare level {$level} $_n => {$filters[$level]}\n";
		if ($_n == "*" || $_n==$filters[$level]) {
			$_subJobs = filterJobs($filters, $level+1, $value);	
			$jobs = array_merge($jobs, $_subJobs);
		} 
	}
	return $jobs;
}

function getCurrentJobs ($_jobTree, $currentTimestamp=null) {
	if (!is_null($currentTimestamp)) {
		$min = date("i", $currentTimestamp);
		$hour = date("H", $currentTimestamp);
		$month = date('m', $currentTimestamp);
		$year = date('y', $currentTimestamp);
		$week = date('w', $currentTimestamp);
	} else {
		$min = gmdate("i");
		$hour = gmdate("H");
		$month = gmdate('m');
		$year = gmdate('y');
		$week = gmdate('w');
	}

	$filters = array($min, $hour, $month, $year, $week);

	$jobs = filterJobs($filters, 0, $_jobTree);
	return $jobs;
}

