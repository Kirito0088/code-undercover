const https = require('https');

const API_KEY = process.env.RENDER_API_KEY;
if (!API_KEY) {
  console.error("RENDER_API_KEY is required. Set it in your environment (see .env.example).");
  process.exit(1);
}

function request(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json', ...headers } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Render services...');
  try {
    const services = await request('https://api.render.com/v1/services');
    if (!services || services.length === 0) {
      console.log('No services found.');
      return;
    }
    
    for (const item of services) {
      const s = item.service;
      console.log(`\nService: \x1b[36m${s.name}\x1b[0m (${s.id})`);
      console.log(`URL: ${s.serviceDetails.url}`);
      console.log(`Runtime: ${s.serviceDetails.runtime}`);
      
      console.log('Fetching latest deploys...');
      const deploys = await request(`https://api.render.com/v1/services/${s.id}/deploys`);
      if (deploys && deploys.length > 0) {
        const latest = deploys[0].deploy;
        console.log(`Latest Deploy Status: ${getStatusColor(latest.status)}${latest.status}\x1b[0m`);
        console.log(`Commit: ${latest.commit.message} (${latest.commit.id.slice(0, 7)})`);
        console.log(`Trigger: ${latest.trigger}`);
        console.log(`Started At: ${latest.startedAt}`);
      } else {
        console.log('No deploys found.');
      }
    }
  } catch (error) {
    console.error('Error querying Render:', error.message);
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'live': return '\x1b[32m'; // green
    case 'build_in_progress': return '\x1b[33m'; // yellow
    case 'build_failed': return '\x1b[31m'; // red
    default: return '\x1b[37m'; // white
  }
}

main();
