<h2 align="center">
    Pinguem
</h2>

<p align="center">
        <a href="https://www.npmjs.com/package/pinguem"><img title="npm version"src="https://img.shields.io/npm/v/pinguem?logo=npm&logoColor=red"></a>
        <a href="https://hub.docker.com/r/lifailon/pinguem"><img title="docker image size"src="https://img.shields.io/docker/image-size/lifailon/pinguem?&color=blue&logo=Docker&label=Docker+Image"></a>
</p>

Web interface on based [Vue](https://github.com/vuejs/core) for async checking of the availability of the selected host or subnet using the [node-ping](https://github.com/danielzzz/node-ping) library.

All indicated hosts are preserved on the side of the client (in the browser) after rebooting the server and the system. For a survey of the entire subnet, the optimal speed in my system is 4 seconds (so that the queries did not ahead of the scanning rate), for this, use 0 in the 4 octet (for example, `192.168.3.0`). To check hosts every second without delay, it is optimal to use up to 50 hosts.

## Install

### Docker

Download the image from [Docker Hub](https://hub.docker.com/r/lifailon/pinguem) and run the container:

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

![example](/image/example.jpg)

You can get checking results at the current time using `GET` request via `API`:

`curl -sS http://localhost:3005/result | jq .`

```json
{
  "192.168.3.101": {
    "host": "192.168.3.101",
    "time": 1,
    "status": "Available",
    "lastAvailable": "2025-02-10T10:27:11.038Z",
    "lastUnavailable": null,
    "successful": 203,
    "failed": 0
  },
  "8.8.8.8": {
    "host": "8.8.8.8",
    "time": 33,
    "status": "Available",
    "lastAvailable": "2025-02-10T10:27:11.032Z",
    "lastUnavailable": null,
    "successful": 203,
    "failed": 0
  },
  "google.com": {
    "host": "google.com",
    "time": 40,
    "status": "Available",
    "lastAvailable": "2025-02-10T10:27:11.029Z",
    "lastUnavailable": "2025-02-10T10:26:16.552Z",
    "successful": 201,
    "failed": 2
  },
  "github.com": {
    "host": "github.com",
    "time": 68,
    "status": "Available",
    "lastAvailable": "2025-02-10T10:27:11.027Z",
    "lastUnavailable": "2025-02-10T10:26:37.819Z",
    "successful": 200,
    "failed": 3
  },
  "192.168.3.99": {
    "host": "192.168.3.99",
    "time": "unknown",
    "status": "Unavailable",
    "lastAvailable": null,
    "lastUnavailable": "2025-02-10T10:27:11.035Z",
    "successful": 0,
    "failed": 203
  }
}
```