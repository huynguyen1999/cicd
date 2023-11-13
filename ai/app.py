import json
from flask import Flask, request, jsonify, Response
from toxicity_analyzer import ToxicityAnalyzer
from face_analyzer import FaceAnalyzer
from speech_analyzer import SpeechAnalyzer

global toxicity_analyzer
global face_recognizer
global speech_analyzer

app = Flask(__name__)


@app.route("/toxicity", methods=["POST"])
def analyze_toxicity():
    text = request.json["text"]
    analysis = toxicity_analyzer.analyze_message(text)
    return jsonify(analysis)


@app.route("/extractFaceFeatures", methods=["POST"])
def extract_face_features():
    path = request.json["path"]
    result = face_recognizer.extract_face_features(path)
    return Response(json.dumps({"data": result}), mimetype="application/json")


@app.route("/recognizeFacesWithClassifier", methods=["POST"])
def recognize_faces_with_classifier():
    path = request.json["path"]
    result = face_recognizer.recognize_faces(path)
    return Response(json.dumps({"data": result}), mimetype="application/json")


@app.route("/compareFaceToFace", methods=["POST"])
def compare_face_to_face():
    target_encoding = request.json["target_encoding"]
    source_encoding = request.json["source_encoding"]
    result = face_recognizer.compare_face_to_face(target_encoding, source_encoding)
    return Response(json.dumps({"data": result}), mimetype="application/json")


@app.route("/buildFaceClassifier", methods=["POST"])
def build_face_classifier():
    data = request.json["data"]
    if data is None:
        return jsonify({"success": False, "error": "No data provided"})
    face_recognizer.build_model(data)
    return jsonify({"success": True})


@app.route("/transcribeAudio", methods=["POST"])
def transcribe_audio():
    path = request.json["path"]
    if path is None:
        return jsonify({"success": False, "error": "No path provided"})
    text = speech_analyzer.transcribe_from_audio(path)
    return jsonify({"success": True, "data": text})


@app.route("/detectLanguageFromAudio", methods=["POST"])
def detect_language():
    path = request.json["path"]
    if path is None:
        return jsonify({"success": False, "error": "No path provided"})
    language = speech_analyzer.detect_language_from_audio(path)
    return jsonify({"success": True, "data": {"language": language}})


if __name__ == "__main__":
    toxicity_analyzer = ToxicityAnalyzer()
    face_recognizer = FaceAnalyzer()
    speech_analyzer = SpeechAnalyzer()
    app.run(debug=True, port=8000)
