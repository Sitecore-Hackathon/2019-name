#
# ClearEventQueue.ps1
#
param(
	[string] $dataSource = ".\SQLEXPRESS",
	[string] $database = "undefined",
	[string] $user = "unknown",
	[string] $password = "password"
  )
  
$sqlCommand = "truncate table EventQueue"
$connectionString = "Data Source=$dataSource;" +
		"user id=$user;password=$password;" +
		"Database=$database"
Write-Host "Clearing event queue on $connectionString"
$connection = new-object system.data.SqlClient.SQLConnection($connectionString)
$command = new-object system.data.sqlclient.sqlcommand($sqlCommand,$connection)
$connection.Open()

$adapter = New-Object System.Data.sqlclient.sqlDataAdapter $command
$dataset = New-Object System.Data.DataSet
$adapter.Fill($dataSet) | Out-Null

$connection.Close()
$dataSet.Tables
