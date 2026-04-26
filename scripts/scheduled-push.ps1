param(
  [string]$Branch = "master",
  [string]$Remote = "origin",
  [int[]]$IntervalsMinutes = @(20, 30, 40, 10)
)

$ErrorActionPreference = "Stop"

Write-Host "Scheduled push helper"
Write-Host "Remote: $Remote, Branch: $Branch"
Write-Host "Intervals (minutes): $($IntervalsMinutes -join ', ')"
Write-Host ""
Write-Host "This script performs real pushes at real intervals."
Write-Host "Use only after your commits are ready."
Write-Host ""

for ($i = 0; $i -lt $IntervalsMinutes.Count; $i++) {
  $step = $i + 1
  $wait = $IntervalsMinutes[$i]

  Write-Host "Step $step/$($IntervalsMinutes.Count): pushing current branch..."
  git push $Remote $Branch
  Write-Host "Push $step completed."

  if ($step -lt $IntervalsMinutes.Count) {
    Write-Host "Waiting $wait minute(s) before next push..."
    Start-Sleep -Seconds ($wait * 60)
  }
}

Write-Host "All scheduled pushes completed."
