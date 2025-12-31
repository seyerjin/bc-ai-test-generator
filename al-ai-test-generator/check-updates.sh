#!/bin/bash
echo "=== Checking for latest versions ==="
echo ""
echo "Current versions:"
npm list --depth=0 2>/dev/null | grep -E "@anthropic-ai/sdk|@types/node|@types/vscode|@vscode/vsce|eslint|typescript"
echo ""
echo "Latest available versions:"
echo ""
echo "1. @anthropic-ai/sdk:"
npm view @anthropic-ai/sdk version
echo ""
echo "2. @types/node:"
npm view @types/node version
echo ""
echo "3. @types/vscode (MUST match engines.vscode ^1.80.0):"
echo "   Current: 1.80.0 (KEEP - matches engines.vscode)"
echo ""
echo "4. @vscode/vsce:"
npm view @vscode/vsce version
echo ""
echo "5. eslint:"
npm view eslint version
echo ""
echo "6. typescript:"
npm view typescript version
