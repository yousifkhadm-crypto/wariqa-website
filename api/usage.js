const crypto = require('crypto');

const usageStore = globalThis.__wariqaUsageStore || new Map();
globalThis.__wariqaUsageStore = usageStore;

const DAILY_LIMITS = {
  free: 30,
  premium: 200
};

function parseCookies(request) {
  return String(request.headers?.cookie || '').split(';').reduce((cookies, item) => {
    const separator = item.indexOf('=');
    if (separator === -1) return cookies;
    const name = item.slice(0, separator).trim();
    const value = decodeURIComponent(item.slice(separator + 1).trim());
    cookies[name] = value;
    return cookies;
  }, {});
}

function getDailyKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClientIdentity(request, response) {
  const cookies = parseCookies(request);
  let anonymousId = cookies.wariqa_anon_id;

  if (!/^[a-f0-9-]{20,80}$/i.test(anonymousId || '')) {
    anonymousId = crypto.randomUUID();
    const secure = request.headers?.['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    const cookie = `wariqa_anon_id=${encodeURIComponent(anonymousId)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`;
    if (typeof response.setHeader === 'function') response.setHeader('Set-Cookie', cookie);
  }

  const forwardedFor = request.headers?.['x-forwarded-for'];
  const address = String(forwardedFor || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  return crypto.createHash('sha256').update(`${anonymousId}:${address}`).digest('hex').slice(0, 40);
}

function resolvePlan() {
  // Authentication and Premium status do not exist in this project yet.
  return 'free';
}

function getUserUsage(request, response) {
  const plan = resolvePlan(request);
  const limit = DAILY_LIMITS[plan];
  const key = `${getClientIdentity(request, response)}:${getDailyKey()}`;
  const usage = usageStore.get(key) || 0;

  return { key, plan, limit, usage };
}

function getDailyUsage(usage) {
  return usage.usage;
}

function isWithinDailyLimit(usage) {
  return getDailyUsage(usage) < usage.limit;
}

function incrementUserUsage(usage) {
  const nextUsage = getDailyUsage(usage) + 1;
  usageStore.set(usage.key, nextUsage);
  return nextUsage;
}

function decrementUserUsage(usage) {
  const nextUsage = Math.max(0, getDailyUsage(usage) - 1);
  if (nextUsage === 0) usageStore.delete(usage.key);
  else usageStore.set(usage.key, nextUsage);
  return nextUsage;
}

module.exports = {
  DAILY_LIMITS,
  getUserUsage,
  getDailyUsage,
  isWithinDailyLimit,
  incrementUserUsage,
  decrementUserUsage
};
