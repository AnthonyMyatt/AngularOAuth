var ngModule = angular.module('angular-oauth', [])
.config(oauthConfig)
.factory('oauthInterceptor', oauthInterceptor)
.provider('OAuth', OAuthProvider)
.provider('OAuthToken', OAuthTokenProvider);