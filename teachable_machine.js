module.exports = function (RED) {
  /* Initial Setup */
  const { Readable } = require('stream')
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
  const tf = require('@tensorflow/tfjs')
  const PImage = require('pureimage')

  function setNodeStatus (node, status) {
    switch (status) {
      case 'modelReady':
        node.status({ fill: 'green', shape: 'dot', text: 'ready' })
        break
      case 'modelLoading':
        node.status({ fill: 'yellow', shape: 'ring', text: 'loading model...' })
        break
      case 'inferencing':
        node.status({ fill: 'blue', shape: 'ring', text: 'inferencing...' })
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

  function isPng (buffer) {
    if (!buffer || buffer.length < 8) {
      return false
    }

    return buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
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

    const node = this

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
            const response = await fetch(node.modelUrl + 'metadata.json')
            const body = await response.text()
            node.classes = JSON.parse(body).labels
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
     * Given an image element, makes a prediction through model returning the
     * probabilities of the top K classes.
     */
    async function predict (imgElement) {
      const logits = tf.tidy(() => {
        // tf.browser.fromPixels() returns a Tensor from an image element.
        let img = tf.browser.fromPixels(imgElement).toFloat()
        img = tf.image.resizeNearestNeighbor(img, [node.model.inputs[0].shape[1], node.model.inputs[0].shape[2]])

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
      topK = Math.min(topK, values.length)

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
          class: node.classes[topkIndices[i]],
          score: topkValues[i]
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

    async function decodeBuffer (image) {
      const stream = bufferToStream(image)
      if (isPng(image)) {
        return await PImage.decodePNGFromStream(stream)
      } else {
        return await PImage.decodeJPEGFromStream(stream)
      }
    }

    /**
     * Converts the image, makes inference and treats predictions
     * @param msg message of the node-red
     */
    async function inference (msg) {
      setNodeStatus(node, 'inferencing')

      const imageBitmap = await decodeBuffer(msg.image)

      const logits = await predict(imageBitmap)

      const predictions = await getTopKClasses(logits, node.classes.length)

      const bestProbability = predictions[0].score.toFixed(2) * 100
      const bestPredictionText = bestProbability.toString() + '% - ' + predictions[0].class

      if (node.output === 'best') {
        msg.payload = [predictions[0]]
        setNodeStatus(node, bestPredictionText)
      } else if (node.output === 'all') {
        let filteredPredictions = predictions
        filteredPredictions = node.activeThreshold ? filteredPredictions.filter(prediction => prediction.score > node.threshold / 100) : filteredPredictions
        filteredPredictions = node.activeMaxResults ? filteredPredictions.slice(0, node.maxResults) : filteredPredictions

        if (filteredPredictions.length > 0) {
          setNodeStatus(node, bestPredictionText)
        } else {
          const statusText = 'score < ' + node.threshold + '%'
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
        if (node.modelUrl !== '') {
          if (msg.reload) { loadModel(); return }
          if (node.ready) {
            if (msg.payload) {
              msg.image = msg.payload
              inference(msg)
              if (!node.passThrough) { delete msg.image }
            }
          } else {
            node.error('model is not ready')
          }
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
