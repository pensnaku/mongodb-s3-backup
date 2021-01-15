# mongodb-s3-backup

Backs up all collections in a mongodb database to s3 bucket.

Can work on a regular server, but ideally for use with AWS Lambda functions.

Streams the data directly to s3 as opposed to writing to disk first. This ensures proper memory usage and also is a lot faster.


# steps
  - Copy .env.example file into .env
  - Provide all necessary environment variables
  - run `npm install`
  - Set index.copyData() as entry point for lambda function
  - Trigger function and your specified db should be backed up in s3 in this format `<bucket_name>/<database_name>/<collection_name>.dmp`
