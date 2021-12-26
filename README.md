# Webpack userscripts
Krunker cheats with shared libraries, built with Webpack.

To use the userscripts, you will need [Tampermonkey](https://www.tampermonkey.net/) installed.

## Where are the userscripts?

Pre-built userscripts are found [here](https://y9x.github.io/userscripts/).

## Building

To build the userscripts, you will need [NodeJS](https://nodejs.org/en/download/).

Quickstart:

```sh
git clone https://github.com/y9x/webpack.git

cd webpack

npm install

npm run build
```

Build output is in the `dist/` folder

## NPM Commands

| ------- | ----------- |
| Command | Description |
| `npm run build` | Builds the targets Sploit,Junker,Loader then outputs in the `dist/` folder. |
| `npm run live-build` | Similar to `npm run build`; This will automatially build when a file in the repository changes. |