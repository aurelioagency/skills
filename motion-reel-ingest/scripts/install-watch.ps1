param(
    [Parameter(Mandatory=$true)][string]$ClaudeExe,
    [string]$Root,
    [string]$PythonExe = (Get-Command python -ErrorAction Stop).Source,
    [switch]$Remove
)
$ErrorActionPreference = 'Stop'
$taskName = 'MotionReelIngest-' + $env:USERNAME
if ($Remove) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    exit
}
if (!(Test-Path -LiteralPath $ClaudeExe -PathType Leaf)) { throw 'Claude Code executable not found.' }
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
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output "Watcher installed: $taskName. Inbox: $resolvedRoot\Crudos. Runs while this Windows user is logged in."
