# THIS PROJECT HAS BEEN DEPRECATED, ALL NEW DEVELOPMENT [GOES HERE](https://github.com/RobCoIndustries/pipboy).

# pipboyclient
Fallout 4 PipBoy UI using [pipboyrelay](https://github.com/rgbkrk/pipboyrelay) (with [this patch](https://github.com/rgbkrk/pipboyrelay/pull/5)), [socket.io](http://socket.io/) and [Aurelia](https://aurelia.io)

# What works

- [x] World map
- [x] Local map
- [x] Radio selection
- [x] Basic stats
- [x] Send custom commands (and probably crash the game)

# What doesn't

- [ ] Everything else

# Running the app

1. Setup and run the standalone pipboyrelay client - `node standalone.js`
2. `npm install -g http-server`
3. Run `http-server -o` in pipboyclient's root
4. Browse to [http://localhost:8080](http://localhost:8080)

![](http://i.imgur.com/oKNOt6h.png)
