angular.module('MyApp')
    .factory('Account', function ($http) {
        return {
            getProfile: function () {
                return $http.get(window.backendUrl + '/api/me');
            },
            getCurrentUser: function () {
                return $http.get(window.backendUrl + '/api/me');
            },
            updateProfile: function (profileData) {
                return $http.put(window.backendUrl + '/api/me', profileData);
            },
            getUserList: function () {
                return $http.get(window.backendUrl + '/getUsers');
            }
        };
    })
    .factory('Dashboard', function ($http) {
        return {
            searchFriend: function (query) {
                return $http.post(window.backendUrl + '/searchFriend', query);
            },
            addFriend: function (id) {
                return $http({
                    method: 'POST',
                    data: {
                        id: id
                    },
                    url: window.backendUrl + '/addFriend',
                });
            },
            checkIn: function (checkIn) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/checkIn',
                    data: {
                        id: checkIn.id,
                        placeName: checkIn.name,
                        lat: checkIn.lat,
                        lng: checkIn.lng,
                        comment: checkIn.comment
                    }
                });
            },
            getCheckInList: function (latSW, lngSW, latNE, lngNE) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/getCheckInList',
                    data: {
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
            }

        }
    });