# Annual Strava activities - Maptober Week 2

Custom vector tile set displaying all Strava activities

## Setup

1. Visit https://www.strava.com/settings/api

    1. Application Name: Maptober, 
    2. Category: Visualizer
    3. Website: example.org
    4. Authorisation Callback Domain: localhost

2. Upload icon
3. Copy Client ID and Client Secret into `.example.env` 
4. Rename `.example.env` to `.env`

5. `yarn install`

## Download activities

Each activity will download into the `/activities` directory as an individual file named `[activityID].json`. The file will be in GeoJSON format. If an activity does not contain Lat/Lng coordinates, the corresponding `[activityID].json` file will be empty.

`./node_modules/.bin/tsc index.ts && node index.js activities`

**Rate Limit:** Strava API rate limit is 100 requests/hr. The script will terminate and a `Rate Limit Exceeded` message will appear. Wait 1hr and run the script again. Only activities not already in the `/activities` folder will be downloaded.

## Combine activities into one GeoJSON

Pass the name of the activities directory as an argument to `combine.js` along with activity type `Run` and the desired output file `run.js`. This script will also add a line from Bothell to the start of each activity.

`./node_modules/.bin/tsc combine.ts && node combine.js activities Run run.json`

## Upload to Mapbox Tiling Service (MTS)

`pip3 install mapbox-tilesets`

export MAPBOX_

Confirm that combined.json is valid line-delimited GeoJSON `tilesets validate-source ted-activites/combined.json` (Always fails even if it's valid)

Upload source: 

```
> tilesets upload-source tppiotrowski strava-ted ted-activities/combined.json
{"id": "mapbox://tileset-source/tppiotrowski/strava-ted", "files": 1, "source_size": 20388500, "file_size": 20388500}
```

Create tilset: 

```
> tilesets create tppiotrowski.maptober-strava-ted --recipe recipe.json --name "Maptober Strava Ted"
{"message": "Successfully created empty tileset tppiotrowski.maptober-strava-ted. Publish your tileset to begin processing your data into vector tiles."}
```

Publish tileset:

```
> tilesets publish tppiotrowski.maptober-strava-ted
{"message": "Processing tppiotrowski.maptober-strava-ted", "jobId": "ckvicx19p000509mgck530rfq"}
```

Update recipe:

```
> tilesets update-recipe tppiotrowski.maptober-strava-ted recipe.json 
Updated recipe.
```

Publish recipe:

```
> tilesets publish tppiotrowski.maptober-strava-ted
{"message": "Processing tppiotrowski.maptober-strava-ted", "jobId": "ckvidq02x001809l527pk290k"}
✔ Tileset job received. Visit https://studio.mapbox.com/tilesets/tppiotrowski.maptober-strava-ted or run tilesets job tppiotrowski.maptober-strava-ted ckvidq02x001809l527pk290k to view the status of your tileset.
```


## Problems

Problem: Strava limited to 100 API requests/hr. 
Solved: Downloaded activities over several hours.

Problem: Some Strava activities like gym workouts, rock climbing, manual entries will not have LatLng coordinates. 
Solved: Ignored these activities.

Problem: Mapbox only allows primitive values in tile delimited JSON, while Strava uses arrays and objects. For example `{ start_lat_lng: [12, -122.2]}`. 
Solved: Put everything in one FeatureCollection and MTS automatically converted to valid tile delimited JSON.