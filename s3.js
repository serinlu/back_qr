require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const AWS_PUBLIC_KEY = process.env.AWS_PUBLIC_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;

const client = new S3Client({
    region: AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: AWS_PUBLIC_KEY,
        secretAccessKey: AWS_SECRET_KEY
    }
});

async function checkFileExists(bucket, key) {
    try {
        const command = new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        await client.send(command);
        return true;
    } catch (err) {
        if (err.name === 'NotFound') {
            return false;
        }
        throw err;
    }
}

async function generateUniqueFileName(bucket, originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    let fileName = originalName;
    let index = 1;

    while (await checkFileExists(bucket, fileName)) {
        fileName = `${baseName} (${index})${ext}`;
        index++;
    }

    return fileName;
}

async function uploadFile(file) {
    const fileName = await generateUniqueFileName(AWS_BUCKET_NAME, Buffer.from(file.name, 'utf-8').toString());

    const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.data,
        ContentType: file.mimetype,
        Metadata: {
            'UploadDate': new Date().toISOString() // Fecha actual como metadato
        }
    };

    const command = new PutObjectCommand(uploadParams);
    return await client.send(command);
}

async function readFile(fileName) {
    const command = new GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: fileName
    });

    const result = await client.send(command);
    const downloadPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', fileName);

    result.Body.pipe(fs.createWriteStream(downloadPath));
}

async function listFiles() {
    const listParams = {
        Bucket: AWS_BUCKET_NAME,
        Prefix: '',
    };

    const command = new ListObjectsV2Command(listParams);
    const result = await client.send(command);

    const files = result.Contents
        .filter(file => file.Key.endsWith('.pdf'))
        .map(file => ({
            name: decodeURIComponent(file.Key),
            lastModified: file.LastModified ? new Date(file.LastModified).toISOString() : null,
            size: file.Size / 1024
        }));

    return files;
}

async function deleteFile(fileName) {
    const deleteParams = {
        Bucket: AWS_BUCKET_NAME,
        Key: fileName,
    };

    const command = new DeleteObjectCommand(deleteParams);

    try {
        await client.send(command);
        console.log(`Archivo ${fileName} eliminado exitosamente.`);
        return { success: true, message: `Archivo ${fileName} eliminado.` };
    } catch (error) {
        console.error(`Error al eliminar el archivo ${fileName}:`, error);
        return { success: false, message: `Error al eliminar el archivo: ${error.message}` };
    }
}

module.exports = {
    uploadFile,
    readFile,
    listFiles,
    deleteFile
};
