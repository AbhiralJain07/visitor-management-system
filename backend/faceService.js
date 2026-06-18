const axios = require('axios');

const FACE_SERVICE_URL = 'http://127.0.0.1:5001';

// Photo bhejo → Embedding lo
const getEmbedding = async (base64Image) => {
    const response = await axios.post(`${FACE_SERVICE_URL}/encode`, {
        image: base64Image
    });
    return response.data;
};

// 2 embeddings compare karo
const compareFaces = async (embedding1, embedding2) => {
    const response = await axios.post(`${FACE_SERVICE_URL}/compare`, {
        embedding1,
        embedding2
    });
    return response.data;
};

module.exports = { getEmbedding, compareFaces };