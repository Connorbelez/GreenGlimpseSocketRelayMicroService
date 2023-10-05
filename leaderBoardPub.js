/*jslint es6 node:true devel:true*/
const solace = require('solclientjs').debug; // logging supported
const config = require('./config');

class dataBuffer {
    constructor(size) {
        this.size = size;
        this.buffer = [];
    }

    add(data) {
        this.buffer.push(data);
        if (this.buffer.length > this.size) {
            this.buffer.shift();
        }
    }

    get() {
        return this.buffer;
    }
}

class TrendTracker {
    constructor(initial, min, max) {
        this.current = initial;
        this.min = min;
        this.max = max;
    }

    getTrend() {
        // Is it in the upper half of the range?
        const upperHalf = this.current > ((this.max - this.min) / 2) + this.min;

        // If so then it's more likely to go down, based on the delta
        const delta = upperHalf ? this.max - this.current : this.current - this.min;

        // Logarithmic probability: approaches 100% as delta approaches 0
        // Adding 1 to avoid Math.log(0)
        const probability = 1 - (Math.log(delta + 1) / Math.log((this.max - this.min) / 2 + 1));

        // Get a random number between 0 and 1
        const random = Math.random();

        // If the random number is less than the probability, then go in the opposite direction
        // If in upper half and random < probability, go down (subtract), otherwise go up (add)
        // If in lower half and random < probability, go up (add), otherwise go down (subtract)
        ; // You can modify this to control the amount of change
        if ((upperHalf && random < probability) || (!upperHalf && random >= probability)) {
            this.current -= Math.random();
        } else {
            this.current += Math.random();
        }

        // Ensure current stays within min and max
        this.current = Math.min(Math.max(this.current, this.min), this.max);

        return this.current;
    }
}
const RMT = new TrendTracker(5, 2, 10);
const MFG = new TrendTracker(75, 50, 100);
const TRN = new TrendTracker(25, 10, 50);
const OPS = new TrendTracker(100, 50, 100);
const USG = new TrendTracker(50, 25, 75);
const WST = new TrendTracker(25, 10, 50);


RBuff = new dataBuffer(10);
MBuff = new dataBuffer(10);
TBuff = new dataBuffer(10);
OBuff = new dataBuffer(10);
UBuff = new dataBuffer(10);
WBuff = new dataBuffer(10);


const leaderboard =
[
    [
      {"name": "SOLACE", "score": 100},
      {"name": "Kinaxis", "score": 95},
      {"name": "ROSS Video", "score": 90},
      {"name": "Mitel", "score": 85},
      {"name": "NOKIA", "score": 80},
      {"name": "Ericcson", "score": 75},
      {"name": "DELL", "score": 70},
      {"name": "QNX", "score": 65},
      {"name": "Amazon", "score": 60},
      {"name": "MICROSOFT", "score": 55}
    ],
    [
      {"name": "SOLACE", "score": 98},
      {"name": "Kinaxis", "score": 92},
      {"name": "ROSS Video", "score": 94},
      {"name": "Mitel", "score": 88},
      {"name": "NOKIA", "score": 82},
      {"name": "Ericcson", "score": 76},
      {"name": "DELL", "score": 72},
      {"name": "QNX", "score": 68},
      {"name": "Amazon", "score": 64},
      {"name": "SOLACE0", "score": 58}
    ],
    [
      {"name": "SOLACE", "score": 97},
      {"name": "Kinaxis", "score": 93},
      {"name": "ROSS Video", "score": 91},
      {"name": "Mitel", "score": 89},
      {"name": "NOKIA", "score": 84},
      {"name": "Ericcson", "score": 78},
      {"name": "DELL", "score": 74},
      {"name": "QNX", "score": 69},
      {"name": "Amazon", "score": 66},
      {"name": "Microsoft", "score": 59}
    ],
    [
      {"name": "SOLACE", "score": 96},
      {"name": "Kinaxis", "score": 91},
      {"name": "ROSS Video", "score": 92},
      {"name": "Mitel", "score": 87},
      {"name": "NOKIA", "score": 83},
      {"name": "Ericcson", "score": 79},
      {"name": "DELL", "score": 73},
      {"name": "QNX", "score": 70},
      {"name": "Amazon", "score": 67},
      {"name": "Microsoft", "score": 60}
    ],
    [
      {"name": "SOLACE", "score": 95},
      {"name": "Kinaxis", "score": 90},
      {"name": "ROSS Video", "score": 93},
      {"name": "Mitel", "score": 86},
      {"name": "NOKIA", "score": 81},
      {"name": "Ericcson", "score": 77},
      {"name": "DELL", "score": 75},
      {"name": "QNX", "score": 71},
      {"name": "Amazon", "score": 65},
      {"name": "Microsoft", "score": 61}
    ],
    [
      {"name": "SOLACE", "score": 94},
      {"name": "Kinaxis", "score": 89},
      {"name": "ROSS Video", "score": 92},
      {"name": "Mitel", "score": 85},
      {"name": "NOKIA", "score": 80},
      {"name": "Ericcson", "score": 76},
      {"name": "DELL", "score": 74},
      {"name": "QNX", "score": 72},
      {"name": "Amazon", "score": 64},
      {"name": "Microsoft", "score": 62}
    ],
    [
      {"name": "SOLACE", "score": 93},
      {"name": "Kinaxis", "score": 88},
      {"name": "ROSS Video", "score": 91},
      {"name": "Mitel", "score": 84},
      {"name": "NOKIA", "score": 79},
      {"name": "Ericcson", "score": 75},
      {"name": "DELL", "score": 73},
      {"name": "QNX", "score": 71},
      {"name": "Amazon", "score": 63},
      {"name": "Microsoft", "score": 63}
    ],
    [
      {"name": "SOLACE", "score": 92},
      {"name": "Kinaxis", "score": 87},
      {"name": "ROSS Video", "score": 90},
      {"name": "Mitel", "score": 83},
      {"name": "NOKIA", "score": 78},
      {"name": "Ericcson", "score": 74},
      {"name": "DELL", "score": 72},
      {"name": "QNX", "score": 70},
      {"name": "Amazon", "score": 62},
      {"name": "Microsoft", "score": 64}
    ],
    [
      {"name": "SOLACE", "score": 91},
      {"name": "Kinaxis", "score": 86},
      {"name": "ROSS Video", "score": 89},
      {"name": "Mitel", "score": 82},
      {"name": "NOKIA", "score": 77},
      {"name": "Ericcson", "score": 73},
      {"name": "DELL", "score": 71},
      {"name": "QNX", "score": 69},
      {"name": "Amazon", "score": 61},
      {"name": "Microsoft", "score": 65}
    ]
]

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



    const getTrend = (current, min, max) => {
        // Is it in the upper half of the range?
        const upperHalf = current > ((max - min) / 2) + min;
        
        // If so then it's more likely to go down, based on the delta
        const delta = upperHalf ? max - current : current - min;
        
        // Logarithmic probability: approaches 100% as delta approaches 0
        // Adding 1 to avoid Math.log(0)
        const probability = 1 - (Math.log(delta + 1) / Math.log((max - min) / 2 + 1));
    
        // Get a random number between 0 and 1
        const random = Math.random();
    
        // If the random number is less than the probability, then go in the opposite direction
        // If in upper half and random < probability, go down (subtract), otherwise go up (add)
        // If in lower half and random < probability, go up (add), otherwise go down (subtract)
        const change = Math.random(); // You can modify this to control the amount of change
        if ((upperHalf && random < probability) || (!upperHalf && random >= probability)) {
            
            return current - change;
        } else {
            return current + change;
        }
    };
    
    // Generate random but realistic emissions data for different stages

    publisher.generateRandomEmissions = function () {

        const data = {
            RawMineral: [],
            Manufacturing: [],
            Transportation: [],
            Operations: [],
            Usage: [],
            Waste: [],
        };
        for(let i = 0; i < 1; i++){
            data["RawMineral"].push(Math.round(RMT.getTrend()));
            data["Manufacturing"].push(Math.round(MFG.getTrend()));
            data["Transportation"].push(Math.round(TRN.getTrend()));
            data["Operations"].push(Math.round(OPS.getTrend()));
            data["Usage"].push(Math.round(USG.getTrend()));
            data["Waste"].push(Math.round(WST.getTrend()));
        }
        console.log(data);

        // const data = {
        //     RawMineral: RMT.getTrend(),
        //     Manufacturing: MFG.getTrend(),
        //     Transportation: TRN.getTrend(),
        //     Operations: OPS.getTrend(),
        //     Usage: USG.getTrend(),
        //     Waste: WST.getTrend(),
        // };
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
                const leaderboardData = JSON.stringify(leaderboard[Math.floor(Math.random() * leaderboard.length)]);
                publisher.publish(leaderboardData);
            }, 2000); // Publish every second

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
const url = config.url;
const vpn = config.vpn;
const username = config.username;
const pass = config.pass;

// create the publisher, specifying the name of the subscription topic
var publisher = new TopicPublisher(solace, 'data/leaderboard');

// publish message to Solace PubSub+ Event Broker
publisher.run(process.argv);

// Handle termination signals
process.on('SIGINT', function () {
    console.log('Caught interrupt signal');
    publisher.exit();
});
