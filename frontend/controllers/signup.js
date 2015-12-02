angular.module('MyApp')
    .controller('SignupCtrl', function ($rootScope, $scope, $location, $auth, toastr, Account) {
        $scope.signup = function () {
            $auth.signup($scope.user)
                .then(function (response) {
                    $auth.setToken(response);
                    $location.path('/');
                    toastr.info('You have successfully created a new account and have been signed-in');
                    Account.getCurrentUser().then(function (response) {
                        $rootScope.currentUser = response.data;
                    }, function (error) {
                        console.log(error);
                    });
                })
                .catch(function (response) {
                    toastr.error(response.data.message);
                });
        };
    });