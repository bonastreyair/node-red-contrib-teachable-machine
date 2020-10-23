module.exports = function (RED) {
/* Initial Setup */
  const { Readable } = require('stream')
  const request = require('request')
  var tf = require('@tensorflow/tfjs')
  var PImage = require('pureimage')
  const sharp = require('sharp')

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
    this.classes = []

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
            request(node.modelUrl + 'metadata.json', function (error, response, body) {
              if (error != null) {
                console.error('error:', error) // Print the error if one occurred
              }
              node.classes = JSON.parse(body).labels
            })
            node.model = await tf.loadLayersModel(modelURL)
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

    /**
     * Given an image element, makes a prediction through mobilenet returning the
     * probabilities of the top K classes.
     */
    async function predict (imgElement) {
      console.log('Predicting...')

      const logits = tf.tidy(() => {
        // tf.browser.fromPixels() returns a Tensor from an image element.
        const img = tf.browser.fromPixels(imgElement).toFloat()

        const offset = tf.scalar(127.5)
        // Normalize the image from [0, 255] to [-1, 1].
        const normalized = img.sub(offset).div(offset)

        // Reshape to a single-element batch so we can pass it to predict.
        const batched = normalized.reshape([1, node.model.inputs[0].shape[1], node.model.inputs[0].shape[2], node.model.inputs[0].shape[3]])

        // Make a prediction through mobilenet.
        return node.model.predict(batched)
      })
      return logits
    }

    /**
     * Computes the probabilities of the topK classes given logits by computing
     * softmax to get probabilities and then sorting the probabilities.
     * @param logits Tensor representing the logits from MobileNet.
     * @param topK The number of top predictions to show.
     */
    async function getTopKClasses (logits, topK) {
      const values = await logits.data()

      const valuesAndIndices = []
      for (let i = 0; i < values.length; i++) {
        valuesAndIndices.push({ value: values[i], index: i })
      }
      valuesAndIndices.sort((a, b) => {
        return b.value - a.value
      })
      const topkValues = new Float32Array(topK)
      const topkIndices = new Int32Array(topK)
      for (let i = 0; i < topK; i++) {
        topkValues[i] = valuesAndIndices[i].value
        topkIndices[i] = valuesAndIndices[i].index
      }

      const topClassesAndProbs = []
      for (let i = 0; i < topkIndices.length; i++) {
        topClassesAndProbs.push({
          className: node.classes[topkIndices[i]],
          probability: topkValues[i]
        })
      }
      return topClassesAndProbs
    }

    /**
     * @param binary Buffer
     * returns readableInstanceStream Readable
     */
    function bufferToStream (binary) {
      const readableInstanceStream = new Readable({
        read () {
          this.push(binary)
          this.push(null)
        }
      })

      return readableInstanceStream
    }
    // Converts the image, makes inference and treats predictions
    async function inference (msg) {
      setNodeStatus(node, 'infering')
      var imageBuffer
      await sharp(msg.image)
        .resize({
          width: node.model.inputs[0].shape[1],
          height: node.model.inputs[0].shape[2]
        })
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info }) => {
          imageBuffer = data
        })
        .catch(err => { console.log(err) })

      var image = await PImage.decodeJPEGFromStream(bufferToStream(imageBuffer))
      var logits = await predict(image)
      var predictions = await getTopKClasses(logits, node.maxResults)

      var bestProbability = predictions[0].probability.toFixed(2) * 100
      var bestPredictionText = bestProbability.toString() + '% - ' + predictions[0].className

      if (node.output === 'best') {
        msg.payload = [{ class: predictions[0].className, score: predictions[0].probability }]
        setNodeStatus(node, bestPredictionText)
      } else if (node.output === 'all') {
        var filteredPredictions = predictions
        filteredPredictions = node.activeThreshold ? filteredPredictions.filter(prediction => prediction.probability > node.threshold / 100) : filteredPredictions
        filteredPredictions = node.activeMaxResults ? filteredPredictions : filteredPredictions.slice(0, 1)

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
      msg.classes = node.classes
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
