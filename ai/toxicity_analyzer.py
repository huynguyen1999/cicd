import tensorflow as tf
from tensorflow.keras.layers import TextVectorization
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Bidirectional, Dense, Embedding
import pandas as pd


MAX_FEATURES = 20000
SEQUENCE_LENGTH = 1800

class ToxicityAnalyzer:
    def __init__(self, model_path='./models/toxicity.h5', data_path='./data/toxicity.csv'):
        self.model = tf.keras.models.load_model(model_path)
        self.data = pd.read_csv(data_path)
        self.vectorizer = TextVectorization(max_tokens=MAX_FEATURES,
                                    output_sequence_length=SEQUENCE_LENGTH,
                                    output_mode='int')
        self.vectorizer.adapt(self.data['comment_text'].values)
        
    def build_model(self, model_save_path=None):
        X = self.data['comment_text']
        y = self.data[self.data.columns[2:]].values
        vectorizer = TextVectorization(max_tokens=MAX_FEATURES,
                                    output_sequence_length=1800,
                                    output_mode='int')
        vectorizer.adapt(X.values)
        vectorized_text = vectorizer(X.values)
        dataset = tf.data.Dataset.from_tensor_slices((vectorized_text, y))
        dataset = dataset.cache()
        dataset = dataset.shuffle(160000)
        dataset = dataset.batch(32)
        dataset = dataset.prefetch(8) # helps bottlenecks
        # split dataset
        train = dataset.take(int(len(dataset)*.7))
        val = dataset.skip(int(len(dataset)*.7)).take(int(len(dataset)*.2))
        test = dataset.skip(int(len(dataset)*.9)).take(int(len(dataset)*.1))
        model = Sequential()
        # Create the embedding layer 
        model.add(Embedding(MAX_FEATURES+1, 32))
        # Bidirectional LSTM Layer
        model.add(Bidirectional(LSTM(32, activation='tanh')))
        # Feature extractor Fully connected layers
        model.add(Dense(128, activation='relu'))
        model.add(Dense(256, activation='relu'))
        model.add(Dense(128, activation='relu'))
        # Final layer 
        model.add(Dense(6, activation='sigmoid'))
        model.compile(loss='BinaryCrossentropy', optimizer='Adam')
        model.fit(train, epochs=1, validation_data=val)
        self.model = model
        if model_save_path is not None:
            model.save(model_save_path)
        return self
            
    def analyze_message(self, text):
        vectorized_text = self.vectorizer(text)
        vectorized_text_batch = tf.expand_dims(vectorized_text, axis=0)
        prediction = self.model.predict(vectorized_text_batch).flatten()
        if prediction.shape[0] != 6:
            raise Exception('Prediction shape is incorrect')
        formatted_prediction = {
            "toxic": str(prediction[0]),
            "severe_toxic": str(prediction[1]),
            "obscene": str(prediction[2]),
            "threat": str(prediction[3]),
            "insult": str(prediction[4]),
            "identity_hate": str(prediction[5])
        }
        return formatted_prediction
        
    
    