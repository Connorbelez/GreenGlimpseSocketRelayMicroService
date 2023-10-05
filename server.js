const express = require('express');
const http = require('http');
// const socketIo = require('socket.io');
const solace = require('solclientjs').debug;
const cors = require('cors');

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: 'http://localhost:3000' }));
// Solace setup (from your provided code)
// ... [Your Solace setup code here] ...

// When a client connects via socket.io
io.on('connection', (socket) => {
    console.log('Client connected');

    // Handle subscription requests from the client
    socket.on('subscribe', (topic) => {
        console.log(`User ${socket.id} subscribed to topic: ${topic}`);
        socket.subscribedTopic = topic;
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


//============= SOLACE CREDENTIALS GO HERE ===============
const url = config.url;
const vpn = config.vpn;
const username = config.username;
const pass = config.pass;
//======================================================

var GuaranteedSubscriber = function (queueName, topicName) {
    'use strict';
    var subscriber = {};
    subscriber.session = null;
    subscriber.flow = null;
    subscriber.queueName = queueName;
    subscriber.consuming = false;
    subscriber.topicName = topicName;
    subscriber.subscribed = false;

    // Logger
    subscriber.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
    };

    subscriber.log('*** Consumer to queue "' + subscriber.queueName + '" is ready to connect ***');

    // main function
    subscriber.run = function (argv) {
        subscriber.connect(argv);
    };

    // Establishes connection to Solace PubSub+ Event Broker
    subscriber.connect = function (argv) {
        if (subscriber.session !== null) {
            subscriber.log('Already connected and ready to consume messages.');
            return;
        }
        console.log("subscriber.connect() called 74" )

        subscriber.log('Connecting to Solace PubSub+ Event Broker using url: ' + url);
        subscriber.log('Client username: ' + username);
        subscriber.log('Solace PubSub+ Event Broker VPN name: ' + vpn);


        // create session
        try {
            subscriber.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      url,
                vpnName:  vpn,
                userName: username,
                password: pass,
            });
        } catch (error) {
            subscriber.log(error.toString());
        }

        // define session event listeners
        subscriber.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            subscriber.log('=== Successfully connected and ready to start the message subscriber. ===');
            subscriber.startConsume();
        });
        subscriber.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            subscriber.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        subscriber.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            subscriber.log('Disconnected.');
            subscriber.consuming = false;
            if (subscriber.session !== null) {
                subscriber.session.dispose();
                subscriber.session = null;
            }
        });
        subscriber.connectToSolace();   
    };

    subscriber.connectToSolace = function () {
        try {
            subscriber.session.connect();
        } catch (error) {
            subscriber.log(error.toString());
        }
    };

    // Starts consuming messages from Solace PubSub+ Event Broker
    subscriber.startConsume = function () {
        console.log("Subscriber startConsume() called 122")
        if (subscriber.session !== null) {
            if (subscriber.consuming) {
                subscriber.log('Already started subscriber for queue "' + subscriber.queueName + '" and ready to receive messages.');
            } else {
                subscriber.log('Starting subscriber for queue: ' + subscriber.queueName);
                try {
                    // Create a message subscriber
                    subscriber.messageSubscriber = subscriber.session.createMessageConsumer({
                        // solace.MessageConsumerProperties
                        queueDescriptor: { name: subscriber.queueName, type: solace.QueueType.QUEUE },
                        acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT, // Enabling Client ack
                        createIfMissing: true // Create queue if not exists
                    });
                    // Define message subscriber event listeners and attach to the message subscriber
                    subscriber.messageSubscriber.on(solace.MessageConsumerEventName.UP, function () {
                        subscriber.subscribe();
                        subscriber.consuming = true;
                        subscriber.log('=== Ready to receive messages. ===');
                    });
                    subscriber.messageSubscriber.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, function () {
                        subscriber.consuming = false;
                        subscriber.log('=== Error: the message subscriber could not bind to queue "' + subscriber.queueName +
                            '" ===\n   Ensure this queue exists on the message router vpn');
                        subscriber.exit();
                    });
                    subscriber.messageSubscriber.on(solace.MessageConsumerEventName.DOWN, function () {
                        subscriber.consuming = false;
                        subscriber.log('=== The message subscriber is now down ===');
                    });
                    subscriber.messageSubscriber.on(solace.MessageConsumerEventName.DOWN_ERROR, function () {
                        subscriber.consuming = false;
                        subscriber.log('=== An error happened, the message subscriber is down ===');
                    });
                    subscriber.messageSubscriber.on(solace.MessageConsumerEventName.SUBSCRIPTION_ERROR, function (sessionEvent) {
                      subscriber.log('Cannot subscribe to topic ' + sessionEvent.reason);
                    });
                    subscriber.messageSubscriber.on(solace.MessageConsumerEventName.SUBSCRIPTION_OK, function (sessionEvent) {
                      if (subscriber.subscribed) {
                        subscriber.subscribed = false;
                        subscriber.log('Successfully unsubscribed from topic: ' + sessionEvent.correlationKey);
                      } else {
                        subscriber.subscribed = true;
                        subscriber.log('Successfully subscribed to topic: ' + sessionEvent.correlationKey);
                        subscriber.log('=== Ready to receive messages. ===');
                      }
                    });
                    // Define message received event listener
                    subscriber.messageSubscriber.on(solace.MessageConsumerEventName.MESSAGE, function (message) {

                        const msg = message.getBinaryAttachment();
                        const details = message.dump();

                        const dest = message.getDestination();

                        if (solaceMessageHandler(msg, details, dest, io)){
                            console.log("\n\n\n =============== back from messagehandler")
                            message.acknowledge();
                        }

                    });
                    
                    // Connect the message subscriber
                    console.log("Connecting message subscriber!!! FROM MESSAGE COMSUME");
                    subscriber.messageSubscriber.connect();
                } catch (error) {
                    subscriber.log(error.toString());
                }
            }
        } else {
            subscriber.log('Cannot start the queue subscriber because not connected to Solace PubSub+ Event Broker.');
        }
    };

    // Subscribes to topic on Solace PubSub+ Event Broker
    subscriber.subscribe = function () {
      if (subscriber.messageSubscriber !== null) {
        if (subscriber.subscribed) {
          subscriber.log('Already subscribed to "' + subscriber.topicName
              + '" and ready to receive messages.');
        } else {
          subscriber.log('Subscribing to topic: ' + subscriber.topicName);
          try {
            subscriber.messageSubscriber.addSubscription(
              solace.SolclientFactory.createTopicDestination(subscriber.topicName),
              subscriber.topicName, // correlation key as topic name
              10000 // 10 seconds timeout for this operation
            );
          } catch (error) {
            subscriber.log(error.toString());
          }
        }
      } else {
        subscriber.log('Cannot subscribe because not connected to Solace PubSub+ Event Broker.');
      }
    };
  
    subscriber.exit = function () {
        subscriber.unsubscribe();
        setTimeout(function () {
          subscriber.stopConsume();
          subscriber.disconnect();
          process.exit();
        }, 1000); // wait for 1 second to get confirmation on removeSubscription
    };

    // Disconnects the subscriber from queue on Solace PubSub+ Event Broker
    subscriber.stopConsume = function () {
        if (subscriber.session !== null) {
            if (subscriber.consuming) {
                subscriber.consuming = false;
                subscriber.log('Disconnecting consumption from queue: ' + subscriber.queueName);
                try {
                    subscriber.messageSubscriber.disconnect();
                    subscriber.messageSubscriber.dispose();
                } catch (error) {
                    subscriber.log(error.toString());
                }
            } else {
                subscriber.log('Cannot disconnect the subscriber because it is not connected to queue "' +
                    subscriber.queueName + '"');
            }
        } else {
            subscriber.log('Cannot disconnect the subscriber because not connected to Solace PubSub+ Event Broker.');
        }
    };

    // Unsubscribes from topic on Solace PubSub+ Event Broker
    subscriber.unsubscribe = function () {
      if (subscriber.session !== null) {
        if (subscriber.subscribed) {
          subscriber.log('Unsubscribing from topic: ' + subscriber.topicName);
          try {
            subscriber.messageSubscriber.removeSubscription(
              solace.SolclientFactory.createTopicDestination(subscriber.topicName),
              subscriber.topicName, // correlation key as topic name
              10000 // 10 seconds timeout for this operation
            );
          } catch (error) {
            subscriber.log(error.toString());
          }
        } else {
          subscriber.log('Cannot unsubscribe because not subscribed to the topic "'
              + subscriber.topicName + '"');
        }
      } else {
        subscriber.log('Cannot unsubscribe because not connected to Solace PubSub+ Event Broker.');
      }
    };

    // Gracefully disconnects from Solace PubSub+ Event Broker
    subscriber.disconnect = function () {
        subscriber.log('Disconnecting from Solace PubSub+ Event Broker...');
        if (subscriber.session !== null) {
            try {
                setTimeout(function () {
                    subscriber.session.disconnect();
                }, 1000); // wait for 1 second to get confirmation on removeSubscription
            } catch (error) {
                subscriber.log(error.toString());
            }
        } else {
            subscriber.log('Not connected to Solace PubSub+ Event Broker.');
        }
    };

    return subscriber;
};






function solaceMessageHandler(msg, detail, dest, io){
    console.log("msg: " + msg);
    console.log("detail: " + detail);
    io.sockets.sockets.forEach((socket) => {
        if(socket.subscribedTopic === dest.getName()){
            console.log("Socket TOpic: " + socket.subscribedTopic)
            console.log("Emitting message to client: " + socket.id)
            socket.emit('message', msg);
        }
    });
    return true
}
//ToDo: Add logic to relay the message to socket.io clients based on their subscriptions
//ToDo: Add some sort of Auth
//ToDo: Put the relay in a callback function. REFACOTR!
// Relay the message to socket.io clients based on their subscriptions




// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// enable logging to JavaScript console at WARN level
// NOTICE: works only with ('solclientjs').debug
solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

// create the consumer, specifying the name of the queue
var subscriber = new GuaranteedSubscriber('tutorial/queue', 'data/testIOT1');

// subscribe to messages on Solace PubSub+ Event Broker
subscriber.run(process.argv);

// wait to be told to exit
subscriber.log("Press Ctrl-C to exit");
process.stdin.resume();

process.on('SIGINT', function () {
    'use strict';
    subscriber.exit();
});
// Start the HTTP server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});





