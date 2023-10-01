
//=============SOLACE CREDENTIALS GO HERE===============


//======================================================

/*jslint es6 node:true devel:true*/
const readline = require('readline');

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
            // publisher.publish("THIS IS A TEST MESSAGE");
            // get input from the user to publish
            let stdin = process.stdin;
            stdin.setEncoding('utf8');

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const waitForUserInput = () => {
                rl.question("Enter a message to publish (or 'q' to quit): ", (input) => {
                    if (input === 'q') {
                        rl.close();
                        return;
                    }

                    publisher.publish(input);
                    waitForUserInput(); // Wait for the next user input
                });
            };
                waitForUserInput();
     

            


            //TODO: PUBLISH MEANINGFUL DATA HERE
            // for (var i = 0; i < 10; i++) {
            //     publisher.publish(i);
            // }
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
        console.log("val: ",val);

        if (publisher.session !== null) {
            var jsonData = {
                key: val,
            };

            var jsonString = JSON.stringify(jsonData);

            var message = solace.SolclientFactory.createMessage();
            message.setDestination(solace.SolclientFactory.createTopicDestination(publisher.topicName));
            message.setBinaryAttachment(jsonString);
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
        }, 1000); // wait for 1 second to finish
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

var solace = require('solclientjs').debug; // logging supported

// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// enable logging to JavaScript console at WARN level
// NOTICE: works only with ('solclientjs').debug
solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

// create the publisher, specifying the name of the subscription topic
var publisher = new TopicPublisher(solace, 'data/testIOT1');

// var publisher = new GuaranteedPublisher('solace/samples/nodejs/pers');
// publish message to Solace PubSub+ Event Broker
publisher.run(process.argv);
