const { Router } = require('express');
const { uploadFile, listFiles } = require('./s3');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3'); // Importa el cliente y el comando
const path = require('path');

// Configura tu cliente de S3
const client = new S3Client({
    region: 'us-east-2', // Cambia esto a tu región
    credentials: {
        accessKeyId: process.env.AWS_PUBLIC_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

const router = Router();

router.get('/', (req, res) => res.send('hola server'));

router.post('/upload', async (req, res) => {
    try {
        const result = await uploadFile(req.files['photo']);
        res.send('archivo subido');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/archivo/:fileName', async (req, res) => {
    try {
        const fileName = req.params.fileName;

        // Obtener el archivo desde S3
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName
        });

        const result = await client.send(command);

        // Configurar el nombre del archivo para la descarga en el navegador
        res.attachment(fileName);
        
        // Enviar el archivo al cliente
        result.Body.pipe(res);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/archivos', async (req, res) => {
    try {
        const files = await listFiles();
        res.json(files);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
