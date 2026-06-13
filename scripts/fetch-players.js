const fs = require('fs');
const path = require('path');

const API_KEY = '0c176ac9ca814d87b0dcf7ac1ded591c';
const OUTPUT_PATH = path.join(__dirname, '../public/players.json');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        console.log('Rate limit hit (429). Waiting 15 seconds...');
        await wait(15000);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Error occurred: ${error.message}. Retrying in 5 seconds...`);
      await wait(5000);
    }
  }
}

async function fetchPlayers() {
  console.log('Starting World Cup players fetch...');
  const headers = { 'X-Auth-Token': API_KEY };

  try {
    // 1. Get the list of all teams in the World Cup
    console.log('Fetching World Cup teams...');
    const teamsData = await fetchWithRetry(
      'https://api.football-data.org/v4/competitions/WC/teams',
      { headers }
    );

    const teams = teamsData.teams || [];
    console.log(`Found ${teams.length} teams. Fetching squad details (with safety delays)...`);

    const playersMap = {};

    for (let index = 0; index < teams.length; index++) {
      const team = teams[index];
      const teamName = team.name;
      const teamId = team.id;

      console.log(`[${index + 1}/${teams.length}] Fetching squad for ${teamName}...`);

      try {
        const squadData = await fetchWithRetry(
          `https://api.football-data.org/v4/teams/${teamId}`,
          { headers }
        );

        const squad = squadData.squad || [];
        // Extract names of players
        playersMap[teamName] = squad.map(player => player.name).filter(Boolean);
        console.log(`   Added ${squad.length} players for ${teamName}.`);
      } catch (err) {
        console.error(`   Failed to fetch squad for ${teamName}:`, err.message);
        playersMap[teamName] = []; // Fallback
      }

      // Wait 6.5 seconds before the next call to avoid hitting the 10 requests/min rate limit
      if (index < teams.length - 1) {
        console.log('   Waiting 6.5 seconds to respect rate limit...');
        await wait(6500);
      }
    }

    // 2. Save the output
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(playersMap, null, 2));
    console.log(`\nSuccess! Squad lists saved to: ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('Fatal error running fetch-players:', error);
  }
}

fetchPlayers();
