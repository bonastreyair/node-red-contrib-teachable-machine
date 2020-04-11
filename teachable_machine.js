module.exports = function(RED) {
    function teachableMachine(config) {
        // Simulate real HTML
        const jsdom = require('jsdom');
        const {JSDOM} = jsdom;
        global.dom = new JSDOM('<!doctype html><html></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.navigator = global.window.navigator;

        // Require basic libraries
        var tm = require('@teachablemachine/image');
        var Canvas = require('canvas');
        global.fetch  = require('node-fetch');

        class HTMLVideoElement {
            constructor(height, width) {
                this.height = height;
                this.width = width;
            }
        }
        global.HTMLVideoElement = HTMLVideoElement;

        RED.nodes.createNode(this, config);
        
        this.modelUrl = config.modelUrl || "";
        // this.threshold = config.threshold;
        this.top1 = config.top1;

        var node = this;

        async function loadModel(url) {
			try {
                const modelURL = url + 'model.json';
                const metadataURL = url + 'metadata.json';
                node.model = await tm.load(modelURL, metadataURL);
		    	node.ready = true;
		    	node.status({fill:'green', shape:'dot', text:'model loaded'});
		    } catch (error) {
		    	node.status({fill:'red', shape:'dot', text:'model not loaded'});
		    	console.log(error);
		    }
        }

        async function infer(msg) {
            node.status({fill:'blue', shape:'ring', text:'infering...'});
            image = new Canvas.Image;
            image.src = msg.payload;
            predictions = await node.model.predict(image);

            // Find the Top-1
            className = "";
            probability = 0;
            for (var i = 0; i < predictions.length; i++) {
                if (predictions[i].probability > probability) {
                    className = predictions[i].className;
                    probability = predictions[i].probability;
                }
            }

            if (node.top1) {
                msg.payload = {
                    "className": className,
                    "probability": probability
                }
            } else {
                msg.payload = predictions;
            }

            msg.classes = node.model.getClassLabels();
            percentage = probability.toFixed(2)*100;
            statusText = percentage.toString() + '% - ' + className;
            node.status({fill:'green', shape:'dot', text:statusText});
            node.send(msg);
        }

        node.status({fill:'yellow', shape:'ring', text:'loading model...'});
        loadModel(node.modelUrl);

        node.on('input', function(msg) {
            // node.threshold = msg.threshold || node.threshold || 0.5;
            try {
                if (node.ready && node.modelUrl != "") {
                    infer(msg);
                } else {
                	node.error("model is not ready")
                }
            } catch (error) {
                node.error(error);
            }
        });

        node.on("close", function() {
            node.status({});
        });
    }
    RED.nodes.registerType("teachable machine", teachableMachine);
}