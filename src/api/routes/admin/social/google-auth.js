const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(GOOGLE_CLIENT_ID, '', '');

module.exports.getGoogleUser = code => {
    return client
        .verifyIdToken({ idToken: code, audience: GOOGLE_CLIENT_ID })
        .then(login => {
            const payload = login.getPayload();

            const audience = payload.aud;
            if (audience !== GOOGLE_CLIENT_ID) {
                throw new Error(
                    'error while authenticating google user: audience mismatch: wanted [' +
                    GOOGLE_CLIENT_ID +
                    '] but was [' +
                    audience +
                    ']'
                );
            }
            return {
                name: payload['name'],
                pic: payload['picture'],
                id: payload['sub'],
                email_verified: payload['email_verified'],
                email: payload['email'],
            };
        })
        .then(user => {
            return user;
        })
        .catch(err => {
            throw new Error('error while authenticating google user: ' + JSON.stringify(err));
        });
};
