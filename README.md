# node-red-contrib-teachable-machine
[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
[![GitHub version](https://badge.fury.io/gh/bonastreyair%2Fnode-red-contrib-teachable-machine.svg)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/blob/master/CHANGELOG.md)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![GitHub license](https://img.shields.io/github/license/bonastreyair/node-red-contrib-teachable-machine)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/blob/master/LICENSE)

A [Node-RED](https://nodered.org) node based in [tensorflow.js](https://www.tensorflow.org/js) that enables to run custom trained models using [Teachable Machine](https://teachablemachine.withgoogle.com/train/image) tool.

## Install
You have two options to install the node.
 * Use `Manage palette` option in `Node-RED` Menu
![manage_pallete](https://user-images.githubusercontent.com/37800834/79070482-740bd700-7cd6-11ea-93d3-646c0bf418d1.png)

 * Run the following command in your Node-RED user directory - typically `~/.node-red`
 ```
 npm install node-contrib-teachable-machine
 ```
**Note:** You need to restart `Node-RED` after installation. If installation goes wrong please open an [new issue](https://github.com/bonastreyair/node-red-contrib-teachable-machine/issues).

## Node usage
### Step 1
Go to [Teachable Machine](https://teachablemachine.withgoogle.com/train/image) and follow the steps to train your custom classification model.
![teachable_machine](https://user-images.githubusercontent.com/37800834/79070802-4c1d7300-7cd8-11ea-9c12-03e1d7d8b01d.png)

### Step 2 
Once trained the model, click on the `Export Model` button and select `Tensorflow.js` format. Then upload your trained model for free and copy the generated URL. 
![upload_teachable](https://user-images.githubusercontent.com/37800834/79056723-8431a100-7c59-11ea-9488-346f4f8e6004.png)

### Step 3
Paste the saved URL into the node configuration. That URL hosts all the information to load your trained model. Make sure you copy all the URL including the `https://`.
![model_URL](https://user-images.githubusercontent.com/37800834/79056644-ec33b780-7c58-11ea-9b69-8e8d4fbfda0c.png)

### Step 4 
In `Node-RED` send a buffered image to the node. Check the example in the `Import` section.

## Requirements
* `Node-RED v1.0.0+`
* Supported OS: MacOSX Catalina, Windows 10, Ubuntu 18.04

**Note:** This not is not working using official `docker nodered/node-red` [image](https://hub.docker.com/r/nodered/node-red/) since it is based on Alpine and it has an incompatibility found in this [issue](https://github.com/tensorflow/tfjs/issues/1425).

Inspired by [@dceejay](https://github.com/dceejay) with [node-red-contrib-tfjs-coco-ssd](https://github.com/dceejay/tfjs-coco-ssd/).