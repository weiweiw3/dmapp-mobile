//https://github.com/firebase/angularfire-seed/blob/master/app/js/simpleLogin.js
//已经更新$firebaseAuth

angular.module('firebase.simpleLogin', ['firebase', 'firebase.utils', 'changeEmail'])

    // a simple wrapper on simpleLogin.getUser() that rejects the promise
    // if the user does not exists (i.e. makes user required)
    .factory('requireUser', ['simpleLogin', '$q', function (simpleLogin, $q) {
        return function () {
            return simpleLogin.getUser().then(function (user) {
                return user ? user : $q.reject({ authRequired: true });
            });
        }
    }])

/**
 * A utility to store variables in local storage, with a fallback to cookies if localStorage isn't supported.
 */
    .factory('localStorage', ['$log', function ($log) {
        //todo should handle booleans and integers more intelligently?
        var loc = {
            /**
             * @param {string} key
             * @param value  objects are converted to json strings, undefined is converted to null (removed)
             * @returns {localStorage}
             */
            set: function (key, value) {
//               $log.debug('localStorage.set', key, value);
                var undefined;
                if (value === undefined || value === null) {
                    // storing a null value returns "null" (a string) when get is called later
                    // so to make it actually null, just remove it, which returns null
                    loc.remove(key);
                }
                else {
                    value = angular.toJson(value);
                    if (typeof(localStorage) === 'undefined') {
                        cookie(key, value);
                    }
                    else {
                        localStorage.setItem(key, value);
                    }
                }
                return loc;
            },
            /**
             * @param {string} key
             * @returns {*} the value or null if not found
             */
            get: function (key) {
                var v = null;
                if (typeof(localStorage) === 'undefined') {
                    v = cookie(key);
                }
                else {
                    //todo should reconstitute json values upon retrieval
                    v = localStorage.getItem(key);
                }
                return angular.fromJson(v);
            },
            /**
             * @param {string} key
             * @returns {localStorage}
             */
            remove: function (key) {
                if (typeof(localStorage) === 'undefined') {
                    cookie(key, null);
                }
                else {
                    localStorage.removeItem(key);
                }
                return loc;
            }
        };

        //debug just a temporary tool for debugging and testing
        angular.resetLocalStorage = function () {
            $log.info('resetting localStorage values');
            _.each(['authUser', 'sortBy'], loc.remove);
        };

        return loc;
    }])

//    .factory('simpleLogin', ['$firebaseAuth', 'fbutil', '$q', '$rootScope','authScopeUtil',
//        function ($firebaseAuth, fbutil, $q, $rootScope,authScopeUtil) {

    .factory('simpleLogin', ['$firebaseAuth', 'fbutil', 'createProfile', 'changeEmail',
        function ($firebaseAuth, fbutil, createProfile, changeEmail) {

            var auth = $firebaseAuth(fbutil.ref());

            var listeners = [];

            function statusChange() {
//                fns.getUser().then(function (user) {
//                    fns.user = user || null;
//                    angular.forEach(listeners, function (fn) {
//                        fn(user || null);
//                    });
//                });

                fns.user = auth.$getAuth();
                angular.forEach(listeners, function (fn) {
                    fn(fns.user);
                });
            }

            var fns = {
                auth: auth,

                user: null,

                getUser: function () {

//                    return auth.$getCurrentUser();
                    return auth.$waitForAuth();
                },

                /**
                 * @param {string} email
                 * @param {string} pass
                 * @returns {*}
                 */
                login: function (email, pass) {
//                    return auth.$login('password', {
//                        email: email,
//                        password: pass,
//                        rememberMe: true
//                    });
//
                    return auth.$authWithPassword({
                        email: email,
                        password: pass
                    }, {rememberMe: true});

                },

                logout: function () {
//                    $rootScope.$broadcast('authManager:beforeLogout', auth);
//                    auth.$logout();
                    console.log('logout');
                    auth.$unauth();
                },

//                addToScope: function ($scope) {
//                    authScopeUtil($scope);
//                    $scope.login = this.login;
//                    $scope.logout = this.logout;
//                },


                createAccount: function (email, pass, name) {
                    return auth.$createUser({email: email, password: pass})
                        .then(function () {
                            // authenticate so we have permission to write to Firebase
                            return fns.login(email, pass);
                        })
                        .then(function (user) {
                            // store user data in Firebase after creating account
                            return createProfile(user.uid, email, name).then(function () {
                                return user;
                            });
                        });
                },

                changePassword: function (email, oldpass, newpass) {
                    return auth.$changePassword({email: email, oldPassword: oldpass, newPassword: newpass});
                },

                changeEmail: function (password, oldEmail, newEmail) {
                    return changeEmail(password, oldEmail, newEmail, this);
                },

                removeUser: function (email, pass) {
                    return auth.$removeUser({email: email, password: pass});
                },

                watch: function (cb, $scope) {
                    fns.getUser().then(function (user) {
                        cb(user);
                    });
                    listeners.push(cb);
                    var unbind = function () {
                        var i = listeners.indexOf(cb);
                        if (i > -1) {
                            listeners.splice(i, 1);
                        }
                    };
                    if ($scope) {
                        $scope.$on('$destroy', unbind);
                    }
                    return unbind;
                }
            };

//            $rootScope.$on('$firebaseSimpleLogin:login', statusChange);
//            $rootScope.$on('$firebaseSimpleLogin:logout', statusChange);
//            $rootScope.$on('$firebaseSimpleLogin:error', statusChange);

            auth.$onAuth(statusChange);
            statusChange();

            return fns;
        }])

/**
 * A simple utility to monitor changes to authentication and set some values in scope for use in bindings/directives/etc
 */
//    .factory('authScopeUtil', ['$log', 'updateScope', '$location',
//        function ($log, updateScope, $location) {
//            return function ($scope) {
//                $scope.auth = {
//                    authenticated: false,
//                    user: null,
//                    name: null
//                };
//
//                $scope.$on('$firebaseSimpleLogin:login', _loggedIn);
//                $scope.$on('$firebaseSimpleLogin:error', function (err) {
//                    $log.error(err);
//                    _loggedOut();
//                });
//                $scope.$on('$firebaseSimpleLogin:logout', _loggedOut);
//
//                function parseName(user) {
//                    return user.id;
//                }
//
//                function _loggedIn(evt, user) {
//                    $scope.auth = {
//                        authenticated: true,
//                        user: user.id,
//                        name: parseName(user)
//                    };
////                    updateScope($scope, 'auth', $scope.auth, function () {
////                        if (!($location.path() || '').match('/hearth')) {
////                            $location.path('/hearth');
////                        }
////                    });
//                }
//
//                function _loggedOut() {
//                    $scope.auth = {
//                        authenticated: false,
//                        user: null,
//                        name: null
//                    };
//                    updateScope($scope, 'auth', $scope.auth, function () {
//                        $location.search('feed', null);
//                        $location.path('/demo');
//                    });
//                }
//            }
//        }])

    .factory('updateScope', ['$timeout', '$parse', function ($timeout, $parse) {
        return function (scope, name, val, cb) {
            $timeout(function () {
                $parse(name).assign(scope, val);
                cb && cb();
            });
        }
    }])

    .factory('createProfile', ['fbutil', '$q', '$timeout', function (fbutil, $q, $timeout) {
        return function (id, email, name) {
            var ref = fbutil.ref('users', id), def = $q.defer();
            ref.set({email: email, name: name || firstPartOfEmail(email)}, function (err) {
                $timeout(function () {
                    if (err) {
                        def.reject(err);
                    }
                    else {
                        def.resolve(ref);
                    }
                })
            });

            function firstPartOfEmail(email) {
                return ucfirst(email.substr(0, email.indexOf('@')) || '');
            }

            function ucfirst(str) {
                // credits: http://kevin.vanzonneveld.net
                str += '';
                var f = str.charAt(0).toUpperCase();
                return f + str.substr(1);
            }

            return def.promise;
        }
    }]);
