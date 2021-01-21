require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');
const stream = require('stream');
const pipeline = stream.pipeline;

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET,
});
const s3 = new AWS.S3();

/**
 * Returns the database url
 * @returns {string}
 */
const getDBURI = () => {
  return process.env.MONGO_URL;
};

//converts each db record to ndjson => newline delimited json
let convertToJSON = (data) => {
  return JSON.stringify(data) + '\n';
};

const uploadDataToS3 = (Key) => {
  let pass = new stream.PassThrough();
  const params = {
    ACL: 'public-read',
    Bucket: process.env.BUCKET_NAME,
    Body: pass,
    Key,
  };
  let opts = { queueSize: 2, partSize: 1024 * 1024 * 10 };

  s3.upload(params, opts, (err, data) => {
    if (err) {
      return console.error(err);
    }
    return console.log(`Successfully uploaded ${Key}`);
  });

  return pass;
};

const copyData = (event, context, callback) => {
  console.log('Connecting to the database');
  MongoClient.connect(getDBURI(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then((dbConnection) => {
    const db = dbConnection.db(process.env.DB_NAME);

    db.listCollections().toArray(function (err, items) {
      if (err) throw err;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const key = `${process.env.DB_NAME}/${item.name}.dmp`;
        pipeline(
          db
            .collection(item.name)
            .aggregate([])
            .stream({ transform: (x) => convertToJSON(x) }),
          uploadDataToS3(key),
          (err) => {
            if (err) {
              console.log('Pipeline failed.', err);
            } else {
              console.log('Pipeline succeeded.');
            }
          },
        );
      }
    });
  });
};

module.exports = {
  copyData,
};
