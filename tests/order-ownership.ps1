param([string]$BaseUrl = 'http://localhost:5005', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$email1 = "order-owner-$suffix@example.test"
$email2 = "order-other-$suffix@example.test"
$password = 'Local-Order-Test-123!'
$session1 = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$session2 = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$orderId = 0
$productId = 0

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}

function Create-Account($session, [string]$email) {
    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    $register = Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $register 201 "register $email"
    $login = Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $login 204 "login $email"
}

try {
    Expect (Invoke-WebRequest "$BaseUrl/api/orders" -SkipHttpErrorCheck) 401 'anonymous history'
    Create-Account $session1 $email1
    Create-Account $session2 $email2

    $catalog = Invoke-RestMethod "$BaseUrl/api/products?page=1&pageSize=1"
    if (@($catalog.items).Count -ne 1 -or $catalog.items[0].stock -lt 1) { throw 'No product with stock available for order test.' }
    $productId = $catalog.items[0].id

    $csrf = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session1).token
    $created = Invoke-RestMethod "$BaseUrl/api/orders" -WebSession $session1 -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$csrf } -Body (@{ items=@(@{ productId=$productId; quantity=1 }) } | ConvertTo-Json -Depth 4)
    $orderId = $created.id
    if ($orderId -le 0) { throw 'Order was not created.' }
    Write-Output "PASS: owner created order #$orderId"

    $history = Invoke-RestMethod "$BaseUrl/api/orders?page=1&pageSize=10" -WebSession $session1
    if ($history.totalCount -ne 1 -or $history.items[0].id -ne $orderId) { throw 'Owner history does not contain the created order.' }
    Write-Output 'PASS: owner history contains order'

    $details = Invoke-RestMethod "$BaseUrl/api/orders/$orderId" -WebSession $session1
    if ($details.id -ne $orderId -or $details.items[0].productId -ne $productId) { throw 'Owner detail response is incorrect.' }
    Write-Output 'PASS: owner can read order detail'

    Expect (Invoke-WebRequest "$BaseUrl/api/orders/$orderId" -WebSession $session2 -SkipHttpErrorCheck) 404 'other customer cannot read order'
    $otherHistory = Invoke-RestMethod "$BaseUrl/api/orders?page=1&pageSize=10" -WebSession $session2
    if ($otherHistory.totalCount -ne 0) { throw 'Other customer history leaked an order.' }
    Write-Output 'PASS: histories are isolated by customer'
} finally {
    $cleanup = @"
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
IF $orderId > 0
BEGIN
    UPDATE Products SET Stock = Stock + 1 WHERE Id = $productId;
    DELETE FROM OrderItems WHERE OrderId = $orderId;
    DELETE FROM Orders WHERE Id = $orderId;
END;
DELETE FROM AspNetUsers WHERE Email IN ('$email1', '$email2');
"@
    $result = & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q $cleanup
    if ($LASTEXITCODE -ne 0) { throw "Test cleanup failed: $($result -join ' ')" }
}
