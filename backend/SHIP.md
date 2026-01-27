./zip.sh

find capabilities -name package.json -not -path "*/node_modules/*" \
  -exec jq -r '.name' {} \;

find foundation -name package.json -not -path "*/node_modules/*" \
  -exec jq -r '.name' {} \;

find proprietary -name package.json -not -path "*/node_modules/*" \
  -exec jq -r '.name' {} \;

find snippets -name package.json -not -path "*/node_modules/*" \
  -exec jq -r '.name' {} \;