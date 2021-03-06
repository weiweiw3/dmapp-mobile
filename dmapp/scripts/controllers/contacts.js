angular.module('myApp.controllers.contacts', [ ])

    .controller('contactDetailCtrl', function ($scope, syncObject, $stateParams, $rootScope) {
        /*triple data binding*/
        $scope.syncContactDetail = function () {
            syncObject(['users', 'simplelogin:40', 'contacts', $stateParams.contactId])
                .$bindTo($scope, 'contactDetail')
                .then(function (unBind) {
                    $scope.unBindProfile = unBind;
                });
        };
        // set initial binding
        $scope.syncContactDetail();

        $scope.unBindData = function () {
            // disable bind to prevent junk data being left in firebase
            $scope.unBindProfile();

        };


    })
    .controller('ContactsCtrl', function (syncArray, $scope, $rootScope, $ionicScrollDelegate, ionicLoading) {
        var contacts = $scope.contacts = [];
        var contactsFavorite = [];
        var contactsUnfavorite = [];
        var currentCharCode = 'A'.charCodeAt(0) - 1;

        function syncContacts() {
        }

        var CONTACT = syncArray(['users', 'simplelogin:40', 'contacts']);

        function orderName() {
            contactsFavorite = [];
            contactsUnfavorite = [];
            currentCharCode = 'A'.charCodeAt(0) - 1;
            contactsFavorite.push({
                isLetter: true,
                letter: 'Favorites'
            });

            CONTACT
                .sort(function (a, b) {
                    return a.last_name > b.last_name ? 1 : -1;
                })
                .forEach(function (person) {
                    //Get the first letter of the last name, and if the last name changes
                    //put the letter in the array
                    var personCharCode = person.last_name.toUpperCase().charCodeAt(0);
                    //We may jump two letters, be sure to put both in
                    //(eg if we jump from Adam Bradley to Bob Doe, add both C and D)
                    var difference = personCharCode - currentCharCode;
                    for (var i = 1; i <= difference; i++) {
                        addLetter(currentCharCode + i);
                    }
                    currentCharCode = personCharCode;
                    if (person.favorite == true) {
                        contactsFavorite.push(person);
                    } else {
                        contactsUnfavorite.push(person);
                    }
                });

            //If names ended before Z, add everything up to Z
            for (var i = currentCharCode + 1; i <= 'Z'.charCodeAt(0); i++) {
                addLetter(i);
            }
            contacts = contactsFavorite.concat(contactsUnfavorite);
        }

        ionicLoading.load();

        CONTACT.$loaded().then(
            function () {
                orderName();
                ionicLoading.unload();
            }
        );
        CONTACT.$watch(function (event) {
            orderName();
//            console.log(event);
        });
        function addLetter(code) {
            var letter = String.fromCharCode(code);

            contactsUnfavorite.push({
                isLetter: true,
                letter: letter
            });
        }


        //Letters are shorter, everything else is 100 pixels
        $scope.getItemHeight = function (item) {
            return item.isLetter ? 30 : 60;
        };

        $scope.scrollBottom = function () {
            $ionicScrollDelegate.scrollBottom(true);
        };

        $scope.scrollTop = function () {
            $ionicScrollDelegate.scrollTop();
        };

        var letterHasMatch = {};
        $scope.getContacts = function () {
            letterHasMatch = {};
            //Filter contacts by $scope.search.
            //Additionally, filter letters so that they only show if there
            //is one or more matching contact
            return contacts.filter(function (item) {
                var itemDoesMatch = !$scope.search || item.isLetter ||
                    item.first_name.toLowerCase().indexOf($scope.search.toLowerCase()) > -1 ||
                    item.last_name.toLowerCase().indexOf($scope.search.toLowerCase()) > -1;
                //Mark this person's last name letter as 'has a match'
                if (!item.isLetter && itemDoesMatch && !item.favorite) {
                    var letter = item.last_name.charAt(0).toUpperCase();
                    letterHasMatch[letter] = true;
                }
                if (!item.isLetter && itemDoesMatch && item.favorite) {
                    letterHasMatch['Favorites'] = true;
                }

                return itemDoesMatch;
            }).filter(function (item) {
                //Finally, re-filter all of the letters and take out ones that don't
                //have a match
                if (item.isLetter && !letterHasMatch[item.letter]) {
                    return false;
                }
                return true;
            });
        };


        $scope.clearSearch = function () {
            $scope.search = '';
        };
    });


