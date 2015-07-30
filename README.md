## Node garmin live tracking

Node module for getting to live tracking data from Garmin devices.

## Before using it?

- google two step auth
- setting up a label just for lolz

## Limitations
Garmin livetracker makes 1 reading every 4 seconds.

#### Setting up the hardware

#### Setting up with gmail

## Garmin Session service example

http://livetrack.garmin.com/services/session/1debb03f-2acd-48b0-a8c9-2ba613bfcb3c/token/5B72E4867D3AE6EB4B3D11F612044D8?requestTime=1436824940406

requestTime

```json
{
    "sessionId": "1debb03f-2acd-48b0-a8c9-2ba613bfcb3c",
    "token": "5B72E4867D3AE6EB4B3D11F612044D8",
    "userName": "RenÄrs Vilnis",
    "sessionName": "Live Activity 14/07/2015",
    "startTime": 1436821474000,
    "endTime": 1436907874000,
    "viewEndTime": null,
    "startLatitude": 0,
    "startLongitude": 0,
    "cancelled": false,
    "endsAtActivityEnd": true,
    "activityIds": [],
    "sessionStatus": "InProgress"
}
```

Session status types:
- "InProgress"
- "Expired"

## Garmin Workout Log example

http://livetrack.garmin.com/services/trackLog/1debb03f-2acd-48b0-a8c9-2ba613bfcb3c/token/5B72E4867D3AE6EB4B3D11F612044D8?requestTime=1436825001695&from=1436824890000

Url parameters:
- requestTime
- from

List of events:
- <NONE> - when livetracked workout in session
- PAUSE - when workout paused on Garmin device
- END - when livetrack session ended

```json
[
    {
        "latitude": 56.98910524137318,
        "longitude": 24.302630703896284,
        "timestamp": 1436824894000,
            "metaData": {
            "TOTAL_DISTANCE": "2.869999885559082",
            "ELEVATION": "18.2",
            "DISTANCE": "2.869999885559082",
            "ELEVATION_SOURCE": "GPS",
            "ACTIVITY_ID": "1436821485000",
            "TOTAL_DURATION": "3409000.0",
            "SPEED": "0.0",
            "DURATION": "3409000.0",
            "ACTIVITY_TYPE": "CYCLING"
        },
        "events": []
    },
    {
        "latitude": 56.98910524137318,
        "longitude": 24.302630703896284,
        "timestamp": 1436824898000,
        "metaData": {
            "TOTAL_DISTANCE": "2.869999885559082",
            "ELEVATION": "18.2",
            "DISTANCE": "2.869999885559082",
            "ELEVATION_SOURCE": "GPS",
            "ACTIVITY_ID": "1436821485000",
            "TOTAL_DURATION": "3413000.0",
            "SPEED": "0.0",
            "DURATION": "3413000.0",
            "ACTIVITY_TYPE": "CYCLING"
        },
        "events": []
    },
    ...
]
```

## Requirements
- node.js - v0.8.0 or newer
- IMAP server to connect to - tested with gmail

## Installation
```bash
npm install --save garmin-livetrack
```

## API

## TODO

- add [promises](https://github.com/then/promise)?