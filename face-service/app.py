from flask import Flask, request, jsonify
import insightface
import numpy as np
import cv2
import base64
import json

app = Flask(__name__)

# Face Recognition Model load karo
print("AI Model load ho raha hai... ⏳")
model = insightface.app.FaceAnalysis(name='buffalo_l')
model.prepare(ctx_id=-1, det_size=(640, 640))
print("AI Model ready! ✅")

# Base64 image ko numpy array mein convert karo
def decode_image(base64_string):
    img_data = base64.b64decode(base64_string)
    np_array = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    return img

# Face embedding nikalo
@app.route('/encode', methods=['POST'])
def encode_face():
    try:
        data = request.json
        img = decode_image(data['image'])
        faces = model.get(img)
        
        if len(faces) == 0:
            return jsonify({
                'success': False,
                'message': 'Koi chehra nahi mila!'
            })
        
        embedding = faces[0].embedding.tolist()
        return jsonify({
            'success': True,
            'embedding': embedding
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

# Do faces compare karo
@app.route('/compare', methods=['POST'])
def compare_faces():
    try:
        data = request.json
        embedding1 = np.array(data['embedding1'])
        embedding2 = np.array(data['embedding2'])
        
        # Cosine similarity nikalo
        similarity = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        
        match = bool(similarity > 0.5)
        
        return jsonify({
            'success': True,
            'match': match,
            'similarity': float(similarity)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

if __name__ == '__main__':
    app.run(port=5001, debug=True)