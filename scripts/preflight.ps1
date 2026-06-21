$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) {
  Write-Error "Channel Targeting Agent requires a working Node.js 20+ runtime. Install the current Node.js LTS from https://nodejs.org/en/download, reopen PowerShell, then rerun this preflight check."
  exit 1
}

$nodeVersion = (& node --version 2>$null).Trim()
if ($nodeVersion -notmatch '^v(?<major>\d+)\.') {
  Write-Error "Could not determine the installed Node.js version ($nodeVersion). Install the current Node.js LTS from https://nodejs.org/en/download, then rerun this preflight check."
  exit 1
}

if ([int]$Matches.major -lt 20) {
  Write-Error "Node.js $nodeVersion is installed, but Channel Targeting Agent requires Node.js 20 or newer. Install or activate Node.js 20+ from https://nodejs.org/en/download, then rerun this preflight check."
  exit 1
}

Write-Output "Node.js $nodeVersion detected."
$npmCommand = Get-Command npm -ErrorAction SilentlyContinue
if ($null -ne $npmCommand) {
  Write-Output "npm $((& npm --version).Trim()) detected. Run: npm test"
} else {
  Write-Output "npm is not available. Run tests directly: node --test"
  Write-Output "Generate reports directly: node src/report.js <brief.md> --out <report.md>"
}
