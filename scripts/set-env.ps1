param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev","production")]
    [string]$Env
)

$source = ".env.$Env"
$target = ".env"

if (-Not (Test-Path $source)) {
    Write-Error "Environment file '$source' not found."
    exit 1
}

Copy-Item -Path $source -Destination $target -Force
Write-Host "[env] Switched to '$Env' (copied $source -> $target)"
