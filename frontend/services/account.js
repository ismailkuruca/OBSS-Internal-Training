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
            },
            checkIn: function (checkIn) {
???????
            },
            getCheckInList: function (latSW, lngSW, latNE, lngNE) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/getCheckInList',
                    params: {
                        latSW: latSW,
                        lngSW: lngSW,
                        latNE: latNE,
                        lngNE: lngNE
                    }
                });
            },
            saveCheckIn: function (id) {
                return $http.post(window.backendUrl + '/saveCheckIn', id);
            },
            like: function (id) {
                return $http.post(window.backendUrl + '/like', id);
            },

        }
    });