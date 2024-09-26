const { Router } = require('express');
const { uploadFile, listFiles } = require('./s3');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_PUBLIC_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

const router = Router();

router.get('/', (res) => res.send('hola server'));

router.post('/upload', async (req, res) => {
    try {
        const result = await uploadFile(req.files['photo']);
        res.send({ message: "Archivo subido", result });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/archivo/:fileName', async (req, res) => {
    try {
        const fileName = req.params.fileName;

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName
        });

        const result = await client.send(command);

        res.attachment(fileName);

        result.Body.pipe(res);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/archivos', async (res) => {
    try {
        const files = await listFiles();
        res.json(files);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.delete('/archivo/:fileName', async (req, res) => {
    try {
        const fileName = req.params.fileName;

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
        });

        await client.send(command);

        res.json({ message: `Archivo ${fileName} eliminado exitosamente.` });
    } catch (error) {
        res.status(500).send({ message: `Error al eliminar el archivo: ${error.message}` });
    }
});

module.exports = router;
