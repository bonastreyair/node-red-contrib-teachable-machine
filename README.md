# node-red-contrib-teachable-machine
[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/bonastreyair/node-red-contrib-teachable-machine)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/blob/master/CHANGELOG.md)
[![npm total downloads](https://img.shields.io/npm/dt/node-red-contrib-teachable-machine)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/archive/master.zip)
<br>[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![GitHub license](https://img.shields.io/github/license/dceejay/tfjs-nodes)](https://github.com/dceejay/tfjs-nodes/blob/master/LICENSE)


A [Node-RED](https://nodered.org) node based in [tensorflow.js](https://www.tensorflow.org/js) that enables to run custom trained models using [Teachable Machine](https://teachablemachine.withgoogle.com/train/image) tool.

<p align="center">
	<img src="https://user-images.githubusercontent.com/37800834/79343223-736d7d80-7f2e-11ea-9c85-b83fc73b0952.png" height="100">
</p>

## Install
You have two options to install the node.
 * Use `Manage palette` option in `Node-RED` Menu (recommended)
![manage_pallete](https://user-images.githubusercontent.com/37800834/79070482-740bd700-7cd6-11ea-93d3-646c0bf418d1.png)

 * Run the following command in your Node-RED user directory - typically `~/.node-red`
 ```
 npm install node-contrib-teachable-machine
 ```
**Note:** If you run the command you will need to restart `Node-RED` after installation. If installation goes wrong please open a [new issue](https://github.com/bonastreyair/node-red-contrib-teachable-machine/issues).

## Node usage
### Step 1
Go to [Teachable Machine](https://teachablemachine.withgoogle.com/train/image) and follow the steps to train your custom classification model. Once trained click on the `Export Model` button.

<img src="https://user-images.githubusercontent.com/37800834/79070802-4c1d7300-7cd8-11ea-9c12-03e1d7d8b01d.png" height="300">

### Step 2 
Select `Tensorflow.js` format and upload your trained model (for free). Once it is uploaded, copy the generated URL.

<img src="https://user-images.githubusercontent.com/37800834/79056723-8431a100-7c59-11ea-9488-346f4f8e6004.png" height="250">

### Step 3
Paste the saved URL into the node configuration. That URL hosts all the information to load your trained model. Make sure you copy all the given URL including the `https://...`.

<img src="https://user-images.githubusercontent.com/37800834/79343720-10c8b180-7f2f-11ea-90c6-7e70ef7034b1.png" height="250">

### Step 4 
In `Node-RED` send a buffered image to the node. Check the example in the `Import` section.

## Requirements
* `Node-RED v1.0.0+`
* Supported OS: MacOSX Catalina, Windows 10, Ubuntu 18.04

**Note:** Using official `docker nodered/node-red` [image](https://hub.docker.com/r/nodered/node-red/) does not work since it is based on Alpine as it has an incompatibility found in this [issue](https://github.com/tensorflow/tfjs/issues/1425).

## Mentions
 * [@dceejay](https://github.com/dceejay): who inspired me thanks to node [node-red-contrib-tfjs-coco-ssd](https://github.com/dceejay/tfjs-coco-ssd/)