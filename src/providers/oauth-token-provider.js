function OAuthTokenProvider() {
    var config = {
        name: 'token'
    };

    /**
     * Configure.
     *
     * @param {object} params - An `object` of params to extend.
     */

    this.configure = function(params) {
        // Check if is an `object`.
        if (!(params instanceof Object)) {
            throw new TypeError('Invalid argument: `config` must be an `Object`.');
        }

        // Extend default configuration.
        angular.extend(config, params);

        return config;
    };

    /**
     * OAuthToken service.
     */

    this.$get = function() {
        return new function () {

            /**
             * Set token.
             */

            this.setToken = function (data) {
                return window.sessionStorage.setItem(config.name, angular.toJson(data));
            };

            /**
             * Get token.
             */

            this.getToken = function () {
                return angular.fromJson(window.sessionStorage.getItem(config.name));
            };

            /**
             * Get accessToken.
             */

            this.getAccessToken = function () {
                return this.getToken() ? this.getToken().access_token : undefined;
            };

            /**
             * Get authorizationHeader.
             */

            this.getAuthorizationHeader = function () {
                if (!(this.getTokenType() && this.getAccessToken())) {
                    return;
                }

                return this.getTokenType().charAt(0).toUpperCase() + this.getTokenType().substr(1) + ' ' + this.getAccessToken();
            };

            /**
             * Get refreshToken.
             */

            this.getRefreshToken = function () {
                return this.getToken() ? this.getToken().refresh_token : undefined;
            };

            /**
             * Get tokenType.
             */

            this.getTokenType = function () {
                return this.getToken() ? this.getToken().token_type : undefined;
            };

            /**
             * Remove token.
             */

            this.removeToken = function () {
                return window.sessionStorage.removeItem(config.name);
            };
        };
    };
}