import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as prompt from 'prompt';
import { Strava, StreamKeys } from 'strava';
require('dotenv').config();

const DIR_NAME = process.argv[2] || 'activities';

const jan1st2021 = new Date("2021-01-01");

const main = async (strava: Strava) => {
	const files = fs.readdirSync(DIR_NAME).map(filename => parseInt(filename));
	console.log('Fetching athlete activities');
	const activities = await strava.activities.getLoggedInAthleteActivities({
		after: jan1st2021.getTime() / 1000,
		per_page: 200, // bump this up later
	});
	console.log(`Found ${activities.length} activities`);
	for (let activity of activities) {
		if (files.includes(activity.id)) {
			console.log(`${activity.id} already downloaded - skipping`)
			continue;
		}
		let str = "";
		try {
			console.log(`Fetching activity stream: ${activity.id} - ${activity.name}`)
			const stream = await strava.streams.getActivityStreams({ id: activity.id, keys: [StreamKeys.LatLng] });
			if (!stream.latlng) {
				console.log(`${activity.id} could not fetch latlng - skipping`);
				continue;
			}
			console.log(`Fetched ${stream.latlng.data.length} latlng points`);

			const output = {
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: [],
				},
				properties: {},
			}
			output.properties = activity;
			output.geometry.coordinates = stream.latlng.data.map(coords => [coords[1], coords[0]]);
			str = JSON.stringify(output);
		} catch (e) {
			console.log(`Error processing activity ${activity.id}`)
		}

		const outPath = path.join(DIR_NAME, `${activity.id}.json`);
		fs.writeFile(outPath, str, () => { console.log(`Created ${outPath}`) });
	}
}

const authorize = async () => {
	let refresh_token;
	if (!refresh_token) {
		console.log(`https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost&response_type=code&scope=activity:read_all`);
		prompt.start();
		const { code } = await prompt.get(['code']);
		refresh_token = await new Promise<string>((res, rej) => {
			exec(`curl -X POST https://www.strava.com/api/v3/oauth/token \
  			-d client_id=${process.env.CLIENT_ID} \
			-d client_secret=${process.env.CLIENT_SECRET} \
			-d code=${code} \
			-d grant_type=authorization_code`, (err, stdout) => {
				if (err) rej(err);
				res(JSON.parse(stdout.trim()).refresh_token);
			})
		});

		console.log(`Refresh token: ${refresh_token}`);
	}

	return new Strava({
		client_id: process.env.CLIENT_ID,
		client_secret: process.env.CLIENT_SECRET,
		refresh_token,
	});
}

	; (async () => {
		try {
			const strava = await authorize();
			await main(strava);
		} catch (e) {
			console.log('FAILURE', e);
		}
	})();