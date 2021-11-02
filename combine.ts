import * as fs from 'fs';
import * as path from 'path';
import { exit } from 'process';

const directory = process.argv[2] || 'activities';
const activityType = process.argv[3];
const outFile = process.argv[4];

if (process.argv.length !== 5) {
	console.log('Incorrect arguments given');
	console.log('outputDirectory activityType outFile');
	exit();
}
const outPath = path.join(directory, outFile)

const output = {
	type: "FeatureCollection",
	features: [],
}
fs.readdirSync(directory).forEach(file => {
	if (!/\d+\.json/.test(file)) {
		return;
	}
	console.log(`Processing ${file}`)
	const data = fs.readFileSync(path.join(directory, file), 'utf-8');
	if (data === "") {
		return;
	}
	try {
		const json = JSON.parse(data);
		if (json.properties.type !== activityType) {
			return;
		}
		json.geometry.coordinates.unshift([-122.2408199, 47.7734527]);
		output.features.push(json);
		console.log(`Added ${file} to FeaturesCollection`);
	} catch (e) {
		console.log('Failure', e);
	}
});

fs.writeFileSync(outPath, JSON.stringify(output));
