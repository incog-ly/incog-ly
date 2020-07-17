#!/usr/bin/env bash


PROJECT_BASE_PATH='/half-mile-hackathon'
# Configure nginx
cp $PROJECT_BASE_PATH/conf/nginx_half-mile-hackathon.conf /etc/nginx/sites-available/half-mile-hackathon.conf
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/half-mile-hackathon.conf /etc/nginx/sites-enabled/half-mile-hackathon.conf
systemctl restart nginx.service

echo "DONE! :)"