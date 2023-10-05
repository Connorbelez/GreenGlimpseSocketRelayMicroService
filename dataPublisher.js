/*jslint es6 node:true devel:true*/
const solace = require('solclientjs').debug; // logging supported
const config = require('./config');

// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// Enable logging to JavaScript console at WARN level
solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

// Update Solace connection details here
const url = config.url;
const vpn = config.vpn;
const username = config.username;
const pass = config.pass;

// Function to generate emissions data with an oscillating trend
function generateTrendingEmissionsData() {
    const months = 12; // Number of months
    const emissionsData = {};

    // Initialize starting values for each stage
    const initialEmissions = {
        RawMineral: 5,
        Manufacturing: 15,
        Transportation: 10,
        Operations: 30,
        Usage: 15,
        Waste: 10,
    };

    for (let stage in initialEmissions) {
        emissionsData[stage] = [];
        const initialEmission = initialEmissions[stage];
        let currentEmission = initialEmission;
        let increasing = true; // Flag to indicate if emissions are increasing or decreasing

        for (let month = 1; month <= months; month++) {
            // Oscillate between increasing and decreasing emissions
            if (increasing) {
                currentEmission += (Math.random() * 3); // Increase emissions
            } else {
                currentEmission -= (Math.random() * 3); // Decrease emissions
            }

            // Toggle the flag if emissions reach certain bounds (you can adjust these bounds)
            if (currentEmission <= initialEmission - 10 || currentEmission >= initialEmission + 10) {
                increasing = !increasing;
            }

            emissionsData[stage].push(currentEmission.toFixed(2)); // Store emissions rounded to 2 decimal places
        }
    }

    return JSON.stringify(emissionsData);
}

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
                url: url,
                vpnName: vpn,
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
                const emissionsData = generateTrendingEmissionsData();
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

// create the publisher, specifying the name of the subscription topic
var publisher = new TopicPublisher(solace, 'data/testIOT1');

// publish message to Solace PubSub+ Event Broker
publisher.run(process.argv);

// Handle termination signals
process.on('SIGINT', function () {
    console.log('Caught interrupt signal');
    publisher.exit();
});
