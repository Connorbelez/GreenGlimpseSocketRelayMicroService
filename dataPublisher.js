/*jslint es6 node:true devel:true*/
const solace = require('solclientjs').debug; // logging supported

var TopicPublisher = function (solaceModule, topicName) {
    'use strict';
    var solace = solaceModule;
    var publisher = {};
    publisher.session = null;
    publisher.topicName = topicName;

    // Logger
    publisher.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
    };

    publisher.log('\n*** Publisher to topic "' + publisher.topicName + '" is ready to connect ***');

    // Generate random but realistic emissions data for different stages
    publisher.generateRandomEmissions = function () {
        const getRandomValue = (min, max) => Math.random() * (max - min) + min;
        
        const data = {
            RawMineral: [getRandomValue(0, 10), getRandomValue(0, 10)],
            Manufacturing: [getRandomValue(10, 30), getRandomValue(10, 30)],
            Transportation: [getRandomValue(5, 15), getRandomValue(5, 15)],
            Operations: [getRandomValue(20, 40), getRandomValue(20, 40)],
            Usage: [getRandomValue(10, 25), getRandomValue(10, 25)],
            Waste: [getRandomValue(5, 15), getRandomValue(5, 15)],
        };
        return JSON.stringify(data);
    };

    // main function
    publisher.run = function (argv) {
        publisher.connect(argv);
    };

    // Establishes connection to Solace PubSub+ Event Broker
    publisher.connect = function (argv) {
        if (publisher.session !== null) {
            publisher.log('Already connected and ready to publish.');
            return;
        }
        // extract params
        publisher.log('Connecting to Solace PubSub+ Event Broker using url: ' + url);
        publisher.log('Client username: ' + username);
        publisher.log('Solace PubSub+ Event Broker VPN name: ' + vpn);
        // create session
        try {
            publisher.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      url,
                vpnName:  vpn,
                userName: username,
                password: pass,
            });
        } catch (error) {
            publisher.log(error.toString());
        }
        // define session event listeners
        publisher.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            publisher.log('=== Successfully connected and ready to publish messages. ===');
            // Start publishing random but realistic emissions data at regular intervals
            setInterval(function () {
                const emissionsData = publisher.generateRandomEmissions();
                publisher.publish(emissionsData);
            }, 1000); // Publish every second
        });

        publisher.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            publisher.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        publisher.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            publisher.log('Disconnected.');
            if (publisher.session !== null) {
                publisher.session.dispose();
                publisher.session = null;
            }
        });
        // connect the session
        try {
            publisher.session.connect();
        } catch (error) {
            publisher.log(error.toString());
        }
    };

    // Publishes one message
    publisher.publish = function (val) {
        if (publisher.session !== null) {
            var message = solace.SolclientFactory.createMessage();
            message.setDestination(solace.SolclientFactory.createTopicDestination(publisher.topicName));
            message.setBinaryAttachment(val);
            message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
            publisher.log('Publishing JSON data to topic "' + publisher.topicName + '"...');
            try {
                publisher.session.send(message);
                publisher.log('JSON data published.');
            } catch (error) {
                publisher.log(error.toString());
            }
        } else {
            publisher.log('Cannot publish because not connected to Solace PubSub+ Event Broker.');
        }
    };

    publisher.exit = function () {
        publisher.disconnect();
        setTimeout(function () {
            process.exit();
        }, 10); // wait for 1 second to finish
    };

    // Gracefully disconnects from Solace PubSub+ Event Broker
    publisher.disconnect = function () {
        publisher.log('Disconnecting from Solace PubSub+ Event Broker...');
        if (publisher.session !== null) {
            try {
                publisher.session.disconnect();
            } catch (error) {
                publisher.log(error.toString());
            }
        } else {
            publisher.log('Not connected to Solace PubSub+ Event Broker.');
        }
    };

    return publisher;
};

// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// enable logging to JavaScript console at WARN level
// NOTICE: works only with ('solclientjs').debug
solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

// Update Solace connection details here
const url = 'wss://mr-connection-y5r00qk8jwd.messaging.solace.cloud:443';
const vpn = 'greenglimpseevents';
const username = 'solace-cloud-client';
const pass = '23vj69o8cd7uihpergkd4p6152';

// create the publisher, specifying the name of the subscription topic
var publisher = new TopicPublisher(solace, 'data/testIOT1');

// publish message to Solace PubSub+ Event Broker
publisher.run(process.argv);

// Handle termination signals
process.on('SIGINT', function () {
    console.log('Caught interrupt signal');
    publisher.exit();
});
