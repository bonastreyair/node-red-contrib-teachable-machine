# Changelog
## [0.1.2] - 2020-04-12
### Added
 * Improvements on `README` file

### Fixed
 * Loading model error `response.arrayBuffer is not a function` found in issue [#3](https://github.com/bonastreyair/node-red-contrib-teachable-machine/issues/3)

## [0.1.1] - 2020-04-11
### Added
 * Comments in the code

### Changed
 * Downgraded `@tensorflow/tfjs-node` from version `v1.4.0` to `v1.3.1` for better compatibility
 * Output has changed from `checkbox` to a `list`, you can now select `Best predictions` or `All predictions`
 * Code cleaning

### Fixed
 * WebGL loading error in JSDOM
 * When installing the node -> `npm WARN @teachablemachine/image@0.8.4 requires a peer of @tensorflow/tfjs@1.3.1 but none is installed`


## [0.1.0] - 2020-04-11
### Added
 * Functional using Teachable Machine Online Model URL
 * Option to select Top-1 or all results
 * CHANGELOG.md file
 * README.md file


All notable changes to this project will be documented in this file.
Maintained by [@bonastreyair](https://github.com/bonastreyair)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)