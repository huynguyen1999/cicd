import json
from flask import Flask, request, jsonify, Response
from toxicity_analyzer import ToxicityAnalyzer
from face_analyzer import FaceAnalyzer
from speech_analyzer import SpeechAnalyzer
from voice_cloner import VoiceCloner

global toxicity_analyzer
global face_recognizer
global speech_analyzer
global voice_cloner

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


@app.route("/convertVoice", methods=["POST"])
def convert_voice():
    base_speaker = request.json["base_speaker"]
    reference_speaker = request.json["reference_speaker"]
    text = request.json["text"]
    result = voice_cloner.clone_voice(base_speaker, reference_speaker, text)
    return jsonify({"success": result})


if __name__ == "__main__":
    toxicity_analyzer = ToxicityAnalyzer()
    face_recognizer = FaceAnalyzer()
    speech_analyzer = SpeechAnalyzer()
    voice_cloner = VoiceCloner()
    app.run(debug=True, host="0.0.0.0", port=8000)
