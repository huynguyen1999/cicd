import http.server
from http.server import SimpleHTTPRequestHandler
import tensorflow as tf
import pandas as pd
import traceback
import json
import os
import sys

MAX_FEATURES = 20000
SEQUENCE_LENGTH = 1800

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Missing fields: <script_path> <port> <model_path> <data_path>")
        sys.exit(1)
    port = int(sys.argv[1])  # Convert the command-line argument to an integer
    model_path = sys.argv[2]
    data_path = sys.argv[3]
    
    
    def init_model():
        model = tf.keras.models.load_model(model_path)
        df = pd.read_csv(data_path)
        X = df['comment_text']
        vectorizer = tf.keras.layers.TextVectorization(max_tokens=MAX_FEATURES,
                                    output_sequence_length=SEQUENCE_LENGTH,
                                    output_mode='int')
        vectorizer.adapt(X.values)
        return [model, vectorizer]
    
    model, vectorizer = init_model()
        
    class MessageAnalyzer(SimpleHTTPRequestHandler):
        def do_POST(self):
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                # Parse the incoming data as JSON
                json_data = json.loads(post_data)
                # Analyze message
                if json_data['text'] is None:
                    raise Exception('Missing text field')
                
                if model is None or vectorizer is None:
                    raise Exception('Model not initialized')
                
                input_text = vectorizer(json_data['text'])
                input_text_batch = tf.expand_dims(input_text, axis=0)
                prediction = model.predict(input_text_batch).flatten()
                
                if prediction.shape[0] != 6:
                    raise Exception('Prediction shape is incorrect')
                
                response_data = {
                    "toxic": str(prediction[0]),
                    "severe_toxic": str(prediction[1]),
                    "obscene": str(prediction[2]),
                    "threat": str(prediction[3]),
                    "insult": str(prediction[4]),
                    "identity_hate": str(prediction[5])
                }
                response_json = json.dumps(response_data)
                
                # Set response headers
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                # Send the JSON response
                self.wfile.write(response_json.encode('utf-8'))
            except Exception as e:
                # Handle JSON parsing errors
                self.send_response(400)  # Bad Request
                self.end_headers()
                self.wfile.write(f'Error parsing JSON: {e}'.encode('utf-8'))
   
    server_address = ('127.0.0.1', port)  # You can change the port as needed
    httpd = http.server.HTTPServer(server_address, MessageAnalyzer)
    try:
        print('Server is running on port ' + str(port))
        httpd.serve_forever()
    except:
        print("Caught exception: ", traceback.format_exc())
    httpd.server_close()
    print("Server stopped.")
