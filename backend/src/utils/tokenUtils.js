const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DEFAULT_JWT_SECRET = 'change_me_to_a_long_random_string_at_least_32_characters_long';
const DEFAULT_REFRESH_TOKEN_SECRET = 'change_me_to_another_long_random_string_at_least_32_characters';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || DEFAULT_REFRESH_TOKEN_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    console.warn('⚠️ JWT_SECRET and/or REFRESH_TOKEN_SECRET not set. Using insecure defaults for local development.');
}

const generateJWT = (payload, expiresIn = JWT_EXPIRE) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

const verifyJWT = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
};

const generateTicketId = (eventId, userId) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `RU-${eventId}-${userId}-${timestamp}-${random}`.toUpperCase();
};

const generateCertificateId = () => {
    return `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    generateJWT,
    generateRefreshToken,
    verifyJWT,
    verifyRefreshToken,
    generateTicketId,
    generateCertificateId,
    hashToken,
    generateOTP
};
