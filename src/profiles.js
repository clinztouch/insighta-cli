const Table = require('cli-table3');
const fs = require('fs');
const path = require('path');
const { request } = require('./http');

function formatTable(profiles) {
  const table = new Table({
    head: ['Name', 'Gender', 'Age', 'Age Group', 'Country', 'Probability'],
    colWidths: [25, 10, 6, 12, 20, 12],
    style: { head: ['cyan'] },
  });

  profiles.forEach((p) => {
    table.push([
      p.name,
      p.gender,
      p.age,
      p.age_group,
      p.country_name,
      `${(p.country_probability * 100).toFixed(0)}%`,
    ]);
  });

  return table.toString();
}

async function listProfiles(options) {
  const params = {};
  if (options.gender) params.gender = options.gender;
  if (options.country) params.country_id = options.country;
  if (options.ageGroup) params.age_group = options.ageGroup;
  if (options.minAge) params.min_age = options.minAge;
  if (options.maxAge) params.max_age = options.maxAge;
  if (options.sortBy) params.sort_by = options.sortBy;
  if (options.order) params.order = options.order;
  if (options.page) params.page = options.page;
  if (options.limit) params.limit = options.limit;

  const data = await request('GET', '/api/profiles', { params });

  console.log(`\nShowing ${data.data.length} of ${data.total} profiles (page ${data.page}/${data.total_pages})\n`);
  console.log(formatTable(data.data));
  console.log(`\nNext: page ${data.page + 1} | Prev: page ${data.page - 1}`);
}

async function getProfile(id) {
  const data = await request('GET', `/api/profiles/${id}`);
  const p = data.data;

  const table = new Table({ style: { head: ['cyan'] } });
  table.push(
    { ID: p.id },
    { Name: p.name },
    { Gender: `${p.gender} (${(p.gender_probability * 100).toFixed(0)}%)` },
    { Age: `${p.age} (${p.age_group})` },
    { Country: `${p.country_name} (${(p.country_probability * 100).toFixed(0)}%)` },
    { 'Created At': new Date(p.created_at).toLocaleString() },
  );

  console.log('\n' + table.toString());
}

async function searchProfiles(query, options) {
  const params = { q: query };
  if (options.page) params.page = options.page;
  if (options.limit) params.limit = options.limit;

  const data = await request('GET', '/api/profiles/search', { params });

  if (data.status === 'error') {
    console.error(`Search error: ${data.message}`);
    return;
  }

  console.log(`\nFound ${data.total} profiles matching "${query}"\n`);
  console.log(formatTable(data.data));
}

async function createProfile(name) {
  const data = await request('POST', '/api/profiles', {
    data: { name },
    headers: { 'Content-Type': 'application/json' },
  });

  console.log('\n✅ Profile created successfully:\n');
  const p = data.data;
  const table = new Table({ style: { head: ['cyan'] } });
  table.push(
    { ID: p.id },
    { Name: p.name },
    { Gender: `${p.gender} (${(p.gender_probability * 100).toFixed(0)}%)` },
    { Age: `${p.age} (${p.age_group})` },
    { Country: `${p.country_name} (${(p.country_probability * 100).toFixed(0)}%)` },
  );
  console.log(table.toString());
}

async function exportProfiles(options) {
  const params = { format: 'csv' };
  if (options.gender) params.gender = options.gender;
  if (options.country) params.country_id = options.country;
  if (options.ageGroup) params.age_group = options.ageGroup;

  const { API_BASE_URL } = require('./config');
  const { getCredentials, saveCredentials, clearCredentials } = require('./config');
  const axios = require('axios');
  const credentials = getCredentials();

  try {
    const response = await axios.get(`${API_BASE_URL}/api/profiles/export`, {
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        'X-API-Version': '1',
      },
      params,
      responseType: 'text',
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `profiles_${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);

    fs.writeFileSync(filepath, response.data);
    console.log(`\n✅ Exported to: ${filepath}`);
  } catch (error) {
    console.error(`Export failed: ${error.response?.data?.message || error.message}`);
  }
}

module.exports = { listProfiles, getProfile, searchProfiles, createProfile, exportProfiles };