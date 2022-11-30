# node-red-contrib-teachable-machine

[![Node-RED node](https://img.shields.io/badge/Node--RED-node-red?logo=node-red)](https://nodered.org)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/bonastreyair/node-red-contrib-teachable-machine/main.svg)](https://results.pre-commit.ci/latest/github/bonastreyair/node-red-contrib-teachable-machine/main)
[![CI](https://img.shields.io/github/workflow/status/bonastreyair/node-red-contrib-teachable-machine/CI?label=test&logo=github)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/actions?workflow=CI)
[![npm latest release](https://img.shields.io/npm/v/node-red-contrib-teachable-machine?logo=npm)](https://www.npmjs.com/package/node-red-contrib-teachable-machine)
[![npm total downloads](https://img.shields.io/npm/dt/node-red-contrib-teachable-machine)](https://www.npmjs.com/package/node-red-contrib-teachable-machine)
[![Package Quality](https://packagequality.com/shield/node-red-contrib-teachable-machine.svg)](https://packagequality.com/#?package=node-red-contrib-teachable-machine)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?color=yellow&logo=JavaScript&logoColor=white)](https://standardjs.com)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/bonastreyair/node-red-contrib-teachable-machine?logo=codeclimate)](https://codeclimate.com/github/bonastreyair/node-red-contrib-teachable-machine/maintainability)
[![GitHub license](https://img.shields.io/github/license/bonastreyair/node-red-contrib-teachable-machine?color=blue)](https://github.com/bonastreyair/node-red-contrib-teachable-machine/blob/master/LICENSE)
[![donate PayPal](https://img.shields.io/badge/donate-PayPal-blue)](https://www.paypal.me/bonastreyair)

A [Node-RED](https://nodered.org) node based in [tensorflow.js](https://www.tensorflow.org/js) that enables to run custom image classification trained models using [Teachable Machine](https://teachablemachine.withgoogle.com/train/image) tool. All notable changes to this project will be documented in the [CHANGELOG.md](https://github.com/bonastreyair/node-red-contrib-teachable-machine/blob/main/CHANGELOG.md) file.

<p align="center">
  <img src="https://user-images.githubusercontent.com/37800834/79343223-736d7d80-7f2e-11ea-9c85-b83fc73b0952.png" height="70">
</p>

## Install

You have two options to install the node.

- Use `Manage palette` option in `Node-RED` Menu (recommended)
  ![manage_pallete](https://user-images.githubusercontent.com/37800834/80922178-88923b00-8d7b-11ea-9fcf-ea1839bfee09.png)

- Run the following command in your `Node-RED` user directory - typically `~/.node-red`

  ```bash
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

Once the URL is generated it will show the stored files.

![model_files](https://user-images.githubusercontent.com/37800834/204745026-40cf7cec-6775-4e78-a454-4c82271d613f.png)

### Step 3

#### **Online Mode**

Select Online Mode and paste the saved URL in the node configuration. That URL hosts all the information to load your trained model. Make sure you copy all the given URL including the `https://...` and the `/` in the end.

![online-config](https://user-images.githubusercontent.com/37800834/204746402-2551eb8c-576c-40fa-a250-7f0f93a9d670.png)

#### **Local Mode**

Download all three files from the generated URL and save them locally in a folder maintaning the original filenames.

Select Local Mode and write down the absolute path of the folder that contain the three downloaded files in the node configuration. Make sure it ends with a `/` noting it is a folder.

![local-config](https://user-images.githubusercontent.com/37800834/204746412-fafc1b81-6431-4cb3-82bb-d4a29e415108.png)

### Step 4

In `Node-RED` send a buffered image (jpeg or png) to the node. Check the example in the `Import` section.

## Node Status Information

### Shape

- ■ `dot`: node is idle
- □ `ring`: node is working

### Color

- 🟩 `green`: model is available
- 🟨 `yellow`: preparing model
- 🟥 `red`: node error

## Requirements

- `Node-RED v2.0.0+`
- `Node.js v12.20.0+`

*Note:* MacOSX, Windows 10 and Ubuntu 18.04+ are supported as well as using official `docker nodered/node-red` [image](https://hub.docker.com/r/nodered/node-red/) based on [Alpine](https://hub.docker.com/_/alpine) image. Works with Raspberry Pi too since release [`v1.2.0+`](https://github.com/bonastreyair/node-red-contrib-teachable-machine/tags).

## Mentions

- [@dceejay](https://github.com/dceejay): who inspired me thanks to node [node-red-contrib-tfjs-coco-ssd](https://github.com/dceejay/tfjs-coco-ssd/)
