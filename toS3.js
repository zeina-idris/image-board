const knox = require('knox');
let secrets;
if (process.env.NODE_ENV == 'production') {
    secrets = process.env; // in prod the secrets are environment variables
} else {
    secrets = require('./secrets'); // secrets.json is in .gitignore
}
const client = knox.createClient({
    key: secrets.awsKey,
    secret: secrets.awsSecret,
    bucket: 'spicedling'
});

function sendToS3(fileObj) {
    return new Promise((resolve, reject) => {
        const s3Request = client.put(fileObj.filename, {
            'Content-Type': fileObj.mimetype,
            'Content-Length': fileObj.size,
            'x-amz-acl': 'public-read'
        });
        const fs = require('fs');
        const readStream = fs.createReadStream(fileObj.path);
        readStream.pipe(s3Request);

        s3Request.on('response', s3Response => {
            const wasSuccessful = s3Response.statusCode == 200;
            if (wasSuccessful) {
                resolve()
            } else {
                reject()
            }
        });
    });
}

module.exports.toS3 = sendToS3;
