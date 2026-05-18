#!/usr/bin/env bash
set -e

# Self-elevate if not already root
[ "$EUID" -ne 0 ] && exec sudo bash "$0" "$@"

echo "=== Step 1: Install Tailscale ==="
curl -fsSL https://tailscale.com/install.sh | sh

echo ""
echo "=== Step 2: Start Tailscale and authenticate ==="
echo "A browser URL will appear below. Open it to log in."
tailscale up

echo ""
echo "=== Step 3: Your Tailscale IP ==="
TS_IP=$(tailscale ip -4)
echo "Tailscale IP: $TS_IP"

echo ""
echo "=== Step 4: Serve the app ==="
echo "Open this on your iPhone: http://$TS_IP:4443"
echo ""
cd "$(dirname "$0")"
node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join('dist','index.html'));
http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(html);
}).listen(4443,'0.0.0.0',()=>console.log('Serving on http://'\$TS_IP':4443'));
"
