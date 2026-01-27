import { useEffect, useState } from 'react';
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'globex',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'globex-manager',
});

export function useKeycloak() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'login-required',
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        setInitialized(true);
        console.log('Keycloak initialized, authenticated:', authenticated);
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        setInitialized(true);
      });
  }, []);

  return { keycloak, initialized };
}

export { keycloak };
