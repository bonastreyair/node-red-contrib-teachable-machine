# Changelog
All notable changes to this project will be documented in this file.

## [1.1.2] - 2020-05-03
### Added
 - PayPal donation badge in `README` file

### Fixed
 - `className` key (when `Best prediction` option) fixed to `class` in the results
 - Refinements on `README` file
 - Alignment HTML icons in node configuration

## [1.1.1] - 2020-04-24
### Added
 - New configuration checkbox to pass through the input image in `msg.image` 

### Changed
 - `probability` key changed to `score` in the results
 - Updated example with new configuration parameter

### Fixed
 - Selecting `Best prediction` option made the `Name` disappear

## [1.1.0] - 2020-04-22
### Changed
 - Updated image on how to use Teachable Machine and configuration node on Step 3
 - Use standard image treatment for `README` instead of HTML
 - Upgraded to `@tensorflow/tfjs-node v1.4.0` to enable coexistantce with [tfjs-nodes](https://github.com/dceejay/tfjs-nodes) nodes - [#8](https://github.com/bonastreyair/node-red-contrib-teachable-machine/issues/8)

## [1.0.1] - 2020-04-15
### Changed
 - Updated information help node

## [1.0.0] - 2020-04-15
### Added
 - Total npm downloads badge
 - Online/Local options in configuration node (Local still not functional)
 - Internal common functions to set node status
 - New Filters configurations when `All predictions` Output mode is selected
 	- Threshold in % - (0 -> 100%)
 	- Max. results - (1 -> 5)
 - General code optimitzations
 - [Mentions](https://github.com/bonastreyair/node-red-contrib-teachable-machine#mentions) section in `README` file

### Changed
 - Icon updated to Tensorflow 2.0 new logo
 - Updated configuration node
 - Using all `README` badges from [Shields.io](https://shields.io/)
 - Outputs is always an array of results even if `Best prediction` is selected

## [0.1.3] - 2020-04-12
### Added
 - Use of badges in `README` file
 - New images for _Installation_ and _Node usage_ in `README`
 - `JavaScript` code has been standarized following [Standard JS](https://standardjs.com/index.html)

### Changed
 - Information on HTML node [#5](https://github.com/bonastreyair/node-red-contrib-teachable-machine/issues/5)

### Fixed
 - Typos on `README`
 - `basic` example with issues to load
 - Errors not shown on console or in `Node-RED`

## [0.1.2] - 2020-04-12
### Added
 - Improvements on `README` file

### Fixed
 - Loading model error `response.arrayBuffer is not a function` [#3](https://github.com/bonastreyair/node-red-contrib-teachable-machine/issues/3)

## [0.1.1] - 2020-04-11
### Added
 - Comments in the code

### Changed
 - Downgraded `@tensorflow/tfjs-node` from version `v1.4.0` to `v1.3.1` for better compatibility
 - Output has changed from `checkbox` to a `list`, you can now select `Best predictions` or `All predictions`
 - Code cleaning

### Fixed
 - WebGL loading error in JSDOM
 - When installing the node -> `npm WARN @teachablemachine/image@0.8.4 requires a peer of @tensorflow/tfjs@1.3.1 but none is installed`

## [0.1.1] - 2020-04-11
### Added
 - Comments in the code

### Changed
 - Downgraded `@tensorflow/tfjs-node` from version `v1.4.0` to `v1.3.1` for better compatibility
 - Output has changed from `checkbox` to a `list`, you can now select `Best predictions` or `All predictions`
 - Code cleaning

### Fixed
 - WebGL loading error in JSDOM
 - When installing the node -> `npm WARN @teachablemachine/image@0.8.4 requires a peer of @tensorflow/tfjs@1.3.1 but none is installed`

## [0.1.0] - 2020-04-11
### Added
 - Functional using Teachable Machine Online Model URL
 - Option to select Top-1 or all results
 - CHANGELOG.md file
 - README.md file

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), 
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
