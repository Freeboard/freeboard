<?php

require_once("rtclib.php");

$month = date('Y-m-d', strtotime("-15 days"));

$RTC_QUERY='https://swgjazz.ibm.com:8017/jazz/rpt/repository/workitem?size=500&fields=workitem/workItem[type/id=defect%20and%20creationDate%3E'.$month.'T00:00:00.000-0500]/(id|summary|type/id|state/name|priority/name|severity/name|category/name|teamArea/name|target/name|foundIn/name|allExtensions/(key|smallStringValue))';


$rtcHandler = new RTCLib();
$rtcHandler->auth();
$rtc_info = $rtcHandler->getRTCInfo($RTC_QUERY, true);
// $rtc_info = file_get_contents("rtclist.xml");
/*
$statisticGlobal = array(
    "Prod" => array(
        "Unresolved" => array (
            "Blocker" => 1,
            "Critical" => 10,
            "Others" => 100
        ),
        "Total" => array(
            "Blocker" => 1,
            "Critical" => 10,
            "Others" => 100
        )
    ),
    "Other" => array(
        "Unresolved" => array (
            "Blocker" => 1,
            "Critical" => 10,
            "Others" => 100
        ),
        "Total" => array(
            "Blocker" => 1,
            "Critical" => 10,
            "Others" => 100
        )
    ),
)
*/
$statisticGlobal = array();

/*
$statisticBySquad = array(
    "Optimizer" => array(
        "Prod" => array(
            "Unresolved" => array (
                "Blocker" => 1,
                "Critical" => 10,
                "Others" => 100
            ),
            "Total" => array(
                "Blocker" => 1,
                "Critical" => 10,
                "Others" => 100
            ),
            "New" => 10,
            "In Progress" => 100,
            ......
        ),
        "Other" => array (
            "Unresolved" => array (
                ......
            ),
            "Total" => array(
                ......
            ),
        )
    ), 
    "Saccharin" => array(
        ......
    )
)
*/
$statisticBySquad = array();

$xml = simplexml_load_string($rtc_info);
foreach($xml as $workitem) {
/*
ID:125814
TYPE:defect
Status:Verified
Severity:Normal
Priority:Unassigned
Filed against:Forecasting Spoke Squad
Team area:Galaxy Squad
Target release:Ongoing
Found in:SC Priority Backlog
Found in :Test
*/
    // echo "ID:". $workitem->id,"\n";
    // echo "TYPE:". $workitem->type->id,"\n";
    // echo "Status:". $workitem->state->name,"\n";
    $status = $workitem->state->name->__toString();

    // echo "Severity:". $workitem->severity->name,"\n";
    // echo "Priority:". $workitem->priority->name,"\n";

    $prioity = $rtcHandler->getPriority($workitem->priority->name->__toString(), $workitem->severity->name->__toString());
//    echo "Filed against:". $workitem->category->name,"\n";
    $squad = $workitem->category->name->__toString();

    if (excludeSquad($squad)) {
        continue;
    }

    // echo "Team area:". $workitem->teamArea->name,"\n";
    // echo "Target release:". $workitem->target->name,"\n";
    // echo "Found in:". $workitem->foundIn->name,"\n";
    if (count($workitem->allExtensions) > 0) {
        foreach($workitem->allExtensions as $El) {
            if ($El->key == 'environment') {
                $env = $El->smallStringValue->__toString();
                $foundIn = $rtcHandler->getFoundIn($env);
            }
        }
    }
//    echo "-----------\n";
    if (!$rtcHandler->isResolved($workitem->state->name)) {
        if (isset($statisticGlobal[$foundIn]['Unresolved'][$prioity])) {
            $statisticGlobal[$foundIn]['Unresolved'][$prioity]++;
        } else {
            $statisticGlobal[$foundIn]['Unresolved'][$prioity] = 1;
        }
        if (isset($statisticBySquad[$squad][$foundIn]['Unresolved'][$prioity])) {
            $statisticBySquad[$squad][$foundIn]['Unresolved'][$prioity]++;
        } else {
            $statisticBySquad[$squad][$foundIn]['Unresolved'][$prioity] = 1;
        }
    }
    if (isset ($statisticGlobal[$foundIn]['Total'][$prioity])) {
        $statisticGlobal[$foundIn]['Total'][$prioity]++;
    } else {
        $statisticGlobal[$foundIn]['Total'][$prioity] = 1;
    }
    if (isset($statisticBySquad[$squad][$foundIn]['Total'][$prioity])) {
        $statisticBySquad[$squad][$foundIn]['Total'][$prioity]++;
    } else {
        $statisticBySquad[$squad][$foundIn]['Total'][$prioity] = 1;
    }
    if (isset($statisticBySquad[$squad][$foundIn][$status] )) {
        $statisticBySquad[$squad][$foundIn][$status]++;
    } else {
        $statisticBySquad[$squad][$foundIn][$status] = 1;
    }
}

$data = array(
    "summary" => "All defects created in recent 2 months.",
    "overall"=>$statisticGlobal,
    "squads"=>$statisticBySquad
);

//print_r($data);
//echo "\n-----------\n";
echo json_encode($data);
exit;

function excludeSquad($squadName) {
    // TODO: don't count some squads
    return false;
}
