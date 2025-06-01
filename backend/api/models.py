from django.db import models


class SpeechData(models.Model):
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Speech Data {self.id} - {self.text[:20]}"

