/**
 * Created by C5155394 on 2015/3/4.
 */
angular.module('myApp.controllers.messagesDetail', [])
    //for message.html
    .controller('messageHeaderCtrl',
    function (myMessage, $location, $log, $timeout, $scope, ionicLoading) {

        var params = $location.search();
        var messageId = $scope.messageId = params.key;
        var component = $scope.component = params.component;
        var returnComponent = params.return;
        returnComponent = (typeof returnComponent === "undefined")
            ? "undefined" : returnComponent;

        if (returnComponent === 'E0002') {
            console.log(returnComponent + messageId);
            $scope.returnComponent = myMessage.getE0002Header(messageId);
        }
        if (typeof $scope.returnComponent !== "undefined") {
            $scope.returnComponent.$loaded()
                .then(function (data) {
                    console.log(returnComponent, data);
                });
        }

        var ctrlName = 'messageHeaderCtrl';

        $scope.$log = $log;
        $scope.syncedHeaderData = myMessage.getMessageHeader(component, messageId);

        $scope.syncedHeaderData.$watch(function (data) {
            $log.info(data, ctrlName, 'data changed!');
        });

        $scope.syncedHeaderData.$loaded()
            .then(function (data) {
                $scope.message = data;//all the data in the scope are from here.
                $scope.releaseGroupArray = $scope.message.release_group.split("||");

            })
            .then(ionicLoading.unload());


        $scope.$on('$viewContentLoaded', function () {
            ionicLoading.load('Content Loading...');
            $log.info(ctrlName, 'has loaded');
        });

        $scope.$on('$destroy', function () {
            $scope.syncedHeaderData.$destroy();
            ionicLoading.unload();
            console.log(ctrlName, 'is no longer necessary');
        });

    })

    .controller('messageItemCtrl',
    function (myMessage, $location, $timeout, $scope, ionicLoading) {
        ionicLoading.load();

        $scope.syncedItemStart = myMessage.getMessageItems($scope.$parent.component,
            $scope.$parent.messageId);

        $scope.syncedItemStart.$loaded()
            .then(ionicLoading.unload());

        $scope.isloaded = false;

        $scope.loadText = 'more items';

        $scope.loadingMore = function () {
            $scope.toLoad = true;
        };

        $scope.$watch('toLoad', function (newVal) {
            if (newVal === true) {
                $scope.loadText = 'loading';
                ionicLoading.load();
                $scope.continued = myMessage
                    .getMessageMoreItems($scope.$parent.component,
                    $scope.$parent.messageId);
                $scope.continued.$loaded()
                    .then($scope.isloaded = true)
                    .then(ionicLoading.unload());

            }
        });
    });
