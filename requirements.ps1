param([switch]$StartApp, [switch]$Rebuild)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Set-Location -LiteralPath $PSScriptRoot
$runtimeRoot = Join-Path $PSScriptRoot '.runtime'

function Test-NodeRuntime([string]$Directory) {
    $nodePath = Join-Path $Directory 'node.exe'
    $npmPath = Join-Path $Directory 'npm.cmd'
    if (!(Test-Path -LiteralPath $nodePath) -or !(Test-Path -LiteralPath $npmPath)) { return $false }
    try {
        $nodeVersion = & $nodePath --version 2>$null
        if ($LASTEXITCODE -ne 0) { return $false }
        if ([version]($nodeVersion.Trim().TrimStart('v')) -lt [version]'20.15.0') { return $false }
        & $npmPath --version >$null 2>&1
        return $LASTEXITCODE -eq 0
    } catch { return $false }
}

try {
    $nodeDirectory = $null
    $systemNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($systemNode -and (Test-NodeRuntime (Split-Path -Parent $systemNode.Source))) {
        $nodeDirectory = Split-Path -Parent $systemNode.Source
    }
    if (!$nodeDirectory -and (Test-Path -LiteralPath $runtimeRoot)) {
        foreach ($candidate in (Get-ChildItem -LiteralPath $runtimeRoot -Directory -Filter 'node-v*-win-*' | Sort-Object LastWriteTime -Descending)) {
            if (Test-NodeRuntime $candidate.FullName) { $nodeDirectory = $candidate.FullName; break }
        }
    }
    if (!$nodeDirectory) {
        Write-Host 'Installing a portable Node.js LTS runtime for PDF DIFF...'
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        $machineArchitecture = $env:PROCESSOR_ARCHITEW6432
        if (!$machineArchitecture) { $machineArchitecture = $env:PROCESSOR_ARCHITECTURE }
        $architecture = switch ($machineArchitecture) {
            'AMD64' { 'x64' }
            'ARM64' { 'arm64' }
            'x86' { 'x86' }
            default { throw "Unsupported Windows architecture: $machineArchitecture" }
        }
        $releases = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
        $release = $releases | Where-Object {
            $_.lts -and [version]($_.version.TrimStart('v')) -ge [version]'22.0.0' -and $_.files -contains "win-$architecture-zip"
        } | Select-Object -First 1
        if (!$release -or $release.version -notmatch '^v\d+\.\d+\.\d+$') { throw 'No compatible Node.js LTS download was found.' }
        $archiveName = "node-$($release.version)-win-$architecture.zip"
        $releaseUrl = "https://nodejs.org/dist/$($release.version)"
        New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
        $archivePath = Join-Path $runtimeRoot $archiveName
        $checksums = (Invoke-WebRequest -UseBasicParsing -Uri "$releaseUrl/SHASUMS256.txt").Content
        $checksumLine = $checksums -split '\r?\n' | Where-Object { $_ -match ('^[a-fA-F0-9]{64}\s+' + [regex]::Escape($archiveName) + '$') } | Select-Object -First 1
        if (!$checksumLine) { throw 'The official archive checksum was not found.' }
        $expectedChecksum = ($checksumLine -split '\s+')[0]
        Invoke-WebRequest -UseBasicParsing -Uri "$releaseUrl/$archiveName" -OutFile $archivePath
        if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ne $expectedChecksum) { throw 'Node.js download checksum failed. Run setup again to retry.' }
        Expand-Archive -LiteralPath $archivePath -DestinationPath $runtimeRoot -Force
        $nodeDirectory = Join-Path $runtimeRoot "node-$($release.version)-win-$architecture"
        if (!(Test-NodeRuntime $nodeDirectory)) { throw 'The downloaded Node.js runtime could not run.' }
    }
    # Use the selected runtime only in this process and its children.
    $env:PATH = "$nodeDirectory;$env:PATH"
    $npmCommand = Join-Path $nodeDirectory 'npm.cmd'
    Write-Host "Using Node.js $(& (Join-Path $nodeDirectory 'node.exe') --version)"
    New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
    $lockHash = (Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'package-lock.json') -Algorithm SHA256).Hash
    $stampPath = Join-Path $runtimeRoot 'dependencies.sha256'
    $savedHash = if (Test-Path -LiteralPath $stampPath) { (Get-Content -LiteralPath $stampPath -Raw).Trim() } else { '' }
    $installed = $false
    if (!(Test-Path -LiteralPath 'node_modules\.bin\vite.cmd') -or $savedHash -ne $lockHash) {
        Write-Host 'Installing locked app requirements, including Vite...'
        & $npmCommand ci --include=dev
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed (exit $LASTEXITCODE). Check your internet connection and the error above." }
        Set-Content -LiteralPath $stampPath -Value $lockHash -Encoding ascii
        $installed = $true
    }
    $buildPath = Join-Path $PSScriptRoot 'dist\index.html'
    $needsBuild = $Rebuild -or $installed -or !(Test-Path -LiteralPath $buildPath)
    if (!$needsBuild) {
        $buildTime = (Get-Item -LiteralPath $buildPath).LastWriteTimeUtc
        $inputs = @(Get-ChildItem -LiteralPath 'src','public' -File -Recurse) + @(Get-Item -LiteralPath 'index.html','vite.config.js','package.json','package-lock.json')
        $needsBuild = @($inputs | Where-Object { $_.LastWriteTimeUtc -gt $buildTime }).Count -gt 0
    }
    if ($needsBuild) {
        Write-Host 'Building PDF DIFF...'
        & $npmCommand run build
        if ($LASTEXITCODE -ne 0) { throw "App build failed (exit $LASTEXITCODE)." }
    }
    Write-Host 'PDF DIFF requirements are ready.'
    if ($StartApp) {
        Write-Host 'Starting PDF DIFF at http://127.0.0.1:4321'
        Write-Host 'Keep this window open while using the app.'
        & $npmCommand start
        if ($LASTEXITCODE -ne 0) { throw "PDF DIFF stopped with exit code $LASTEXITCODE." }
    }
    exit 0
} catch {
    Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'First-time setup needs internet access and a writable project folder. If your organization blocks PowerShell or downloads, contact IT.'
    exit 1
}
