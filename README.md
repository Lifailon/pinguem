<h2 align="center">
    Pinguem
</h2>

<p align="center">
        <a href="https://www.npmjs.com/package/pinguem"><img title="npm version"src="https://img.shields.io/npm/v/pinguem?logo=npm&logoColor=red"></a>
        <a href="https://hub.docker.com/r/lifailon/pinguem"><img title="docker image size"src="https://img.shields.io/docker/image-size/lifailon/pinguem?&color=blue&logo=Docker&label=Docker+Image"></a>
</p>

Web interface based on [Vue](https://github.com/vuejs/core) for async checking of the availability of the selected hosts or subnet using the [node-ping](https://github.com/danielzzz/node-ping) library.

All fields for entering addresses are dynamic, and are stored on the side of the client (in the browser) after rebooting the server and the user system. For a survey of the entire subnet, use 0 in the 4 octet (example, `192.168.3.0`), it is possible to simultaneously indicate a few subnet. It is recommended to launch in the Docker container, you can check 254, 508 and more hosts every second without delay. 

## Install

### Docker

Download the image from [Docker Hub](https://hub.docker.com/r/lifailon/pinguem) and run the container:

<!--
docker build -t lifailon/pinguem .
-->

```shell
docker run -d --name pinguem -p 8085:8085 -p 3005:3005 --restart=unless-stopped lifailon/pinguem:latest
```

### Build

Clone the repository and install the dependencies:

```shell
git clone https://github.com/Lifailon/pinguem
cd pinguem
npm install
```

Start backend (port `3005`) and frontend (port `8085`):

```shell
npm start
```

Go to: `http://localhost:8085`

![example](/image/light.jpg)

Dark mode:

![example](/image/dark.jpg)

You can get checking results at the current time using `GET` request via `API`:

`curl -sS http://localhost:3005/result | jq .`

```json
{
  "192.168.3.101": {
    "host": "192.168.3.101",
    "time": 1,
    "status": "Available",
    "lastAvailable": "2025-02-10T21:33:35.530Z",
    "lastUnavailable": null,
    "successful": 100,
    "failed": 0
  },
  "google.com": {
    "host": "google.com",
    "time": 22,
    "status": "Available",
    "lastAvailable": "2025-02-10T21:33:35.524Z",
    "lastUnavailable": "2025-02-10T21:32:19.236Z",
    "successful": 90,
    "failed": 10
  },
  "8.8.8.8": {
    "host": "8.8.8.8",
    "time": 21,
    "status": "Available",
    "lastAvailable": "2025-02-10T21:33:35.527Z",
    "lastUnavailable": null,
    "successful": 100,
    "failed": 0
  },
  "github.com": {
    "host": "github.com",
    "time": 47,
    "status": "Available",
    "lastAvailable": "2025-02-10T21:33:35.521Z",
    "lastUnavailable": "2025-02-10T21:33:32.535Z",
    "successful": 97,
    "failed": 3
  },
  "192.168.3.102": {
    "host": "192.168.3.102",
    "time": "unknown",
    "status": "Unavailable",
    "lastAvailable": null,
    "lastUnavailable": "2025-02-10T21:33:35.534Z",
    "successful": 0,
    "failed": 100
  }
}
```