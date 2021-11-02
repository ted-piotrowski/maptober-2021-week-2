import * as fs from 'fs';
import * as path from 'path';

const directory = process.argv[2] || 'activities';
const outFile = 'combined.json';
const outPath = path.join(directory, outFile)

const output = {
	type: "FeatureCollection",
	features: [],
}
fs.readdirSync(directory).forEach(file => {
	if (file === outFile) {
		return;
	}
	console.log(`Processing ${file}`)
	const data = fs.readFileSync(path.join(directory, file), 'utf-8');
	try {
		const json = JSON.parse(data);
		json.geometry.coordinates.unshift([-122.2408199, 47.7734527]);
		output.features.push(json);
		console.log(`Added ${file} to FeaturesCollection`);
	} catch (e) {
		console.log('Failure', e);
	}
});

fs.writeFileSync(outPath, JSON.stringify(output));
