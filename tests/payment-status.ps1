param([string]$BaseUrl = 'http://localhost:5005', [string]$SqlServer = '.\MSSQLSERVER01', [string]$Database = 'NothingDb')
$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N')
$customerEmail = "payment-customer-$suffix@example.test"
$adminEmail = "payment-admin-$suffix@example.test"
$password = 'localtest123'
$customer = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$admin = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$orderId = 0
$productId = 0

function Expect($response, [int]$code, [string]$label) {
    if ($response.StatusCode -ne $code) { throw "${label}: expected $code, got $($response.StatusCode)" }
    Write-Output "PASS: $label ($code)"
}
function Register-And-Login($session, [string]$email) {
    $token = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $session).token
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 201 "register $email"
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $session -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ email=$email; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 204 "login $email"
}

try {
    Register-And-Login $customer $customerEmail
    $adminToken = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $admin).token
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/register" -WebSession $admin -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$adminToken } -Body (@{ email=$adminEmail; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 201 'register admin'
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q "INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT u.Id, r.Id FROM AspNetUsers u CROSS JOIN AspNetRoles r WHERE u.Email='$adminEmail' AND r.Name='Admin';" | Out-Null
    Expect (Invoke-WebRequest "$BaseUrl/api/auth/login" -WebSession $admin -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$adminToken } -Body (@{ email=$adminEmail; password=$password } | ConvertTo-Json) -SkipHttpErrorCheck) 204 'login admin'

    $productId = (Invoke-RestMethod "$BaseUrl/api/products?page=1&pageSize=1").items[0].id
    $customerToken = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $customer).token
    $body = @{ checkoutId=[guid]::NewGuid().ToString(); paymentMethod='BankTransfer'; recipientName='Payment Test'; phoneNumber='0901234567'; shippingAddress='123 Payment Test Street'; items=@(@{ productId=$productId; quantity=1 }) } | ConvertTo-Json -Depth 4
    $orderId = (Invoke-RestMethod "$BaseUrl/api/orders" -WebSession $customer -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$customerToken } -Body $body).id

    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/payment-status" -WebSession $customer -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$customerToken } -Body '{"status":"Paid"}' -SkipHttpErrorCheck) 403 'customer cannot mark payment paid'
    $adminToken = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $admin).token
    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/payment-status" -WebSession $admin -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$adminToken } -Body '{"status":"Paid"}' -SkipHttpErrorCheck) 204 'admin marks payment paid'
    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/payment-status" -WebSession $admin -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$adminToken } -Body '{"status":"Paid"}' -SkipHttpErrorCheck) 204 'mark paid retry is idempotent'
    $stored = Invoke-RestMethod "$BaseUrl/api/orders/$orderId" -WebSession $customer
    if ($stored.paymentStatus -ne 'Paid') { throw 'Customer does not see Paid status.' }
    Expect (Invoke-WebRequest "$BaseUrl/api/orders/$orderId/cancel" -WebSession $customer -Method Post -Headers @{ 'X-CSRF-TOKEN'=$customerToken } -SkipHttpErrorCheck) 400 'paid order cannot be cancelled'
} finally {
    $cleanup = "IF $orderId > 0 BEGIN UPDATE Products SET Stock=Stock+1 WHERE Id=$productId; DELETE FROM OrderItems WHERE OrderId=$orderId; DELETE FROM Orders WHERE Id=$orderId; END; DELETE FROM AspNetUsers WHERE Email IN ('$customerEmail','$adminEmail');"
    & sqlcmd -S $SqlServer -d $Database -E -C -I -b -Q $cleanup | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Test cleanup failed.' }
}
