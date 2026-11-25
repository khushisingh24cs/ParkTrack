import axios from 'axios';

const getBaseUrl = () => process.env.AUTOMATA_URL || 'http://localhost:5001';

const client = axios.create({
  timeout: 4000,
});

export async function checkAutomataHealth() {
  const url = getBaseUrl();
  try {
    const res = await client.get(`${url}/health`);
    return { ok: res.data?.status === 'ok', url };
  } catch (err) {
    return { ok: false, url, error: err.message };
  }
}

export async function validateWithAutomata(vehicleNumber, violationCode) {
  const url = getBaseUrl();
  const res = await client.post(`${url}/validate`, {
    vehicleNumber: vehicleNumber ?? '',
    violationCode: violationCode ?? '',
  });
  return res.data;
}

export async function classifyWithAutomata(violationCode, description = '') {
  const url = getBaseUrl();
  const res = await client.post(`${url}/classify`, {
    violationCode: violationCode ?? '',
    description: description ?? '',
  });
  return res.data;
}

export async function compareWithAutomata(strings) {
  const url = getBaseUrl();
  const res = await client.post(`${url}/compare`, strings ? { strings } : {});
  return res.data;
}

