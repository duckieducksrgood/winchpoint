# users/views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import User
from .serializers import UserSerializer
import datetime
import jwt
from rest_framework.exceptions import AuthenticationFailed 
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
import random
from rest_framework_simplejwt.tokens import RefreshToken


class UserPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        user = request.user
        user.is_paid = True
        user.save()
        return Response({'message': 'Payment successful'}, status=status.HTTP_200_OK)

class UserRegisterView(APIView):
    def post(self, request, format=None):
        serializer = UserSerializer(data=request.data)  # Use the serializer to validate and save user data
        if serializer.is_valid():
            user = serializer.save()  # Save the new user
            print(user)
            return Response({
                "user": serializer.data,
                "message": "User registered successfully."
            }, status=status.HTTP_201_CREATED)
            
        # Extract and format the error messages
        error_messages = []
        for field, errors in serializer.errors.items():
            for error in errors:
                error_messages.append(error)
                
        return Response({"message": error_messages}, status=status.HTTP_400_BAD_REQUEST)
    

class LogoutView(APIView):
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt_access_token')
        response.delete_cookie('jwt_refresh_token')
        response.data = {
            'message': 'Logout successful'
        }
        return response
    

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        user = request.user  # Get the currently authenticated user
        serializer = UserSerializer(user)  # Serialize the user data
        return Response(serializer.data)

    def put(self, request, format=None):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)  # Enable partial updates
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendResetCodeView(APIView):
    def post(self, request, format=None):
        email = request.data.get('email')
        if not email:
            return Response({'message': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        reset_code = random.randint(1000, 9999)
        user.reset_code = reset_code
        user.save()
        
        send_mail(
            'Password Reset Code',
            f'Your password reset code is {reset_code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        return Response({'message': 'Reset code sent to email'}, status=status.HTTP_200_OK)

class VerifyResetCodeView(APIView):
    def post(self, request, format=None):
        email = request.data.get('email')
        reset_code = request.data.get('reset_code')
        
        if not email or not reset_code:
            return Response({'message': 'Email and reset code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email, reset_code=reset_code)
        except User.DoesNotExist:
            return Response({'message': 'Invalid reset code'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'message': 'Reset code verified'}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    def post(self, request, format=None):
        email = request.data.get('email')
        new_password = request.data.get('new_password')
        
        if not email or not new_password:
            return Response({'message': 'Email and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user.set_password(new_password)
        user.reset_code = None
        user.save()
        
        return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
    
class UpdateAllUsersView(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


    def put(self, request, format=None):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'message': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if password is in the request data
        if 'password' in request.data:
            new_password = request.data['password']
            user.set_password(new_password)  # Hash and set the new password
            user.save()
            return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, format=None):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'message': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user.delete()
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

class FetchDecodedTokenView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'message': 'Token not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            return Response(payload)
        except jwt.ExpiredSignatureError:
                return Response({'message': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenmessage:
                return Response({'message': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# JWT token views
class CustomTokenObtainPairView(TokenObtainPairView):
   def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            print(response.data)

            if 'access' in response.data:
                access_token = response.data['access']
                refresh_token = response.data['refresh']

                # Get user and role
                user = User.objects.get(username=request.data['username'])
                if not user:
                    raise AuthenticationFailed('User not found')

                payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])

                # Add user role and username to the payload
                payload['role'] = user.role
                payload['username'] = user.username

                # Encode new token with the additional info
                new_access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

                # Set cookies in response
                response.set_cookie(key='jwt_access_token', value=new_access_token, httponly=True, samesite='none', secure=True)
                response.set_cookie(key='jwt_refresh_token', value=refresh_token, httponly=True, samesite='none', secure=True)

            return response

        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({'message': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'message': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except AuthenticationFailed as e:
            return Response({'message': 'Invalid username or password!'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': 'An error occurred', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('jwt_refresh_token')
        if refresh_token is None:
            return Response({'error': 'Refresh token not found'}, status=400)

        try:
            # Decode the refresh token to access the user info
            token = RefreshToken(refresh_token)
            access_token = token.access_token

            # Decode the access token to modify the payload
            payload = jwt.decode(str(access_token), settings.SECRET_KEY, algorithms=['HS256'])

            # Get the user associated with the refresh token
            user = User.objects.get(id=payload['user_id'])

            # Add user role and username to the payload
            payload['role'] = user.role
            payload['username'] = user.username

            # Encode the new access token with the updated payload
            new_access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

            # If new_access_token is in bytes, decode it to a string
            if isinstance(new_access_token, bytes):
                new_access_token = new_access_token.decode('utf-8')

            # Return the new access token in the response and set it as a cookie
            response = Response({'access': new_access_token}, status=200)
            response.set_cookie(key='jwt_access_token', value=new_access_token, httponly=True)
            return response

        except Exception as e:
            return Response({'message': str(e)}, status=400)

