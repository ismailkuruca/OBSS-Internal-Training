angular.module('MyApp')
    .factory('Account', function ($http) {
        return {
            getProfile: function () {
                return $http.get(window.backendUrl + '/api/me');
            },
            updateProfile: function (profileData) {
                return $http.put(window.backendUrl + '/api/me', profileData);
            }
        };
    })
    .factory('Dashboard', function ($http) {
        return {
            searchFriend: function (query) {
                return $http.post(window.backendUrl + '/searchFriend', query);
            },
            addFriend: function (email) {
                return $http.post(window.backendUrl + '/addFriend', email);
            }
        }
    });