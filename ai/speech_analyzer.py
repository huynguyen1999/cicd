import whisper


class SpeechAnalyzer:
    def __init__(self):
        self.model = whisper.load_model("tiny")
        print("Whisper loaded!")

    def detect_language_from_audio(self, audio_path):
        audio = whisper.pad_or_trim(whisper.load_audio(audio_path))
        mel = whisper.log_mel_spectrogram(audio).to(self.model.device)
        _, probs = self.model.detect_language(mel)
        return max(probs, key=probs.get)

    def transcribe_from_audio(self, audio_path):
        return self.model.transcribe(audio_path)
