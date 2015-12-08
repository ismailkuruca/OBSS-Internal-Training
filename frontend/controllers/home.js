angular.module('MyApp')
    .controller('HomeCtrl', function ($scope, $rootScope, $auth, uiGmapGoogleMapApi, uiGmapIsReady, $compile, $uibModal, Dashboard, Account, toastr, Map) {
        $scope.boundsChangedEvent = null;
        $scope.placeMap = {};
        $scope.markers = [];
        $scope.handleBoundsChanged = function (obj) {
            clearTimeout($scope.boundsChangedEvent);
            $scope.boundsChangedEvent = setTimeout(function () {
                console.log(obj);
                Dashboard.getCheckInList(
                    obj.getBounds().getSouthWest().lat(),
                    obj.getBounds().getSouthWest().lng(),
                    obj.getBounds().getNorthEast().lat(),
                    obj.getBounds().getNorthEast().lng())
                    .then(function (response) {
                        console.log("CheckinList", response);
                        $scope.checkInList = response.data;

                        if (!$rootScope.currentUser) {
                            Account.getCurrentUser().then(function (response) {
                                $rootScope.currentUser = response.data;
                                $scope.processResponse();
                            });
                        } else {
                            $scope.processResponse();
                        }
                    }, function (error) {
                        //Error Handling
                    });
            }, 500);
        };

        $scope.processResponse = function () {
            var list = $scope.checkInList;
            var savedList = $rootScope.currentUser.saved;
            //$scope.markers = [];
            //$scope.markers.push({
            //    id: 0,
            //    coords: $rootScope.position,
            //    icon: '//developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
            //});
            for (var i = 0; i < list.length; i++) {
                $scope.markers.push({
                    id: list[i].placeId,
                    coords: {
                        latitude: list[i].lat,
                        longitude: list[i].lng
                    }
                });
                for (var j = 0; j < list[i].likes.length; j++) {
                    if (list[i].likes[j] == $rootScope.currentUser.email) {
                        list[i].liked = true;
                    }
                }
                for (var j = 0; j < savedList.length; j++) {
                    if (list[i]._id == savedList[j]) {
                        list[i].saved = true;
                    }
                }
            }
            console.log($scope.checkInList);
            console.log($rootScope.currentUser.saved);
        };

        uiGmapGoogleMapApi.then(function (maps) {
            $scope.map = {
                control: {}, center: {latitude: 41.0136, longitude: 28.9550}, zoom: 15, markers: $scope.markers,
                events: {
                    bounds_changed: function (a) {
                        $scope.handleBoundsChanged(a);
                    }
                }
            };
            var input = /** @type {!HTMLInputElement} */(
                document.getElementById('pac-input'));

            $scope.checkIn = function (id) {
                $scope.open(id);
            };

            $scope.acquireLocation = function () {
                Map.getLocation().then(function (response) {
                    $rootScope.position = response.coords;
                    //toastr.success('New Location: ' + response.coords.latitude + " " + response.coords.longitude);
                    for (var i = 0; i < $scope.markers.length; i++) {
                        if ($scope.markers[i].myLocation) {
                            $scope.markers.splice(i, 1);
                            break;
                        }
                    }
                    $scope.markers.push({
                        id: 0,
                        coords: $rootScope.position,
                        icon: '//developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
                    });
                }, function (error) {
                    toastr.error('Couldn\'t acquire location. Application behavior might be unstable!');
                });
            };
            $scope.acquireLocation();

            uiGmapIsReady.promise().then(function (maxp) {
                var map = $scope.map.control.getGMap();
                map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
                var infowindow = new google.maps.InfoWindow();
                var marker = new google.maps.Marker({
                    map: map,
                    anchorPoint: new google.maps.Point(0, -29)
                });

                $scope.directionsService = new google.maps.DirectionsService;
                $scope.directionsDisplay = new google.maps.DirectionsRenderer;
                $scope.directionsDisplay.setMap(map);

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
                    $scope.placeMap[place.id] = place;
                    var elem = '<div><strong>' + place.name + '</strong><br><button class="btn check-in" ng-click="checkIn(\'' + place.id + '\')">CHECK-IN</button>';
                    elem = $compile(elem)($scope);
                    infowindow.setContent(elem[0]);
                    infowindow.open(map, marker);
                });
            });

        });

        $scope.like = function (id) {
            var list = $scope.checkInList;
            for (var i = 0; i < list.length; i++) {
                var elem = list[i];
                if (elem._id == id) {
                    Dashboard.likeCheckIn(id).then(function (success) {
                        if (elem.liked) {
                            elem.liked = false;
                        } else {
                            elem.liked = true;
                        }
                    }, function (error) {
                        console.log(error);
                    });
                    break;
                }
            }
        };

        $scope.save = function (id) {
            var list = $scope.checkInList;
            for (var i = 0; i < list.length; i++) {
                var elem = list[i];
                if (elem._id == id) {
                    Dashboard.saveCheckIn(id).then(function (success) {
                        if (elem.saved) {
                            elem.saved = false;
                        } else {
                            elem.saved = true;
                        }
                    }, function (error) {
                        console.log(error);
                    });
                    break;
                }
            }
        };

        $scope.onMarkerClicked = function (obj) {
            $scope.directionsService.route({
                origin: new google.maps.LatLng($rootScope.position.latitude, $rootScope.position.longitude),
                destination: new google.maps.LatLng(obj.coords.latitude, obj.coords.longitude),
                travelMode: google.maps.TravelMode.DRIVING
            }, function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    $scope.directionsDisplay.setDirections(response);
                } else {
                    toastr.error('Directions request failed due to ' + status);
                }
            });
        };

        $scope.animationsEnabled = true;

        $scope.isAuthenticated = function () {
            return $auth.isAuthenticated();
        };

        $rootScope.$watch('openSaved', function (newVal, oldVal) {
            if (newVal) {
                $rootScope.openSaved = false;
                Dashboard.getSavedList().then(function (response) {
                    $rootScope.currentUser.savedCheckins = response.data;
                    $scope.openSavedModal();
                });

            }
        });

        $scope.openSavedModal = function () {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'partials/saved.html',
                controller: 'SavedModalInstanceCtrl',
                size: 'md',
                resolve: {
                    place: function () {
                    }
                }
            });
            modalInstance.result.then(function (data) {
                $scope.onMarkerClicked(data);
            });
        };


        $scope.open = function (place) {

            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'partials/checkin.html',
                controller: 'ModalInstanceCtrl',
                size: 'sm',
                resolve: {
                    place: function () {
                        return $scope.placeMap[place];
                    }
                }
            });

            modalInstance.result.then(function (data) {
                Dashboard.checkIn(data).then(function (response) {
                    console.log(response);
                }, function (error) {
                    // ERROR Handling
                });
            }, function () {
            });
        };

        $scope.toggleAnimation = function () {
            $scope.animationsEnabled = !$scope.animationsEnabled;
        };
    })
    .controller('SavedModalInstanceCtrl', function ($scope, $uibModalInstance) {
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.returnData = function (data) {
            data.coords = {
                latitude: data.lat,
                longitude: data.lng
            };
            $uibModalInstance.close(data);
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
    })
;