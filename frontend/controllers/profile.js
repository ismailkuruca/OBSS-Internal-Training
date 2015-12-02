angular.module('MyApp')
    .controller('ProfileCtrl', function ($rootScope, $scope, $auth, toastr, Account, Dashboard) {
        $scope.users = [];
        $scope.selectedUser = null;


        Account.getCurrentUser().then(function (response) {
            $rootScope.currentUser = response.data;
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
                },
                function (error) {
                    console.log(error);
                });
            }
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
