#!/bin/sh  
if [ $# -ne 2 ]  
then  
     echo "Usage: sh $0 host port"  
     exit  
fi  
num=`echo -n "\n"|telnet $1 $2|grep Connected|wc -l`  
if [ $num -eq 1 ]  
then  
    curl -kX POST -H 'Content-type: application/json' --data '{"status":"Normal"}' http://scmonitor.rtp.raleigh.ibm.com:8000/api/report.php?name=scldap02
else  
    curl -kX POST -H 'Content-type: application/json' --data '{"status":"Down"}' http://scmonitor.rtp.raleigh.ibm.com:8000/api/report.php?name=scldap02
fi
