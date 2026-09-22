param([string]$BaseUrl = 'http://localhost:5005', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$customerEmail = "status-customer-$suffix@example.test"
$adminEmail = "status-admin-$suffix@example.test"
$password = 'localtest123'
$customer = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$admin = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$orderId = 0
$productId = 0
$stockRestored = $false

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}

function Register($session, [string]$email) {
    $token = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    $response = Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $response 201 "register $email"
}

function Login($session, [string]$email) {
    $token = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    $response = Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $response 204 "login $email"
}

function Change-Status([string]$status, [int]$expected) {
    $token = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $admin).token
    $response = Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/status" -WebSession $admin -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ status=$status } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $response $expected "change status to $status"
}

try {
    Register $customer $customerEmail
    Register $admin $adminEmail
    $roleSql = "INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT u.Id, r.Id FROM AspNetUsers u CROSS JOIN AspNetRoles r WHERE u.Email='$adminEmail' AND r.Name='Admin';"
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q $roleSql | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not assign Admin role.' }
    Login $customer $customerEmail
    Login $admin $adminEmail

    $catalog = Invoke-RestMethod "$BaseUrl/api/products?page=1&pageSize=1"
    $productId = $catalog.items[0].id
    $stockBefore = $catalog.items[0].stock
    $token = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $customer).token
    $created = Invoke-RestMethod "$BaseUrl/api/orders" -WebSession $customer -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ checkoutId=[guid]::NewGuid().ToString(); recipientName='Nguyen Van Test'; phoneNumber='0901234567'; shippingAddress='123 Duong Test, Quan 1'; items=@(@{ productId=$productId; quantity=1 }) } | ConvertTo-Json -Depth 4)
    $orderId = $created.id

    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders" -WebSession $customer -SkipHttpErrorCheck) 403 'customer cannot list admin orders'
    $adminOrders = Invoke-RestMethod "$BaseUrl/api/admin/orders?page=1&pageSize=20" -WebSession $admin
    if (-not ($adminOrders.items | Where-Object id -eq $orderId)) { throw 'Admin list does not contain the order.' }
    Write-Output 'PASS: admin sees order'

    Change-Status 'Completed' 400
    Change-Status 'Confirmed' 204
    Change-Status 'Cancelled' 204
    $stockRestored = $true
    Change-Status 'Cancelled' 400

    $customerOrder = Invoke-RestMethod "$BaseUrl/api/orders/$orderId" -WebSession $customer
    if ($customerOrder.status -ne 'Cancelled') { throw 'Customer does not see updated status.' }
    $productAfterCancel = Invoke-RestMethod "$BaseUrl/api/products/$productId"
    if ($productAfterCancel.stock -ne $stockBefore) { throw 'Cancelling did not restore product stock.' }
    Write-Output 'PASS: customer sees Cancelled and stock is restored once'
} finally {
    $cleanup = @"
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
IF $orderId > 0
BEGIN
    IF '$stockRestored' = 'False' UPDATE Products SET Stock = Stock + 1 WHERE Id = $productId;
    DELETE FROM OrderItems WHERE OrderId = $orderId;
    DELETE FROM Orders WHERE Id = $orderId;
END;
DELETE FROM AspNetUsers WHERE Email IN ('$customerEmail', '$adminEmail');
"@
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q $cleanup | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Test cleanup failed.' }
}
