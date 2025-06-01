from rest_framework import serializers
from api.models import SpeechData

class SpeechDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeechData
        fields = '__all__'
