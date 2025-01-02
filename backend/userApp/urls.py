from django.urls import path


from .views import (
    UserPaymentView,
    UserRegisterView,
    LogoutView,
    UserProfileView,
    UpdateAllUsersView,
    FetchDecodedTokenView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
     SendResetCodeView,
    VerifyResetCodeView,
    ResetPasswordView,
)

urlpatterns = [
    
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('payment/', UserPaymentView.as_view(), name='user-payment'),
    path('users/', UpdateAllUsersView.as_view(), name='update-all-users'),
    path('fetchdecodedtoken/', FetchDecodedTokenView.as_view(), name='fetch-decoded-token'),
    path('send_reset_code/', SendResetCodeView.as_view(), name='send_reset_code'),
    path('verify_reset_code/', VerifyResetCodeView.as_view(), name='verify_reset_code'),
    path('reset_password/', ResetPasswordView.as_view(), name='reset_password'),
]