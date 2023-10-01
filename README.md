# GreenGlimpseSocketRelayMicroService


This is to demo realtime date to a react front end. 
samplePublisher publishes data to solace 
server.js subscribes to that data and relays it the nextJS frontend via websockets.

This is a barebones implementation where the user chooses the topic to sub to on the frontend. 

To test:

node server.js

in another terminal:

node samplePublisher.js

start the next js project and navigate to: 
localhost:3000/socketTest

type in data/testIOT1 
then hit the subscribe button

go to the terminal running samplePublisher

type and message and observe it being populated on the frontend in realtime. 
