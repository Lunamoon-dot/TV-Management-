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
    $body = @{ status=$status }
    if ($status -eq 'Cancelled') { $body.reason = 'Khach hang yeu cau huy don' }
    $response = Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/status" -WebSession $admin -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body ($body | ConvertTo-Json) -SkipHttpErrorCheck
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
    $created = Invoke-RestMethod "$BaseUrl/api/orders" -WebSession $customer -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ checkoutId=[guid]::NewGuid().ToString(); paymentMethod='CashOnDelivery'; recipientName='Nguyen Van Test'; phoneNumber='0901234567'; shippingAddress='123 Duong Test, Quan 1'; items=@(@{ productId=$productId; quantity=1 }) } | ConvertTo-Json -Depth 4)
    $orderId = $created.id

    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders" -WebSession $customer -SkipHttpErrorCheck) 403 'customer cannot list admin orders'
    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId" -WebSession $customer -SkipHttpErrorCheck) 403 'customer cannot read admin order detail'
    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/notes" -WebSession $customer -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ content='Customer must not add internal notes' } | ConvertTo-Json) -SkipHttpErrorCheck) 403 'customer cannot add internal note'
    $adminOrders = Invoke-RestMethod "$BaseUrl/api/admin/orders?page=1&pageSize=20" -WebSession $admin
    if (-not ($adminOrders.items | Where-Object id -eq $orderId)) { throw 'Admin list does not contain the order.' }
    Write-Output 'PASS: admin sees order'
    $filteredOrders = Invoke-RestMethod "$BaseUrl/api/admin/orders?page=1&pageSize=20&search=$suffix&status=Pending&paymentStatus=Unpaid" -WebSession $admin
    if ($filteredOrders.totalCount -ne 1 -or $filteredOrders.items[0].id -ne $orderId) { throw 'Combined admin order filters are incorrect.' }
    $emptyFilter = Invoke-RestMethod "$BaseUrl/api/admin/orders?page=1&pageSize=20&search=$suffix&status=Completed" -WebSession $admin
    if ($emptyFilter.totalCount -ne 0 -or $emptyFilter.items.Count -ne 0) { throw 'Admin status filter returned an incorrect order.' }
    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders?status=Unknown" -WebSession $admin -SkipHttpErrorCheck) 400 'invalid order status filter'
    Write-Output 'PASS: admin combines email, order status and payment filters'
    $adminDetails = Invoke-RestMethod "$BaseUrl/api/admin/orders/$orderId" -WebSession $admin
    if ($adminDetails.id -ne $orderId -or $adminDetails.customerEmail -ne $customerEmail -or $adminDetails.recipientName -ne 'Nguyen Van Test' -or $adminDetails.items[0].productId -ne $productId) { throw 'Admin order detail response is incorrect.' }
    Write-Output 'PASS: admin sees shipping and item details'

    $token = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $admin).token
    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/notes" -WebSession $admin -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ content='  ' } | ConvertTo-Json) -SkipHttpErrorCheck) 400 'blank internal note'
    $noteResponse = Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/notes" -WebSession $admin -Method Post -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ content='  Da goi xac nhan dia chi  ' } | ConvertTo-Json) -SkipHttpErrorCheck
    Expect $noteResponse 201 'admin adds internal note'
    $note = $noteResponse.Content | ConvertFrom-Json
    if ($note.content -ne 'Da goi xac nhan dia chi' -or $note.createdByEmail -ne $adminEmail) { throw 'Created internal note response is incorrect.' }
    $detailsWithNote = Invoke-RestMethod "$BaseUrl/api/admin/orders/$orderId" -WebSession $admin
    if ($detailsWithNote.notes.Count -ne 1 -or $detailsWithNote.notes[0].id -ne $note.id) { throw 'Admin detail does not contain internal note.' }
    Write-Output 'PASS: admin sees internal note in order details'

    Change-Status 'Completed' 400
    Change-Status 'Confirmed' 204
    $token = (Invoke-RestMethod "$BaseUrl/api/auth/csrf" -WebSession $admin).token
    Expect (Invoke-WebRequest "$BaseUrl/api/admin/orders/$orderId/status" -WebSession $admin -Method Put -ContentType 'application/json' -Headers @{ 'X-CSRF-TOKEN'=$token } -Body (@{ status='Cancelled' } | ConvertTo-Json) -SkipHttpErrorCheck) 400 'cancel without reason'
    Change-Status 'Cancelled' 204
    $stockRestored = $true
    Change-Status 'Cancelled' 400

    $historyDetails = Invoke-RestMethod "$BaseUrl/api/admin/orders/$orderId" -WebSession $admin
    if ($historyDetails.statusHistory.Count -ne 3) { throw "Expected 3 status history entries, got $($historyDetails.statusHistory.Count)." }
    if ($historyDetails.statusHistory[0].newStatus -ne 'Pending' -or $historyDetails.statusHistory[0].changedByEmail -ne $customerEmail) { throw 'Initial status history is incorrect.' }
    if ($historyDetails.statusHistory[1].previousStatus -ne 'Pending' -or $historyDetails.statusHistory[1].newStatus -ne 'Confirmed' -or $historyDetails.statusHistory[1].changedByEmail -ne $adminEmail) { throw 'Confirmed status history is incorrect.' }
    if ($historyDetails.statusHistory[2].previousStatus -ne 'Confirmed' -or $historyDetails.statusHistory[2].newStatus -ne 'Cancelled' -or $historyDetails.statusHistory[2].changedByEmail -ne $adminEmail -or $historyDetails.statusHistory[2].reason -ne 'Khach hang yeu cau huy don') { throw 'Cancelled status history is incorrect.' }
    Write-Output 'PASS: status history records actor and transitions'

    $customerOrder = Invoke-RestMethod "$BaseUrl/api/orders/$orderId" -WebSession $customer
    if ($customerOrder.status -ne 'Cancelled') { throw 'Customer does not see updated status.' }
    if ($null -ne $customerOrder.PSObject.Properties['notes']) { throw 'Customer response leaked internal notes.' }
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
