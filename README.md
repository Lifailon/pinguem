## ping.vue

Web interface for checking the availability of selected addresses or subnet.

All specified hosts are saved on the client side even after a system reboot. For subnet ping, the optimal polling rate in my system is 4 seconds (so that requests do not outpace the scanning speed). To check hosts every second without delay, it is possible to use 20-30 hosts.

### Install

- Clone the repository:

```shell
git clone https://github.com/Lifailon/ping.vue
cd ping.vue
```

- Install dependencies:

```shell
npm install
```

- Start backend (port `3000`) and frontend:

```shell
npm start
```

- Go to: `http://localhost:8080`

![example](/image/example.jpg)
