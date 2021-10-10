module.exports = function (RED) {
  /* Initial Setup */
  const { Readable } = require('stream')
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
  const tf = require('@tensorflow/tfjs')
  const PImage = require('pureimage')

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
    const node = this

    class ModelLoader {
      constructor () {
        this.ready = false
        this.object = null
        this.labels = []
      }

      async load (url) {
        if (this.ready) {
          node.status(nodeStatus.MODEL.RELOADING)
        } else {
          node.status(nodeStatus.MODEL.LOADING)
        }
        this.object = await this.getModel(url)
        this.labels = await this.getLabels(url)
        this.ready = true
      }

      async getModel (url) {
        throw new Error('getModel(url) needs to be implemented')
      }

      async getLabels (url) {
        throw new Error('getLabels(url) needs to be implemented')
      }
    }

    class OnlineModelLoader extends ModelLoader {
      async getModel (url) {
        return await tf.loadLayersModel(url + 'model.json')
      }

      async getLabels (url) {
        const response = await fetch(url + 'metadata.json')
        return JSON.parse(await response.text()).labels
      }
    }

    const modelLoaderFactory = {
      online: new OnlineModelLoader()
    }

    node.modelLoader = modelLoaderFactory[config.mode]

    const nodeStatus = {
      MODEL: {
        LOADING: { fill: 'yellow', shape: 'ring', text: 'loading...' },
        RELOADING: { fill: 'yellow', shape: 'ring', text: 'reloading...' },
        READY: { fill: 'green', shape: 'dot', text: 'ready' },
        INFERENCING: { fill: 'green', shape: 'ring', text: 'inferencing...' },
        INFERENCE: (text) => { return { fill: 'green', shape: 'dot', text: text } }
      },
      ERROR: (text) => { node.error(text); return { fill: 'red', shape: 'dot', text: text } },
      CLOSE: {}
    }

    // Loads the Model from an Teachable Machine URL
    async function loadModel () {
      try {
        await node.modelLoader.load(config.modelUrl)
      } catch (error) {
        console.error(error)
        node.status(nodeStatus.ERROR('model error'))
      }
      node.status(nodeStatus.MODEL.READY)
    }

    /**
     * Given an image element, makes a prediction through model returning the
     * probabilities of the top K classes.
     */
    async function predict (imgElement) {
      const logits = tf.tidy(() => {
        // tf.browser.fromPixels() returns a Tensor from an image element.
        let img = tf.browser.fromPixels(imgElement).toFloat()
        img = tf.image.resizeNearestNeighbor(img, [node.modelLoader.object.inputs[0].shape[1], node.modelLoader.object.inputs[0].shape[2]])

        const offset = tf.scalar(127.5)
        // Normalize the image from [0, 255] to [-1, 1].
        const normalized = img.sub(offset).div(offset)

        // Reshape to a single-element batch so we can pass it to predict.
        const batched = normalized.reshape([1, node.modelLoader.object.inputs[0].shape[1], node.modelLoader.object.inputs[0].shape[2], node.modelLoader.object.inputs[0].shape[3]])

        // Make a prediction through mobilenet.
        return node.modelLoader.object.predict(batched)
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
          class: node.modelLoader.labels[topkIndices[i]],
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
      node.status(nodeStatus.MODEL.INFERENCING)

      let imageBitmap
      try {
        imageBitmap = await decodeBuffer(msg.image)
      } catch (error) {
        node.error(error)
        node.status(nodeStatus.MODEL.READY)
        return
      }

      const logits = await predict(imageBitmap)

      const predictions = await getTopKClasses(logits, node.modelLoader.labels.length)

      const bestProbability = predictions[0].score.toFixed(2) * 100
      const bestPredictionText = bestProbability.toString() + '% - ' + predictions[0].class

      if (config.output === 'best') {
        msg.payload = [predictions[0]]
        node.status(nodeStatus.MODEL.INFERENCE(bestPredictionText))
      } else if (config.output === 'all') {
        let filteredPredictions = predictions
        filteredPredictions = config.activeThreshold ? filteredPredictions.filter(prediction => prediction.score > config.threshold / 100) : filteredPredictions
        filteredPredictions = config.activeMaxResults ? filteredPredictions.slice(0, config.maxResults) : filteredPredictions

        if (filteredPredictions.length > 0) {
          node.status(nodeStatus.MODEL.INFERENCE(bestPredictionText))
        } else {
          const statusText = 'score < ' + config.threshold + '%'
          node.status(nodeStatus.MODEL.INFERENCE(statusText))
          msg.payload = []
          node.send(msg)
          return
        }
        msg.payload = filteredPredictions
      }
      msg.classes = node.modelLoader.labels
      node.send(msg)
    }

    loadModel()

    node.on('input', function (msg) {
      try {
        if (node.modelUrl !== '') {
          if (msg.reload) { loadModel(); return }
          if (node.modelLoader.ready) {
            if (msg.payload) {
              msg.image = msg.payload
              inference(msg)
              if (!config.passThrough) { delete msg.image }
            }
          } else {
            node.status(nodeStatus.ERROR('model is not ready'))
          }
        }
      } catch (error) {
        node.status(nodeStatus.ERROR(error))
        console.log(error)
      }
    })

    node.on('close', function () {
      node.status(nodeStatus.CLOSE)
    })
  }
  RED.nodes.registerType('teachable machine', teachableMachine)
}
