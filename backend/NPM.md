pnpm config set registry http://localhost:4873/

pnpm adduser --registry http://localhost:4873/

curl -XPUT -H "Content-Type: application/json" -d '{"name":"admin","password":"admin"}' http://localhost:4873/-/user/org.couchdb.user:admin 2>/dev/null || echo "Auth setup may need manual intervention"

pnpm token add --registry http://localhost:4873/ --token "${VERDACCIO_TOKEN}" 2>&1 || true

cd /path/to/oxlayer/foundation && pnpm run --recursive build 2>&1

cd /path/to/oxlayer/foundation && for dir in */; do echo "Building $dir"; cd "$dir" && pnpm run build 2>&1 | head -20; cd ..; done

pnpm publish --no-git-checks
