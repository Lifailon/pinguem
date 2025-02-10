## Pinguem

Web interface for `icmp` checking the availability of selected host or subnet.

All indicated hosts are preserved on the side of the client (in the browser) after rebooting the server and the system. For a survey of the entire subnet, the optimal speed in my system is 4 seconds (so that the queries did not ahead of the scanning rate), for this, use 0 in the fourth octet (for example, `192.168.3.0`). To check hosts every second without delay, it is optimal to use up to 50 hosts.

### Install

Clone the repository and install the dependencies:

```shell
git clone https://github.com/Lifailon/ping.vue
cd ping.vue
npm install
```

Start backend (port `3005`) and frontend (port `8085`):

```shell
npm start
```

Go to: `http://localhost:8085`

![example](/image/example.jpg)
