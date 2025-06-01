from django.shortcuts import render
import io
import logging
import openai
import os
from openai import OpenAI
from django.http import StreamingHttpResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import JSONParser
from .models import SpeechData
from backend.serializer import SpeechDataSerializer
from gtts import gTTS

# Configure logging
logger = logging.getLogger(__name__)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    logger.warning('OPENAI_API_KEY environment variable not set. AI features will not work.')

class SpeechDataView(APIView):
    def get(self, request):
        speech_data = SpeechData.objects.all()
        serializer = SpeechDataSerializer(speech_data, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = SpeechDataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class TextToSpeechView(APIView):
    parser_classes = [JSONParser]
    
    def post(self, request, *args, **kwargs):
        try:
            # Log the incoming request data
            logger.info(f'Received request data: {request.data}')
            logger.info(f'Request headers: {request.headers}')
            
            # Get text from request data
            text = request.data.get('text')
            if not text:
                logger.error('No text provided in request')
                return Response(
                    {'error': 'Text is required'}, 
                    status=status.HTTP_400_BAD_REQUEST,
                    content_type='application/json'
                )
            
            logger.info(f'Generating speech for text: {text[:100]}...')
            
            # Generate speech audio using gTTS
            tts = gTTS(text=text, lang='en')
            
            # Save audio to in-memory bytes buffer
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Get the audio data
            audio_data = audio_buffer.getvalue()
            
            # Create response with CORS headers
            response = HttpResponse(
                audio_data,
                content_type='audio/mpeg',
                status=status.HTTP_200_OK
            )
            
            # Set response headers
            response['Content-Length'] = len(audio_data)
            response['Content-Disposition'] = 'inline; filename="speech.mp3"'
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, X-Requested-With'
            
            logger.info(f'Successfully generated speech (size: {len(audio_data)} bytes)')
            return response
            
        except Exception as e:
            logger.error(f'Error in TextToSpeechView: {str(e)}', exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type='application/json'
            )
    
    def options(self, request, *args, **kwargs):
        response = Response(status=status.HTTP_200_OK)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response


class AIChatView(APIView):
    parser_classes = [JSONParser]
    
    def set_cors_headers(self, response):
        response['Access-Control-Allow-Origin'] = 'http://MyAccessApp.com' 
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    def post(self, request, *args, **kwargs):
        try:
            # Debug: Print current working directory and environment variables
            logger.debug(f"Current working directory: {os.getcwd()}")
            logger.debug(f"Environment variables: {os.environ}")
            
            messages = request.data.get('messages', [])
            logger.debug(f"Received messages: {messages}")
            
            if not messages:
                response = Response(
                    {'error': 'No messages provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                return self.set_cors_headers(response)

            api_key = os.getenv('OPENAI_API_KEY')
            logger.debug(f"API Key from environment: {'*' * 10}{api_key[-4:] if api_key else 'None'}")
            
            if not api_key:
                response = Response(
                    {'error': 'OpenAI API key is not configured'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                return self.set_cors_headers(response)

            try:
                # Initialize the OpenAI client with the API key
                client = OpenAI(api_key=api_key)
                
                # Make the API call using the new client format
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500
                )
                
                # Extract the message content from the response
                message_content = response.choices[0].message.content
                response = Response(
                    {'message': message_content},
                    status=status.HTTP_200_OK
                )
                return self.set_cors_headers(response)
                
            except Exception as e:
                logger.error(f'OpenAI API Error: {str(e)}')
                response = Response(
                    {'error': f'Error communicating with OpenAI: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                return self.set_cors_headers(response)
                
        except Exception as e:
            logger.error(f'Error in AIChatView: {str(e)}')
            response = Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            return self.set_cors_headers(response)
    
    def options(self, request, *args, **kwargs):
        response = Response(status=status.HTTP_200_OK)
        return self.set_cors_headers(response)
