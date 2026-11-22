# Validate the shell code

# Get the code from the editor
$code = Get-Content -Path $args[0]

# Validate the shell code
$valid = Validate::validate($code)

# Print the validation result
Write-Output $valid

# If the code is not valid, print the error
if (!$valid) {
    Write-Output "Error: The code is not valid"
    Exit 1
}

# If the code is valid, print the success message
Write-Output "Success: The code is valid"