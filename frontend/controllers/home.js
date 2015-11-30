angular.module('MyApp')
    .controller('HomeCtrl', function ($scope, $http, uiGmapGoogleMapApi, uiGmapIsReady, $compile, $uibModal) {
        uiGmapGoogleMapApi.then(function (maps) {
            $scope.map = { control: {}, center: { latitude: 41.0136, longitude: 28.9550 }, zoom: 15 };
            var input = /** @type {!HTMLInputElement} */(
                document.getElementById('pac-input'));

            $scope.checkIn = function (id) {
                $scope.open(id);
            };

            uiGmapIsReady.promise().then(function (maxp) {
                var map = $scope.map.control.getGMap();
                map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
                var infowindow = new google.maps.InfoWindow();
                var marker = new google.maps.Marker({
                    map: map,
                    anchorPoint: new google.maps.Point(0, -29)
                });
                var autocomplete = new google.maps.places.Autocomplete(input);
                autocomplete.bindTo('bounds', map);
                autocomplete.addListener('place_changed', function () {
                    infowindow.close();
                    marker.setVisible(false);
                    var place = autocomplete.getPlace();
                    if (!place.geometry) {
                        window.alert("Autocomplete's returned place contains no geometry");
                        return;
                    }

                    // If the place has a geometry, then present it on a map.
                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setCenter(place.geometry.location);
                        map.setZoom(17);  // Why 17? Because it looks good.
                    }
                    marker.setIcon(/** @type {google.maps.Icon} */({
                        url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(35, 35)
                    }));
                    marker.setPosition(place.geometry.location);
                    marker.setVisible(true);
                    var elem = '<div><strong>' + place.name + '</strong><br><button class="btn check-in" ng-click="checkIn(\'' + place.id + '\')">CHECK-IN</button>';
                    elem = $compile(elem)($scope);
                    infowindow.setContent(elem[0]);
                    infowindow.open(map, marker);
                });
            });

        });

        $scope.animationsEnabled = true;

        $scope.open = function (place) {

            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'partials/checkin.html',
                controller: 'ModalInstanceCtrl',
                size: 'sm',
                resolve: {
                    place: function () {
                        return place;
                    }
                }
            });

            modalInstance.result.then(function (data) {
                console.log(data);
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.toggleAnimation = function () {
            $scope.animationsEnabled = !$scope.animationsEnabled;
        };
    })
    .controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, place) {
        $scope.data = {
            id: place.id,
            name: place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };

        $scope.ok = function () {
            $uibModalInstance.close($scope.data);
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    });
;