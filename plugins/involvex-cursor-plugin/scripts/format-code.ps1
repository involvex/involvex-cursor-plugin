# Using Prettier to format the code

# Get the code from the editor
$code = Get-Content -Path $args[0]

# Format the code
$formattedCode = Prettier::format($code)

# Write the formatted code back to the editor
Set-Content -Path $args[0] -Value $formattedCode