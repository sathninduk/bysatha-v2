// Password gate for /prep.
// The page is decrypted server-side only after HTTP Basic auth succeeds, so the
// HTML never reaches an unauthenticated client (or a crawler) in any form.

const crypto = require('crypto');
const zlib = require('zlib');
const BLOB = require('./_prep-data.js');

const REALM = 'prep';

function sameSecret(a, b) {
  // hash first so the comparison is constant-time regardless of length
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function noIndex(res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store, private, max-age=0');
}

function challenge(res) {
  noIndex(res);
  res.setHeader('WWW-Authenticate', 'Basic realm="' + REALM + '", charset="UTF-8"');
  res.status(401).send('401 Unauthorized');
}

module.exports = (req, res) => {
  const expected = process.env.PREP_PASSWORD;
  const keyHex = process.env.PREP_KEY;

  if (!expected || !keyHex) {
    noIndex(res);
    return res.status(500).send('Not configured');
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return challenge(res);

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const password = decoded.slice(decoded.indexOf(':') + 1); // username is ignored
  if (!password || !sameSecret(password, expected)) return challenge(res);

  let html;
  try {
    const blob = Buffer.from(BLOB, 'base64');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(keyHex, 'hex'),
      blob.subarray(0, 12)
    );
    decipher.setAuthTag(blob.subarray(12, 28));
    html = zlib.gunzipSync(
      Buffer.concat([decipher.update(blob.subarray(28)), decipher.final()])
    );
  } catch (err) {
    noIndex(res);
    return res.status(500).send('Could not decrypt payload');
  }

  noIndex(res);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
