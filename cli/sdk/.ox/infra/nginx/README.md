# Custom Nginx Configuration

Place your custom nginx configuration files here.

## Files placed here will be mounted to:
- `keycloak-proxy` service: `/etc/nginx/conf.d/custom/`

## Example

```nginx
server {
    listen 8082;
    server_name localhost;

    location / {
        proxy_pass http://keycloak:8080;
    }
}
```
