function oauthConfig($httpProvider) {
    $httpProvider.interceptors.push('oauthInterceptor');
}

oauthConfig.$inject = ['$httpProvider'];