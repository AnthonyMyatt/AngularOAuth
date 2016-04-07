/**
 * angular-oauth - Angular OAuth2 Module
 * @version v1.0.0
 * @link https://github.com/AnthonyMyatt/AngularOAuth#readme
 * @license MIT
 */
(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require, exports, module);
    } else {
        root.angularOAuth = factory();
    }
})(this, function(require, exports, module) {
    var ngModule = angular.module("angular-oauth", []).config(oauthConfig).factory("oauthInterceptor", oauthInterceptor).provider("OAuth", OAuthProvider).provider("OAuthToken", OAuthTokenProvider);
    function oauthConfig($httpProvider) {
        $httpProvider.interceptors.push("oauthInterceptor");
    }
    oauthConfig.$inject = [ "$httpProvider" ];
    function oauthInterceptor($q, $rootScope, OAuthToken) {
        return {
            request: function request(config) {
                config.headers = config.headers || {};
                if (!config.headers.hasOwnProperty("Authorization") && OAuthToken.getAuthorizationHeader()) {
                    config.headers.Authorization = OAuthToken.getAuthorizationHeader();
                }
                return config;
            },
            responseError: function responseError(rejection) {
                if (400 === rejection.status && rejection.data && ("invalid_request" === rejection.data.error || "invalid_grant" === rejection.data.error)) {
                    OAuthToken.removeToken();
                    $rootScope.$emit("oauth:error", rejection);
                }
                if (401 === rejection.status && rejection.data && "invalid_token" === rejection.data.error || rejection.headers("www-authenticate") && 0 === rejection.headers("www-authenticate").indexOf("Bearer")) {
                    $rootScope.$emit("oauth:error", rejection);
                }
                return $q.reject(rejection);
            }
        };
    }
    oauthInterceptor.$inject = [ "$q", "$rootScope", "OAuthToken" ];
    var defaults = {
        baseUrl: null,
        clientId: null,
        clientSecret: null,
        grantPath: "/oauth2/token",
        revokePath: "/oauth2/revoke"
    };
    var requiredKeys = [ "baseUrl", "clientId", "grantPath", "revokePath" ];
    function OAuthProvider() {
        var config;
        this.configure = function(params) {
            if (config) {
                throw new Error("Already configured.");
            }
            if (!(params instanceof Object)) {
                throw new TypeError("Invalid argument: `config` must be an `Object`.");
            }
            config = angular.extend({}, defaults, params);
            angular.forEach(requiredKeys, function(key) {
                if (!config[key]) {
                    throw new Error("Missing parameter: " + key + ".");
                }
            });
            if ("/" === config.baseUrl.substr(-1)) {
                config.baseUrl = config.baseUrl.slice(0, -1);
            }
            if ("/" !== config.grantPath[0]) {
                config.grantPath = config.grantPath;
            }
            if ("/" !== config.revokePath[0]) {
                config.revokePath = config.revokePath;
            }
            return config;
        };
        this.$get = function($http, $httpParamSerializer, OAuthToken) {
            return new function() {
                if (!config) {
                    throw new Error("`OAuthProvider` must be configured first.");
                }
                this.isAuthenticated = function() {
                    return !!OAuthToken.getToken();
                };
                this.getAccessToken = function(data, options) {
                    data = angular.extend({
                        client_id: config.clientId,
                        grant_type: "password"
                    }, data);
                    if (null !== config.clientSecret) {
                        data.client_secret = config.clientSecret;
                    }
                    data = $httpParamSerializer(data);
                    options = angular.extend({
                        headers: {
                            Authorization: undefined,
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    }, options);
                    return $http.post(config.baseUrl + config.grantPath, data, options).then(function(response) {
                        OAuthToken.setToken(response.data);
                        return response;
                    });
                };
                this.getRefreshToken = function(data, options) {
                    data = angular.extend({
                        client_id: config.clientId,
                        grant_type: "refresh_token",
                        refresh_token: OAuthToken.getRefreshToken()
                    }, data);
                    if (null !== config.clientSecret) {
                        data.client_secret = config.clientSecret;
                    }
                    data = $httpParamSerializer(data);
                    options = angular.extend({
                        headers: {
                            Authorization: undefined,
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    }, options);
                    return $http.post(config.baseUrl + config.grantPath, data, options).then(function(response) {
                        OAuthToken.setToken(response.data);
                        return response;
                    });
                };
                this.revokeToken = function(data, options) {
                    var refreshToken = OAuthToken.getRefreshToken();
                    data = angular.extend({
                        client_id: config.clientId,
                        token: refreshToken ? refreshToken : OAuthToken.getAccessToken(),
                        token_type_hint: refreshToken ? "refresh_token" : "access_token"
                    }, data);
                    if (null !== config.clientSecret) {
                        data.client_secret = config.clientSecret;
                    }
                    data = $httpParamSerializer(data);
                    options = angular.extend({
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    }, options);
                    return $http.post(config.baseUrl + config.revokePath, data, options).then(function(response) {
                        OAuthToken.removeToken();
                        return response;
                    });
                };
            }();
        };
        this.$get.$inject = [ "$http", "$httpParamSerializer", "OAuthToken" ];
    }
    function OAuthTokenProvider() {
        var config = {
            name: "token"
        };
        this.configure = function(params) {
            if (!(params instanceof Object)) {
                throw new TypeError("Invalid argument: `config` must be an `Object`.");
            }
            angular.extend(config, params);
            return config;
        };
        this.$get = function() {
            return new function() {
                this.setToken = function(data) {
                    return window.sessionStorage.setItem(config.name, angular.toJson(data));
                };
                this.getToken = function() {
                    return angular.fromJson(window.sessionStorage.getItem(config.name));
                };
                this.getAccessToken = function() {
                    return this.getToken() ? this.getToken().access_token : undefined;
                };
                this.getAuthorizationHeader = function() {
                    if (!(this.getTokenType() && this.getAccessToken())) {
                        return;
                    }
                    return this.getTokenType().charAt(0).toUpperCase() + this.getTokenType().substr(1) + " " + this.getAccessToken();
                };
                this.getRefreshToken = function() {
                    return this.getToken() ? this.getToken().refresh_token : undefined;
                };
                this.getTokenType = function() {
                    return this.getToken() ? this.getToken().token_type : undefined;
                };
                this.removeToken = function() {
                    return window.sessionStorage.removeItem(config.name);
                };
            }();
        };
    }
    return ngModule;
});