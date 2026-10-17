$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimePath = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'backend/.runtime'))
if (-not $runtimePath.StartsWith($projectRoot + [System.IO.Path]::DirectorySeparatorChar)) { throw 'Invalid runtime location.' }
New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null
$archivePath = Join-Path $runtimePath 'mongodb-8.0.34.zip'
$expectedHash = '6b021a0864494e4decf278b36477a29eb36072432773e4e62c2f42c302630db0'
if (-not (Test-Path -LiteralPath $archivePath)) {
  Write-Output 'Downloading MongoDB Community 8.0.34 from the official MongoDB distribution...'
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $downloader = New-Object System.Net.WebClient
  try { $downloader.DownloadFile('https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.34.zip', $archivePath + '.download') }
  finally { $downloader.Dispose() }
  Move-Item -LiteralPath ($archivePath + '.download') -Destination $archivePath
}
$archiveStream = [System.IO.File]::OpenRead($archivePath)
$hasher = [System.Security.Cryptography.SHA256]::Create()
try { $actualHash = [BitConverter]::ToString($hasher.ComputeHash($archiveStream)).Replace('-', '').ToLowerInvariant() }
finally { $archiveStream.Dispose(); $hasher.Dispose() }
if ($actualHash -ne $expectedHash) { throw 'MongoDB archive checksum mismatch. The archive was not executed.' }
$binary = Get-ChildItem -LiteralPath $runtimePath -Filter 'mongod.exe' -File -Recurse | Select-Object -First 1
if (-not $binary) {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::ExtractToDirectory($archivePath, $runtimePath)
  $binary = Get-ChildItem -LiteralPath $runtimePath -Filter 'mongod.exe' -File -Recurse | Select-Object -First 1
}
if (-not $binary -or -not $binary.FullName.StartsWith($runtimePath + [System.IO.Path]::DirectorySeparatorChar)) { throw 'MongoDB binary was not found inside the project runtime.' }
Set-Content -LiteralPath (Join-Path $runtimePath 'mongod-path.txt') -Value $binary.FullName -Encoding utf8
Write-Output 'Verified MongoDB Community runtime is ready in backend/.runtime.'
