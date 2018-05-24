#!/bin/sh
play /root/Documents/voice.mp3 >/dev/null 2>&1 &
sleep 15 
killall play
