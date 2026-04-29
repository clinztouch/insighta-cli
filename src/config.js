const os = require('os');
const path = require('path');
const fs = require('fs');


const CREDENTIALS_PATH = path.join(os.homedir(), '.insighta', 'credentials.json');
const API_BASE_URL = process.env.INSIGHTA_API_URL || 'https://insighta-api-production-74ec.up.railway.app';

function getCredentials() {
    try{
        if (!fs.existsSync(CREDENTIALS_PATH )) return null;
        const data = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}


function saveCredentials(data) {
    const dir = path.dirname(CREDENTIALS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(data, null, 2));
}


function clearCredentials() {
    if (fs.existsSync(CREDENTIALS_PATH)) fs.unlinkSync(CREDENTIALS_PATH);
}


module.exports = { CREDENTIALS_PATH, API_BASE_URL, getCredentials, saveCredentials, clearCredentials };