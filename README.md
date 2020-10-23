# node-red-contrib-teachable-machine

[![Platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/bonastreyair/node-red-contrib-teachable-machine)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/blob/master/CHANGELOG.md)
[![npm total downloads](https://img.shields.io/npm/dt/node-red-contrib-teachable-machine)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/archive/master.zip)
<br>[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![GitHub license](https://img.shields.io/github/license/dceejay/tfjs-nodes)](https://github.com/dceejay/tfjs-nodes/blob/master/LICENSE)
[![donate PayPal](https://img.shields.io/badge/donate-PayPal-blue)](https://www.paypal.me/bonastreyair)

A [Node-RED](https://nodered.org) node based in [tensorflow.js](https://www.tensorflow.org/js) that enables to run custom image classification trained models using [Teachable Machine](https://teachablemachine.withgoogle.com/train/image) tool.

<p align="center">
	<img src="https://user-images.githubusercontent.com/37800834/79343223-736d7d80-7f2e-11ea-9c85-b83fc73b0952.png" height="80">
</p>

## Install

You have two options to install the node.

- Use `Manage palette` option in `Node-RED` Menu (recommended)
  ![manage_pallete](https://user-images.githubusercontent.com/37800834/80922178-88923b00-8d7b-11ea-9fcf-ea1839bfee09.png)

- Run the following command in your `Node-RED` user directory - typically `~/.node-red`

  ``` bash
  npm install node-red-contrib-teachable-machine
  ```

**Note:** If you run the command you will need to restart `Node-RED` after installation. If installation goes wrong please open a [new issue](https://github.com/bonastreyair/node-red-contrib-teachable-machine/issues).

## Node usage

### Step 1

Go to [Teachable Machine](https://teachablemachine.withgoogle.com/train/image) and follow the steps to train your custom classification model. Once trained click on the `Export Model` button.

![teachable_machine_export](https://user-images.githubusercontent.com/37800834/80190158-18b1e100-8614-11ea-9ccf-6668e49e7e2d.png)

### Step 2

Select `Tensorflow.js` format and upload your trained model (for free). Once it is uploaded, copy the generated URL.

![use_teachable_machine](https://user-images.githubusercontent.com/37800834/79056723-8431a100-7c59-11ea-9488-346f4f8e6004.png)

### Step 3

Paste the saved URL into the node configuration. That URL hosts all the information to load your trained model. Make sure you copy all the given URL including the `https://...`.

![config](https://user-images.githubusercontent.com/37800834/80922980-e8d7ab80-8d80-11ea-8c0c-89d1008455da.png)

### Step 4

In `Node-RED` send a buffered image to the node. Check the example in the `Import` section.

## Requirements

- `Node-RED v1.0.0+`

*Note:* MacOSX Catalina, Windows 10 and Ubuntu 18.04 are supported as well as using official `docker nodered/node-red` [image](https://hub.docker.com/r/nodered/node-red/) based on [Alpine](https://hub.docker.com/_/alpine) image. Works with Raspberry Pi too since release [`v1.2.0+`](https://github.com/bonastreyair/node-red-contrib-teachable-machine/releases/tag/)

## Mentions

- [@dceejay](https://github.com/dceejay): who inspired me thanks to node [node-red-contrib-tfjs-coco-ssd](https://github.com/dceejay/tfjs-coco-ssd/)
