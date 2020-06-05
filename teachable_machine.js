module.exports = function (RED) {
  /* Initial Setup */
  // Simulate real HTML
  const { JSDOM } = require('jsdom')
  var dom = new JSDOM('')
  global.document = dom.window.document
  global.HTMLVideoElement = dom.window.HTMLVideoElement
  const canvas = require('canvas')
  // Require basic libraries
  global.fetch = require('node-fetch')
  const tmImage = require('@teachablemachine/image')

  function setNodeStatus (node, status) {
    switch (status) {
      case 'modelReady':
        node.status({ fill: 'green', shape: 'dot', text: 'ready' })
        break
      case 'modelLoading':
        node.status({ fill: 'yellow', shape: 'ring', text: 'loading model...' })
        break
      case 'infering':
        node.status({ fill: 'blue', shape: 'ring', text: 'infering...' })
        break
      case 'modelError':
        node.status({ fill: 'red', shape: 'dot', text: 'model error' })
        break
      case 'error':
        node.status({ fill: 'red', shape: 'dot', text: 'error' })
        break
      case 'close':
        node.status({})
        break
      default:
        node.status({ fill: 'grey', shape: 'dot', text: status })
    }
  }

  function teachableMachine (config) {
    /* Node-RED Node Code Creation */
    RED.nodes.createNode(this, config)

    this.mode = config.mode
    this.modelUrl = config.modelUrl
    this.localModel = config.localModel
    this.activeThreshold = config.activeThreshold
    this.threshold = config.threshold
    this.activeMaxResults = config.activeMaxResults
    this.maxResults = config.maxResults
    this.output = config.output
    this.passThrough = config.passThrough

    var node = this

    // Loads the Model from an Teachable Machine URL
    async function loadModel () {
      setNodeStatus(node, 'modelLoading')
      try {
        node.ready = false
        if (node.mode === 'online') {
          if (node.modelUrl === '') {
            setNodeStatus(node, 'set a New URL')
            return
          } else {
            const modelURL = node.modelUrl + 'model.json'
            const metadataURL = node.modelUrl + 'metadata.json'
            node.model = await tmImage.load(modelURL, metadataURL)
          }
        } else {
          setNodeStatus(node, 'mode not supported')
          return
        }
        node.ready = true
        setNodeStatus(node, 'modelReady')
      } catch (error) {
        setNodeStatus(node, 'modelError')
        node.error(error)
      }
    }

    function getBestPrediction (predictions) {
      var className = ''
      var probability = 0
      for (let i = 0; i < predictions.length; i++) {
        if (predictions[i].probability > probability) {
          className = predictions[i].className
          probability = predictions[i].probability
        }
      }
      return [className, probability]
    }

    function byProbabilty (predictionA, predictionB) {
      if (predictionA.probability > predictionB.probability) return -1
      if (predictionA.probability < predictionB.probability) return 1
      return 0
    }

    function changeKeyResults (results) {
      var out = []
      for (let i = 0; i < results.length; i++) {
        out.push({
          class: results[i].className,
          score: results[i].probability
        })
      }
      return out
    }

    // Converts the image, makes inference and treats predictions
    async function inference (msg) {
      setNodeStatus(node, 'infering')
      var image = new canvas.Image()
      image.src = msg.image

      var predictions = await node.model.predict(image)

      predictions.sort(byProbabilty)
      var percentage = (predictions[0].probability * 100).toFixed(0)
      var bestPredictionText = percentage.toString() + '% - ' + predictions[0].className

      if (node.output === 'best') {
        msg.payload = [{ class: predictions[0].className, score: predictions[0].probability }]
        setNodeStatus(node, bestPredictionText)
      } else if (node.output === 'all') {
        var filteredPredictions = predictions
        filteredPredictions = node.activeThreshold ? filteredPredictions.filter(prediction => prediction.probability > node.threshold / 100) : filteredPredictions
        filteredPredictions = node.activeMaxResults ? filteredPredictions.slice(0, node.maxResults) : filteredPredictions
        filteredPredictions = changeKeyResults(filteredPredictions)

        if (filteredPredictions.length > 0) {
          setNodeStatus(node, bestPredictionText)
        } else {
          var statusText = 'score < ' + node.threshold + '%'
          setNodeStatus(node, statusText)
          msg.payload = []
          node.send(msg)
          return
        }
        msg.payload = filteredPredictions
      }
      msg.classes = node.model.getClassLabels()
      node.send(msg)
    }

    loadModel()

    node.on('input', function (msg) {
      try {
        if (node.ready && node.modelUrl !== '') {
          msg.image = msg.payload
          inference(msg)
          if (!node.passThrough) { delete msg.image }
        } else {
          node.error('model is not ready')
        }
      } catch (error) {
        node.error(error)
        console.log(error)
      }
    })

    node.on('close', function () { setNodeStatus(node, 'close') })
  }
  RED.nodes.registerType('teachable machine', teachableMachine)
}
