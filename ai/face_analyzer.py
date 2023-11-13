import face_recognition
import pickle
import numpy as np
from sklearn import svm
import os


class FaceAnalyzer:
    def __init__(self, model_path="./models/face_classifier.pkl"):
        if model_path is not None and os.path.exists(model_path):
            with open(model_path, "rb") as f:
                self.model = pickle.load(f)
                print("Face classifier loaded!")
        else:
            self.model = None

    """
    example data
    
    face_images = {
        "trump": [
            "./images/trump/trump1.jpg"
        ],
        "ariana":[
            "./images/ariana/ariana1.jpg"
        ],
        "putin": [
            "./images/putin/putin1.jpg"
        ],
        "biden": [
            "./images/biden/biden1.jpg"
        ]
    }
    """

    def build_model(self, data, model_save_path="./models/face_classifier.pkl"):
        encodings = []
        names = []

        for person, image_paths in data.items():
            for path in image_paths:
                face = face_recognition.load_image_file(path)
                face_bbs = face_recognition.face_locations(face)
                if len(face_bbs) != 1:
                    print(f"Can't analyze image at path {path} of {person}")
                    continue
                face_encoding = face_recognition.face_encodings(face)[0]
                encodings.append(face_encoding)
                names.append(person)
        self.model = svm.SVC(gamma="scale")
        self.model.fit(encodings, names)
        if model_save_path is not None:
            with open(model_save_path, "wb") as f:
                pickle.dump(self.model, f)

    def extract_face_features(self, image_path):
        face = face_recognition.load_image_file(image_path)
        face_bbs = face_recognition.face_locations(face)
        if len(face_bbs) != 1:
            raise Exception("Face not found or multiple faces found")
        face_features = face_recognition.face_encodings(face)[0]
        return list(face_features)

    def recognize_faces(self, image_path):
        if self.model is None:
            raise Exception("Model not found")
        predictions = {}
        face = face_recognition.load_image_file(image_path)
        face_bbs = face_recognition.face_locations(face)
        if len(face_bbs) == 0:
            raise Exception("Face not found")

        face_features = face_recognition.face_encodings(
            face, known_face_locations=face_bbs
        )

        predictions = self.model.predict(face_features)
        result = []
        for face_bbs, face_feature, prediction in zip(
            face_bbs, face_features, predictions
        ):
            top, right, bottom, left = face_bbs
            result.append(
                {
                    "name": prediction,
                    "bounding_box": {
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                        "left": left,
                    },
                    "face_features": list(face_feature),
                }
            )
        return result

    def compare_face_to_face(self, target_encoding, source_encoding):
        is_identical = face_recognition.compare_faces(
            [np.array(target_encoding)], np.array(source_encoding)
        )[0]
        return {"is_identical": bool(is_identical)}
