//https://github.com/firebase/angularfire-seed/blob/master/app/js/firebase.utils.js

// a simple wrapper on Firebase and AngularFire to simplify deps and keep things DRY
angular.module('firebase.utils', ['firebase', 'myApp.config'])
    .factory('fbutil', ['$window', 'FIREBASE_URL', '$firebase',
        function ($window, FBURL, $firebase) {
            "use strict";

            return {
                syncObject: function (path, factoryConfig) {
                    return syncData.apply(null, arguments).$asObject();
                },

                syncArray: function (path, factoryConfig) {
                    return syncData.apply(null, arguments).$asArray();
                },
                syncData: function (path, factoryConfig) {
                    return syncData.apply(null, arguments);
                },
                ref: firebaseRef
            };

            function pathRef(args) {
                for (var i = 0; i < args.length; i++) {
                    if (angular.isArray(args[i])) {
                        args[i] = pathRef(args[i]);
                    }
                    else if (typeof args[i] !== 'string') {
                        throw new Error('Argument ' + i + ' to firebaseRef is not a string: ' + args[i]);
                    }
                }
                return args.join('/');
            }

            /**
             * Example:
             * <code>
             *    function(firebaseRef) {
         *       var ref = firebaseRef('path/to/data');
         *    }
             * </code>
             *
             * @function
             * @name firebaseRef
             * @param {String|Array...} path relative path to the root folder in Firebase instance
             * @return a Firebase instance
             */
            function firebaseRef(path) {
                var ref = new $window.Firebase(FBURL);
                var args = Array.prototype.slice.call(arguments);
                if (args.length) {
                    ref = ref.child(pathRef(args));
                }
                return ref;
            }

            /**
             * Create a $firebase reference with just a relative path. For example:
             *
             * <code>
             * function(syncData) {
         *    // a regular $firebase ref
         *    $scope.widget = syncData('widgets/alpha');
         *
         *    // or automatic 3-way binding
         *    syncData('widgets/alpha').$bind($scope, 'widget');
         * }
             * </code>
             *
             * Props is the second param passed into $firebase. It can also contain limit, startAt, endAt,
             * and they will be applied to the ref before passing into $firebase
             *
             * @function
             * @name syncData
             * @param {String|Array...} path relative path to the root folder in Firebase instance
             * @param {object} [props]
             * @return a Firebase instance
             */
            function syncData(path, props) {
                var ref = firebaseRef(path);
                props = angular.extend({}, props);

                angular.forEach(['limit', 'startAt', 'endAt'], function (k) {
                    if (props.hasOwnProperty(k)) {

                        var v = props[k];
                        ref = ref[k].apply(ref, angular.isArray(v) ? v : [v]);
                        console.log(k, angular.isArray(v) ? v : [v]);
                        delete props[k];
                    }
                });
                return $firebase(ref, props);
            }
        }])
// a simple utility to create references to Firebase paths
    .factory('firebaseRef', ['Firebase', 'FIREBASE_URL', function (Firebase, FIREBASE_URL) {
        /**
         * @function
         * @name firebaseRef
         * @param {String|Array...} path
         * @return a Firebase instance
         */
        return function (path) {
            var ref = new Firebase(FIREBASE_URL);
            if (arguments.length) {
                ref = ref.child(pathRef([].concat(Array.prototype.slice.call(arguments))));
            }
            return ref;
        }
    }])

    // a simple utility to create $firebaseObject objects from angularFire
    .factory('syncObject', ['$firebaseObject', 'firebaseRef', function ($firebaseObject, firebaseRef) {
        /**
         * @function
         * @name syncData
         * @param {String|Array...} path
         * @param {int} [limit]
         * @return a Firebase instance
         */
        return function (path, limit) {
            var ref = firebaseRef(path);
            limit && (ref = ref.limit(limit));
            return $firebaseObject(ref);
        }
    }])
    // a simple utility to create $firebaseArray objects from angularFire
    .factory('syncArray', ['$firebaseArray', 'firebaseRef', function ($firebaseArray, firebaseRef) {
        /**
         * @function
         * @name syncData
         * @param {String|Array...} path
         * @param {int} [limit]
         * @return a Firebase instance
         */
        return function (path, limit) {
            var ref = firebaseRef(path);
            limit && (ref = ref.limit(limit));
            return $firebaseArray(ref);
        }
    }])
    .factory('syncDataSE', ['$firebase', 'firebaseRef', function ($firebase, firebaseRef) {
        /**
         * @function
         * @name syncData
         * @param {String|Array...} path
         * @param {int} [limit]
         * @param {String} startAt
         * @return a Firebase instance
         */
        return function (path, limit) {
            var ref = firebaseRef(path);
            limit && (ref = ref.endAt('q', '002').limit(limit));
            return $firebase(ref);
        }
    }])
    .factory('encodeFirebaseKey', function () {
        return function (string) {
            return (string || '').replace(/([.$\[\]#\/])/g, function (m, p1) {
                return '%' + ((p1 + '').charCodeAt(0).toString(16).toUpperCase());
            });
        };
    });

function pathRef(args) {
    for (var i = 0; i < args.length; i++) {
        if (args[i] && angular.isArray(args[i])) {
            args[i] = pathRef(args[i]);
        }
    }
    return args.join('/');
}

