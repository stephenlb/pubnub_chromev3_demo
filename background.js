import { PubNub } from './scripts/pubnub_simple.js';

function messages(message) {
    console.log("message on channel", message.channel);
    console.log(message);
}

PubNub({
    publishKey:   "demo",
    subscribeKey: "demo",
    authKey:      "abcd1234",
    uuid:         "myUserID",
    messages:     messages
});
console.log(PubNub);

/// Application startup
chrome.runtime.onInstalled.addListener(function (object) {
    PubNub.subscribe({channel: "test"});

    PubNub.publish({channel: "test", message: {name: "Philipp"}});
});
