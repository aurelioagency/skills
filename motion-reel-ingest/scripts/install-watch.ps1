param(
    [string]$ClaudeExe,
    [string]$Root,
    [string]$PythonExe,
    [switch]$Remove
)
$ErrorActionPreference = 'Stop'
$taskName = 'MotionReelIngest-' + $env:USERNAME
if ($Remove) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    exit
}
if (!$PythonExe) {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) { $PythonExe = $python.Source }
}
if (!$PythonExe) { throw 'Setup incomplete: Python 3.10+ is missing. The installing agent must install Python and rerun setup.' }
& $PythonExe -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)'
if ($LASTEXITCODE -ne 0) { throw 'Setup incomplete: a working Python 3.10+ is required.' }
function Find-Claude {
    $found = Get-Command claude.exe -ErrorAction SilentlyContinue
    if ($found) { return $found.Source }
    $candidates = @(
        (Join-Path $env:USERPROFILE '.local\bin\claude.exe'),
        (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\claude.exe')
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    $packages = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    if (Test-Path -LiteralPath $packages) {
        $package = Get-ChildItem -LiteralPath $packages -Directory -Filter 'Anthropic.ClaudeCode*' |
            ForEach-Object { Get-ChildItem -LiteralPath $_.FullName -Filter claude.exe -Recurse -File } |
            Select-Object -First 1
        if ($package) { return $package.FullName }
    }
}
if (!$ClaudeExe) { $ClaudeExe = Find-Claude }
if (!$ClaudeExe) {
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (!$winget) { throw 'Setup incomplete: install Claude Code using https://code.claude.com/docs/en/setup and rerun this script.' }
    & $winget.Source install --id Anthropic.ClaudeCode --exact --source winget --accept-source-agreements --accept-package-agreements --silent
    if ($LASTEXITCODE -ne 0) { throw 'Claude Code installation failed; watcher was not activated.' }
    $ClaudeExe = Find-Claude
}
if (!$ClaudeExe -or !(Test-Path -LiteralPath $ClaudeExe -PathType Leaf)) { throw 'Setup incomplete: Claude Code executable not found after install.' }
& $ClaudeExe auth status --text
if ($LASTEXITCODE -ne 0) {
    Write-Output 'Claude requires your account login. Complete the browser login to continue setup.'
    & $ClaudeExe auth login
    & $ClaudeExe auth status --text
    if ($LASTEXITCODE -ne 0) { throw 'Setup pending account login; watcher was not activated. Rerun setup after signing in.' }
}
$skillsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
foreach ($skill in @('motion-reel-pipeline', 'motion-reel', 'resource-page', 'replykaro-automation', 'post-for-me')) {
    if (!(Test-Path -LiteralPath (Join-Path $skillsRoot "$skill\SKILL.md"))) {
        throw "Setup incomplete: missing sibling skill $skill. Install the full pipeline package and rerun setup."
    }
}
$scriptPath = Join-Path $PSScriptRoot 'watch.py'
$initArgs = @($scriptPath)
if ($Root) { $initArgs += @('--root', $Root) }
$initArgs += @('init', '--claude', $ClaudeExe)
$resolvedRoot = & $PythonExe @initArgs
if ($LASTEXITCODE -ne 0) { throw 'Initialization failed.' }
$resolvedRoot = ($resolvedRoot | Select-Object -Last 1).Trim()
$arguments = '"' + $scriptPath + '" --root "' + $resolvedRoot + '" run'
$action = New-ScheduledTaskAction -Execute $PythonExe -Argument $arguments -WorkingDirectory $PSScriptRoot
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing -and $existing.State -eq 'Running') {
    Write-Output "Watcher already running: $taskName. No active work was interrupted."
    exit
}
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 3
if ((Get-ScheduledTask -TaskName $taskName).State -ne 'Running') {
    throw 'Watcher did not remain running. Inspect Task Scheduler LastTaskResult; installation is incomplete.'
}
Write-Output "Watcher installed: $taskName. Inbox: $resolvedRoot\Crudos. Runs while this Windows user is logged in."
