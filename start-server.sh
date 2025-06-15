#!/bin/bash
echo "Starting Book Reader Server..."
echo ""
echo "Access from your phone:"
echo "http://172.20.122.210:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8080