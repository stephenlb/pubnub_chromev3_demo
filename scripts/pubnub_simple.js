export const PubNub = (setup) => {
    for (let key of Object.keys(setup)) PubNub[key] = setup[key];
    return PubNub;
};

(() => {
    'use strict';

    const defaultSubkey = 'demo';
    const defaultPubkey = 'demo';
    const defaultChannel = 'pubnub';
    const defaultOrigin = 'ps.pndsn.com';
    const defaultUUID = `uuid-${+new Date()}`;

    const subscribe = PubNub.subscribe = (setup = {}) => {
        let subkey = setup.subkey || PubNub.subscribeKey || defaultSubkey;
        let channel = setup.channel || PubNub.channel || defaultChannel;
        let origin = setup.origin || PubNub.origin || defaultOrigin;
        let uuid = setup.uuid || PubNub.uuid || defaultUUID;
        let messages = setup.messages || PubNub.messages || (a => a);
        let filter = setup.filter || PubNub.filter || '';
        let authkey = setup.authkey || PubNub.authKey || '';
        let timetoken = setup.timetoken || '0';
        let filterExp = `${filter ? '&filter-expr=' : ''}${encodeURIComponent(filter)}`;
        let params = `auth=${authkey}${filterExp}&uuid=${uuid}`;
        let subscribed = true;

        // Prepare Channel List
        if (!PubNub.channels) PubNub.channels = [];
        if (PubNub.channels.indexOf(channel) == -1) {
            PubNub.channels.push(channel);
            PubNub.channels.sort();

            // Reset stream for changing subscriptions
            if (PubNub.subscription) {
                PubNub.subscription.unsubscribe();
                PubNub.subscription = null;
            }
        }
        else {
            // Already Subscribed to this channel
            return PubNub.subscription;
        }

        // Start Stream
        startStream();

        async function startStream() {
            let channels = PubNub.channels.join(',');
            let url = `https://${origin}/subscribe/${subkey}/${channels}/0/${timetoken}?${params}`;

            try {
                let response = await fetch(url);
                processMessage(await response.json());
            }
            catch(e) { continueStream(1000) }
        }

        function processMessage(jsonmsg) {
            if (!subscribed) return;
            if (jsonmsg[1]) setup.timetoken = timetoken = jsonmsg[1];

            // Send message to receivers/callbacks
            jsonmsg[0].forEach(messages);

            continueStream(10);
        }

        function continueStream(delay) {
            if (!subscribed) return;
            setTimeout(() => startStream(), delay || 1);
        }

        function subscription() { };
        subscription.messages = receiver => messages = setup.messages = receiver;
        subscription.unsubscribe = () => {
            subscribed = false;
        };

        return (PubNub.subscription = subscription);
    };

    const publish = PubNub.publish = async (setup = {}) => {
        let pubkey = setup.pubkey || PubNub.publishKey || defaultPubkey;
        let subkey = setup.subkey || PubNub.subscribeKey || defaultSubkey;
        let channel = setup.channel || PubNub.channel || defaultChannel;
        let uuid = setup.uuid || PubNub.uuid || defaultUUID;
        let origin = setup.origin || PubNub.origin || defaultOrigin;
        let authkey = setup.authkey || PubNub.authKey || '';
        let message = setup.message || 'missing-message';
        let metadata = setup.metadata || PubNub.metadata || {};
        let uri = `https://${origin}/publish/${pubkey}/${subkey}/0/${channel}/0`;
        let params = `auth=${authkey}&meta=${encodeURIComponent(JSON.stringify(metadata))}`;
        let payload = { method: 'POST', body: JSON.stringify(message) };

        try { return await fetch(`${uri}?${params}`, payload) }
        catch (e) { return false }
    };

})();
