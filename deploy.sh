#!/bin/sh
docker-compose down
docker build -t freeboard .
docker-compose up -d
