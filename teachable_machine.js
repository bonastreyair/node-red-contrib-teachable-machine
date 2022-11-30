module.exports = function (RED) {
  /* Initial Setup */
  const { Readable } = require('stream')
  const fs = require('fs')
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
  const tf = require('@tensorflow/tfjs-node')
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

    const nodeStatus = {
      MODEL: {
        LOADING: { fill: 'yellow', shape: 'ring', text: 'loading...' },
        RELOADING: { fill: 'yellow', shape: 'ring', text: 'reloading...' },
        READY: { fill: 'green', shape: 'dot', text: 'ready' },
        DECODING: { fill: 'green', shape: 'ring', text: 'decoding...' },
        PREPROCESSING: { fill: 'green', shape: 'ring', text: 'preprocessing...' },
        INFERENCING: { fill: 'green', shape: 'ring', text: 'inferencing...' },
        POSTPROCESSING: { fill: 'green', shape: 'ring', text: 'postprocessing...' },
        RESULT: (text) => { return { fill: 'green', shape: 'dot', text } }
      },
      ERROR: (text) => { node.error(text); return { fill: 'red', shape: 'dot', text } },
      CLOSE: {}
    }

    class ModelManager {
      constructor () {
        this.ready = false
        this.labels = []
      }

      async load (uri) {
        if (this.ready) {
          node.status(nodeStatus.MODEL.RELOADING)
        } else {
          node.status(nodeStatus.MODEL.LOADING)
        }

        this.model = await this.getModel(uri)
        this.labels = await this.getLabels(uri)

        this.input = {
          height: this.model.inputs[0].shape[1],
          width: this.model.inputs[0].shape[2],
          channels: this.model.inputs[0].shape[3]
        }

        this.ready = true
        return this.model
      }

      async getModel (uri) {
        throw new Error('getModel(uri) needs to be implemented')
      }

      async getLabels (uri) {
        throw new Error('getLabels(uri) needs to be implemented')
      }
    }

    class OnlineModelManager extends ModelManager {
      async getModel (uri) {
        return await tf.loadLayersModel(uri + 'model.json')
      }

      async getLabels (uri) {
        const response = await fetch(uri + 'metadata.json')
        return JSON.parse(await response.text()).labels
      }
    }

    class LocalModelManager extends ModelManager {
      async getModel (uri) {
        return await tf.loadLayersModel('file://' + uri + 'model.json')
      }

      async getLabels (uri) {
        const file = fs.readFileSync(uri + 'metadata.json')
        return JSON.parse(file).labels
      }
    }

    const modelManagerFactory = {
      online: new OnlineModelManager(),
      local: new LocalModelManager()
    }

    function nodeInit () {
      node.modelManager = modelManagerFactory[config.mode]
      if (config.modelUri !== '') {
        loadModel(config.modelUri)
      }
    }

    /**
     * Loads the Model trained from the Teachable Machine web.
     * @param uri where to load the model from
     */
    async function loadModel (uri) {
      try {
        node.model = await node.modelManager.load(uri)
        node.status(nodeStatus.MODEL.READY)
      } catch (error) {
        node.status(nodeStatus.ERROR(error))
      }
    }

    async function decodeImageBuffer (imageBuffer) {
      node.status(nodeStatus.MODEL.DECODING)
      const stream = new Readable({
        read () {
          this.push(imageBuffer)
          this.push(null)
        }
      })
      if (isPng(imageBuffer)) {
        return await PImage.decodePNGFromStream(stream)
      } else {
        return await PImage.decodeJPEGFromStream(stream)
      }
    }

    /**
     * Preprocess an image to be later passed to a model.predict().
     * @param image image in a bitmap format
     * @param inputShape input shape object of the model that contains height, width and channels
     */
    async function preprocess (image, inputShape) {
      node.status(nodeStatus.MODEL.PREPROCESSING)
      return tf.tidy(() => {
        // tf.browser.fromPixels() returns a Tensor from an image element.
        const resizedImage = tf.image.resizeNearestNeighbor(
          tf.browser.fromPixels(image).toFloat(),
          [inputShape.height, inputShape.width]
        )

        // Normalize the image from [0, 255] to [-1, 1].
        const offset = tf.scalar(127.5)
        const normalizedImage = resizedImage.sub(offset).div(offset)

        // Reshape to a single-element batch so we can pass it to predict.
        return normalizedImage.reshape([1, inputShape.height, inputShape.width, inputShape.channels])
      })
    }

    /**
     * Infers an image buffer to obtain classification predictions.
     * @param imageBuffer image buffer in png or jpeg format
     * @returns outputs of the model
     */
    async function inferImageBuffer (imageBuffer) {
      let image
      try {
        image = await decodeImageBuffer(imageBuffer)
      } catch (error) {
        node.error(error)
        return null
      }
      const inputs = await preprocess(image, node.modelManager.input)
      node.status(nodeStatus.MODEL.INFERENCING)
      return await node.model.predict(inputs)
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
          class: node.modelManager.labels[topkIndices[i]],
          score: topkValues[i]
        })
      }
      return topClassesAndProbs
    }

    /**
     * Post processes the outputs depending on the node configuration.
     * @param outputs
     * @returns a list of predictions
     */
    async function postprocess (outputs) {
      const predictions = await getTopKClasses(outputs, node.modelManager.labels.length)

      const bestProbability = predictions[0].score.toFixed(2) * 100
      const bestPredictionText = bestProbability.toString() + '% - ' + predictions[0].class

      if (config.output === 'best') {
        node.status(nodeStatus.MODEL.RESULT(bestPredictionText))
        return [predictions[0]]
      } else if (config.output === 'all') {
        let filteredPredictions = predictions
        filteredPredictions = config.activeThreshold ? filteredPredictions.filter(prediction => prediction.score > config.threshold / 100) : filteredPredictions
        filteredPredictions = config.activeMaxResults ? filteredPredictions.slice(0, config.maxResults) : filteredPredictions

        if (filteredPredictions.length > 0) {
          node.status(nodeStatus.MODEL.RESULT(bestPredictionText))
        } else {
          const statusText = 'score < ' + config.threshold + '%'
          node.status(nodeStatus.MODEL.RESULT(statusText))
          return []
        }
        return filteredPredictions
      }
    }

    /* Main Node Logic */

    nodeInit()

    node.on('input', async function (msg) {
      if (msg.reload) { await loadModel(config.modelUri); return }
      if (!node.modelManager.ready) { node.status(nodeStatus.ERROR('model not ready')); return }
      if (config.passThrough) { msg.image = msg.payload }
      const outputs = await inferImageBuffer(msg.payload)
      if (outputs === null) { node.status(nodeStatus.MODEL.READY); return }
      msg.payload = await postprocess(outputs)
      msg.classes = node.modelManager.labels
      node.send(msg)
    })

    node.on('close', function () {
      node.status(nodeStatus.CLOSE)
    })
  }
  RED.nodes.registerType('teachable machine', teachableMachine)
}
