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

    class ModelManager {
      constructor () {
        this.ready = false
        this.labels = []
      }

      async load (url) {
        if (this.ready) {
          node.status(nodeStatus.MODEL.RELOADING)
        } else {
          node.status(nodeStatus.MODEL.LOADING)
        }

        this.model = await this.getModel(url)
        this.labels = await this.getLabels(url)

        this.input = {
          height: this.model.inputs[0].shape[1],
          width: this.model.inputs[0].shape[2],
          channels: this.model.inputs[0].shape[3]
        }

        this.ready = true
        return this.model
      }

      async getModel (url) {
        throw new Error('getModel(url) needs to be implemented')
      }

      async getLabels (url) {
        throw new Error('getLabels(url) needs to be implemented')
      }
    }

    class OnlineModelLoader extends ModelManager {
      async getModel (url) {
        return await tf.loadLayersModel(url + 'model.json')
      }

      async getLabels (url) {
        const response = await fetch(url + 'metadata.json')
        return JSON.parse(await response.text()).labels
      }
    }

    const modelManagerFactory = {
      online: new OnlineModelLoader()
    }

    node.modelManager = modelManagerFactory[config.mode]

    // Preprocess an image to be later passed to a model.predict().
    async function preprocess (image, inputModel) {
      return tf.tidy(() => {
        // tf.browser.fromPixels() returns a Tensor from an image element.
        const resizedImage = tf.image.resizeNearestNeighbor(
          tf.browser.fromPixels(image).toFloat(),
          [inputModel.height, inputModel.width]
        )

        // Normalize the image from [0, 255] to [-1, 1].
        const offset = tf.scalar(127.5)
        const normalizedImage = resizedImage.sub(offset).div(offset)

        // Reshape to a single-element batch so we can pass it to predict.
        return normalizedImage.reshape([1, inputModel.height, inputModel.width, inputModel.channels])
      })
    }

    // Loads the Model from an Teachable Machine URL
    async function loadModel () {
      try {
        node.model = await node.modelManager.load(config.modelUrl)
        node.status(nodeStatus.MODEL.READY)
      } catch (error) {
        console.error(error)
        node.status(nodeStatus.ERROR('model error'))
      }
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
    async function inference (imageBuffer) {
      node.status(nodeStatus.MODEL.INFERENCING)

      let image
      try {
        image = await decodeBuffer(imageBuffer)
      } catch (error) {
        node.error(error)
        node.status(nodeStatus.MODEL.READY)
        return
      }

      const batch = await preprocess(image, node.modelManager.input)
      const logits = await node.model.predict(batch)
      return await postprocess(logits)
    }

    async function postprocess (logits) {
      const predictions = await getTopKClasses(logits, node.modelManager.labels.length)

      const bestProbability = predictions[0].score.toFixed(2) * 100
      const bestPredictionText = bestProbability.toString() + '% - ' + predictions[0].class

      if (config.output === 'best') {
        node.status(nodeStatus.MODEL.INFERENCE(bestPredictionText))
        return [predictions[0]]
      } else if (config.output === 'all') {
        let filteredPredictions = predictions
        filteredPredictions = config.activeThreshold ? filteredPredictions.filter(prediction => prediction.score > config.threshold / 100) : filteredPredictions
        filteredPredictions = config.activeMaxResults ? filteredPredictions.slice(0, config.maxResults) : filteredPredictions

        if (filteredPredictions.length > 0) {
          node.status(nodeStatus.MODEL.INFERENCE(bestPredictionText))
        } else {
          const statusText = 'score < ' + config.threshold + '%'
          node.status(nodeStatus.MODEL.INFERENCE(statusText))
          return []
        }
        return filteredPredictions
      }
    }

    loadModel()

    node.on('input', async function (msg) {
      try {
        if (node.modelUrl !== '') {
          if (msg.reload) { loadModel(); return }
          if (node.modelManager.ready) {
            if (msg.payload) {
              if (config.passThrough) { msg.image = msg.payload }
              msg.payload = await inference(msg.payload)
              msg.classes = node.modelManager.labels
              node.send(msg)
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
