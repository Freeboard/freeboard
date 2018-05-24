#!/bin/sh
for i in $(seq 6)
do
  rate=$(($i*150))
  /usr/bin/beep -f $rate -r 3 -d 125 -l 125 
  sleep 0.3
done
