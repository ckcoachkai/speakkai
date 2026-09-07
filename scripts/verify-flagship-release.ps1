param(
  [Parameter(Mandatory=$true)][string]$Version,
  [Parameter(Mandatory=$true)][long]$RunId,
  [Parameter(Mandatory=$true)][string]$Commit,
  [string[]]$Routes = @('/', '/coaching/', '/schools/', '/companies/', '/contact/')
)
$ErrorActionPreference = 'Stop'
$releaseRun = Invoke-RestMethod "https://api.github.com/repos/ckcoachkai/speakkai/actions/runs/$RunId" -Headers @{'User-Agent'='SpeakKai-release-verifier'}
if ($releaseRun.status -ne 'completed' -or $releaseRun.conclusion -ne 'success') { throw "Workflow is $($releaseRun.status) / $($releaseRun.conclusion)" }
if ($releaseRun.head_sha -ne $Commit) { throw 'Workflow commit does not match the expected release' }
$routeResults = foreach ($route in $Routes) {
  $response = Invoke-WebRequest ('https://speakkai.com' + $route) -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
  $marker = [regex]::Match($response.Content, '<meta name="speakkai-version" content="([0-9]+)"').Groups[1].Value
  if ($response.StatusCode -ne 200 -or $marker -ne $Version) { throw "$route returned $($response.StatusCode), version $marker; expected $Version" }
  [pscustomobject]@{route=$route;status=$response.StatusCode;version=$marker}
}
$evidence = [pscustomobject]@{checkedAt=(Get-Date).ToUniversalTime().ToString('o');version=$Version;run=$RunId;commit=$Commit;workflow='success';routes=$routeResults}
$evidence | ConvertTo-Json -Depth 4
