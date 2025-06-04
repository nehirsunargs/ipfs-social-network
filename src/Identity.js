// identity.js
import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

/**
 * Load the key pair from localStorage or create a new one if none exists.
 * @returns {Promise<{publicKey: Uint8Array, secretKey: Uint8Array}>}
 */
export async function getOrCreateKeyPair() {
  const stored = localStorage.getItem('keypair');
  if (stored) {
    try {
      const obj = JSON.parse(stored);
      return {
        publicKey: decodeBase64(obj.publicKey),
        secretKey: decodeBase64(obj.secretKey),
      };
    } catch (e) {
      // If corrupt, clear and create new keys
      localStorage.removeItem('keypair');
    }
  }

  const keyPair = nacl.sign.keyPair();
  localStorage.setItem(
    'keypair',
    JSON.stringify({
      publicKey: encodeBase64(keyPair.publicKey),
      secretKey: encodeBase64(keyPair.secretKey),
    })
  );

  return keyPair;
}

/**
 * Sign a UTF-8 string message with the secret key.
 * @param {string} message - The message to sign.
 * @param {Uint8Array} secretKey - The secret key for signing.
 * @returns {Uint8Array} The signature bytes.
 */
export function signMessage(message, secretKey) {
  const messageBytes = decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return signature;
}

/**
 * Verify a signature for a message.
 * @param {string} message - The original message.
 * @param {Uint8Array} signature - The signature bytes.
 * @param {Uint8Array} publicKey - The public key to verify against.
 * @returns {boolean} True if signature is valid.
 */
export function verifySignature(message, signature, publicKey) {
  const messageBytes = decodeUTF8(message);
  return nacl.sign.detached.verify(messageBytes, signature, publicKey);
}

export { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 };
