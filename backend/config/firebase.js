import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Hardcoded fallback service account (same pattern as db.js hardcoded DB URL)
const FALLBACK_SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "d-personal-vault",
  private_key_id: "e38b55a0e3c664b197dfe47e41814c8a9829c387",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC6WCjikqj4gR/e\nOvqOfHyEJYz4kRhIsvgziUh+UZHyjAuYaksLPZm3hZ4zAzy+EUl6mvcbTPP/u/JZ\na0xEszWovNB9FvrxqFpKokmGvoWwB9uxBjFPrDQ5Mb4vJHz0/bYUhqKl1TncB/Kc\nCAqZgMuK5TKKyQ3Bld6ZrlFd8vXUqTc2E+IhwnGiuJRnJfnTlSgL1L6J89Y6NjiR\nktlFoNlKr+aV1QhOT9RT72bNbVydTZk/Q4/4SUX/2hbzl+B1v4ff1o68gkF0D625\nE3B0LwC3PhEkKt4NeW5UbdPBSNFPiY/pTFlboYg2vdYaZAp6vHklOkvVSeeLJmn7\nYYc2JqMFAgMBAAECggEAEHzj8zY8Vq6gKfroeAqKPuwOpuC5uBcD0JWNUUX45q/f\nB8eh57b13q/nMUbQTVX8vSkwg50husc/uIs+ppZ/wTQhs2vA3PiDMrbc0BwT+qEb\nXnS4kL7hKQ1ecU/mcYvwXC0Uf51X/wDCBe3NOEtV1y6T9AU5nx8aYNk0cF5iw4Pl\ny7VYjVvxkP4yKxOaWGyJ2Ul1xw7ZWRmdiZXsvunX4+Oz0zeE4idLadWmApdCzxHx\nnWdVZ24uZkCT232aajXGu7Q+DG3eK2we7c9WEcV197Wdalyju86DPmycgv0ZVWwb\nNLddEuJOIcWNYPX+tPtx7t/FKoDiF6sBK+XJjx1PiQKBgQDdoJwkSUYgiUBI7Qpj\neUIZB9lZOc6veK9vorx3MGZ35jdpmPJcPAWMnX3/0q0Kkblyn7md3bSqGenRwn94\nbVvrgjvEePXw8K41tLo351+ZYHhCl4yQQPe6+Yz6cnAEblLHEYGKwxuLoFdNAuZw\nFOKJa1p9XE8oq+BpFxU8an65PQKBgQDXPrCPEsslNWz8aGz/p4KmCmcifr+KBhP8\nA4LaQmi19/w5zIoyPSvqLjv9n0E2oEc6ENtI605M9ysJZu9U02ouJDElJ+eKdHfY\n24LvPQuh3vbCxiPbU6+wYLkkHIZihxFMNiStrEYPeq3IaN75U7BgFtyjHmXU/7IK\nFCqtAX/daQKBgQC5eTXy8BduFy7jWOy+vrXgOL9eepBMLRW0uV476Rd39AQfrU32\nfoyuVwchVvBVzgqCsMUoJmiRikoxrzH6WJr6huz5ybkZQHKqo2rMaieJNkCuiiGq\nf5RSt5GR7r9sFd/UlQPyWsHsoe0tl+W9mtzS4DLEgsIEaYLOr/CntQAEiQKBgQC4\n6S0qrF2CiKQpLti8xD4TwIobc0G/JDuU27tVH4nvEaxIRzRNtol8c92ro12VvRmT\ng5muyh8JNaluOVTPzZPBMexaXC6onie7T9DrD8lndTEN4MQ7Dmi3IFDM+ghkql4s\n17Ko1H+Xmq+ipJ0xGjlCQ0GmjF21HzjnOa3z1H7xSQKBgQDKfaKAXhU1nymIhI7k\nuJ1zEKj7NgFKJiRWa+z3mzgd7QG7WJIayxTSFNC8tphGAaaDHJJhuZ0Kix+EXryb\nd1n9hyAUuI8AvFdEwELWHGfcf7h+rAjir53HZpXPeSBuzMyqHqQr2da3l1/42J/O\nhnxcyW9NqShjcNZQl2jpkVdMaw==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@d-personal-vault.iam.gserviceaccount.com",
  client_id: "104745553683853031791",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40d-personal-vault.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

/**
 * Get Firebase Auth instance, initializing the Admin SDK lazily on first call.
 * Credential sources (in order of priority):
 *   1. FIREBASE_SERVICE_ACCOUNT env var (full JSON string)
 *   2. FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL env vars
 *   3. Hardcoded fallback service account (embedded above)
 */
export function getFirebaseAuth() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'd-personal-vault';

    if (serviceAccountJson) {
      // Option 1: Full JSON string from env var
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        initializeApp({ credential: cert(serviceAccount) });
        console.log('Firebase Admin SDK initialized with FIREBASE_SERVICE_ACCOUNT env var.');
      } catch (err) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', err.message);
        initializeWithFallback();
      }
    } else if (privateKey && clientEmail) {
      // Option 2: Individual env vars
      try {
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
        initializeApp({
          credential: cert({ projectId, clientEmail, privateKey: formattedPrivateKey })
        });
        console.log('Firebase Admin SDK initialized with individual env vars.');
      } catch (err) {
        console.error('Error initializing with individual env vars:', err.message);
        initializeWithFallback();
      }
    } else {
      // Option 3: Use hardcoded fallback
      initializeWithFallback();
    }
  }
  return getAuth();
}

function initializeWithFallback() {
  try {
    initializeApp({ credential: cert(FALLBACK_SERVICE_ACCOUNT) });
    console.log('Firebase Admin SDK initialized with hardcoded fallback service account.');
  } catch (err) {
    console.error('FATAL: Firebase Admin SDK fallback initialization failed:', err.message);
    // Last resort: project-only init (will fail on auth operations)
    initializeApp({ projectId: 'd-personal-vault' });
  }
}
