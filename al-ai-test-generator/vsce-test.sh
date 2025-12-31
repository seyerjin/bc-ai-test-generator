#!/bin/bash
echo "=== Testing vsce package ==="
echo ""
echo "Checking versions..."
echo "engines.vscode: $(grep 'engines' package.json -A 1 | grep vscode | cut -d'"' -f4)"
echo "@types/vscode: $(npm list @types/vscode | grep @types | awk '{print $2}')"
echo ""
echo "Creating package..."
npx vsce package 2>&1 | tee vsce-output.log
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Package created:"
    ls -lh *.vsix
else
    echo ""
    echo "❌ ERROR - See output above"
    exit 1
fi
