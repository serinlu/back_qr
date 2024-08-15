require('dotenv').config()
const {S3Client, PutObjectCommand, GetObjectCommand} = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path');

const AWS_PUBLIC_KEY=process.env.AWS_PUBLIC_KEY
const AWS_SECRET_KEY=process.env.AWS_SECRET_KEY
const AWS_BUCKET_NAME=process.env.AWS_BUCKET_NAME
const AWS_BUCKET_REGION=process.env.AWS_BUCKET_REGION

const client = new S3Client({region: AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: AWS_PUBLIC_KEY,
        secretAccessKey: AWS_SECRET_KEY
    }
});

async function uploadFile(file){
    //const stream = fs.createReadStream(file.tempFilePath);
    const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Key: file.name,
        Body: file.data,
    }
    const command = new PutObjectCommand(uploadParams)
    return await client.send(command)
}

async function readFile(fileName){
    const command = new GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: fileName
    })
    
    const result = await client.send(command)
    const downloadPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', fileName);
    
    result.Body.pipe(fs.createWriteStream(downloadPath));
    //result.Body.pipe(fs.createWriteStream('../../../Downloads', fileName))
}

module.exports = {
    uploadFile,
    readFile
}