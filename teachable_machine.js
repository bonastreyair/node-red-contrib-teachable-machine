module.exports = function (RED) {
  function teachableMachine (config) {
    /* Initial Setup */
    // Simulate real HTML
    const { JSDOM } = require('jsdom')
    var dom = new JSDOM('<!doctype html><html></html>')
    global.document = dom.window.document

    // Require basic libraries
    var tmImage = require('@teachablemachine/image')
    var Canvas = require('canvas')
    global.fetch = require('node-fetch')
    // Teachable Machine needs global scope of HTMLVideoElement class to do a check
    global.HTMLVideoElement = class HTMLVideoElement {}

    /* Node-RED Node Code Creation */
    RED.nodes.createNode(this, config)

    var node = this

    node.modelUrl = config.modelUrl || ''
    node.output = config.output
    // node.threshold = config.threshold;

    // Loads the Model from an Teachable Machine URL
    async function loadModel (url) {
      try {
        const modelURL = url + 'model.json'
        const metadataURL = url + 'metadata.json'
        node.model = await tmImage.load(modelURL, metadataURL)
        node.modelReady = true
        node.status({ fill: 'green', shape: 'dot', text: 'model loaded' })
      } catch (error) {
        node.status({ fill: 'red', shape: 'dot', text: 'model not loaded' })
        node.error(error)
        console.log(error)
      }
    }

    // Converts the image, makes inference and treats predictions
    async function inference (msg) {
      node.status({ fill: 'blue', shape: 'ring', text: 'infering...' })
      var image = new Canvas.Image()
      image.src = msg.image
      var predictions = await node.model.predict(image)

      // Save the best prediction
      var className = ''
      var probability = 0
      for (var i = 0; i < predictions.length; i++) {
        if (predictions[i].probability > probability) {
          className = predictions[i].className
          probability = predictions[i].probability
        }
      }

      if (node.output === 'best') {
        msg.payload = { className: className, probability: probability }
      } else if (node.output === 'all') {
        msg.payload = predictions
      } else { // TODO add top-5, top-n
        msg.payload = {}
      }

      // Update node status
      msg.classes = node.model.getClassLabels()
      var percentage = probability.toFixed(2) * 100
      var statusText = percentage.toString() + '% - ' + className
      node.status({ fill: 'green', shape: 'dot', text: statusText })

      node.send(msg)
    }

    node.status({ fill: 'yellow', shape: 'ring', text: 'loading model...' })
    setTimeout(function () { loadModel(node.modelUrl) }, 500) // Delay 500ms

    node.on('input', function (msg) {
      try {
        if (node.modelReady && node.modelUrl !== '') {
          msg.image = msg.payload
          inference(msg)
        } else {
          node.error('model is not ready')
        }
      } catch (error) {
        node.error(error)
        console.log(error)
      }
    })

    node.on('close', function () {
      node.status({})
    })
  }
  RED.nodes.registerType('teachable machine', teachableMachine)
}
