# Audit the code

# Get the code from the editor
$code = Get-Content -Path $args[0]

# Audit the code
$audit = Audit::audit($code)

# Print the audit
Write-Output $audit