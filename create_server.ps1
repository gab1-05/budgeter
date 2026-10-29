# PowerShell script to create server files
$content = '{
  "name": "server",
  "version": "1.0.0",
  "description": "Expense Tracker Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "type": "commonjs",
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^16.4.5",
    "express": "^5.3.0",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.11.1"
  }
}'
Set-Content -Path 'C:\projects\wt\experiments\exp10\CA2\server\package.json' -Value $content -Encoding UTF8
Write-Host 'Done'