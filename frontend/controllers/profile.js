angular.module('MyApp')
    .controller('ProfileCtrl', function ($rootScope, $scope, $auth, toastr, Account, Dashboard) {
        $scope.users = [];
        $scope.selectedUser = null;
        $scope.photo;

        Account.getCurrentUser().then(function (response) {
            $rootScope.currentUser = response.data;
            Account.getFriendList().then(function (response) {
                $rootScope.currentUser.friends = response.data;
            });
        }, function (error) {
            console.log(error);
        });
        Account.getUserList().then(function (response) {
            $scope.users = response.data;
            console.log($scope.users);
        }, function (error) {
            console.log(error);
        });

        $scope.addFriend = function () {
            if ($scope.selectedUser) {
                Dashboard.addFriend($scope.selectedUser._id).then(function (response) {
                        $rootScope.currentUser = response.data;
                        Account.getFriendList().then(function (response) {
                            $rootScope.currentUser.friends = response.data;
                        });
                    },
                    function (error) {
                        console.log(error);
                    });
            }
        };

        $scope.triggerUpload = function () {
            document.getElementById('photos').click();
            console.log("trig");
        };

        $scope.uploadPhoto = function () {
            var fr = new FileReader();
            var file = document.getElementById('photos').files[0];
            fr.onloadend = function () {
                var result = fr.result;
                Account.uploadPhoto(result).then(function (response) {
                    document.getElementById('avatar').src = result;
                    toastr.success('Profile picture has been updated');
                }, function (error) {
                    console.log(error);
                })
            };

            fr.readAsDataURL(file);
        };

        $scope.getProfile = function () {
            Account.getProfile()
                .then(function (response) {
                    $scope.user = response.data;
                })
                .catch(function (response) {
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.updateProfile = function () {
            Account.updateProfile($scope.user)
                .then(function () {
                    toastr.success('Profile has been updated');
                })
                .catch(function (response) {
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.link = function (provider) {
            $auth.link(provider)
                .then(function () {
                    toastr.success('You have successfully linked a ' + provider + ' account');
                    $scope.getProfile();
                })
                .catch(function (response) {
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.unlink = function (provider) {
            $auth.unlink(provider)
                .then(function () {
                    toastr.info('You have unlinked a ' + provider + ' account');
                    $scope.getProfile();
                })
                .catch(function (response) {
                    toastr.error(response.data ? response.data.message : 'Could not unlink ' + provider + ' account', response.status);
                });
        };

        $scope.getProfile();
    });
