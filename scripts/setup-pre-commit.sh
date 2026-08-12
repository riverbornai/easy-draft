#!/usr/bin/env bash
# Setup local git pre-commit hook to prevent accidental secret commits

HOOK_FILE=".git/hooks/pre-commit"

mkdir -p .git/hooks

cat << 'EOF' > "$HOOK_FILE"
#!/usr/bin/env bash

# Check staged files for common secret patterns before allowing commit
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

SECRETS_FOUND=0

# Pattern checks
for FILE in $STAGED_FILES; do
  # Skip .env.example
  if [[ "$FILE" == *".env.example"* ]]; then
    continue
  fi

  # Check for private keys
  if git diff --cached "$FILE" | grep -qE "-----BEGIN (RSA |EC |OPENSSH |PRIVATE )?KEY-----"; then
    echo "❌ ERROR: Private key detected in staged file: $FILE"
    SECRETS_FOUND=1
  fi

  # Check for OpenAI API keys
  if git diff --cached "$FILE" | grep -qE "sk-proj-[A-Za-z0-9_-]{32,}"; then
    echo "❌ ERROR: OpenAI API key detected in staged file: $FILE"
    SECRETS_FOUND=1
  fi

  # Check for Anthropic API keys
  if git diff --cached "$FILE" | grep -qE "sk-ant-[A-Za-z0-9_-]{32,}"; then
    echo "❌ ERROR: Anthropic API key detected in staged file: $FILE"
    SECRETS_FOUND=1
  fi
done

if [ $SECRETS_FOUND -ne 0 ]; then
  echo ""
  echo "⛔ COMMIT BLOCKED: Secrets detected in staged files!"
  echo "Please remove the secret keys before committing."
  exit 1
fi

exit 0
EOF

chmod +x "$HOOK_FILE"
echo "✅ Local Git pre-commit hook installed successfully!"
