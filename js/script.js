$(document).ready(function () {
    let symbols = ["hearts", "spades", "diamonds", "clubs", "star", "moon"];    // joker


    if ($("body#instructions").length > 0) {
        initializeInstructionsPage();
    }

    if ($("body#settings").length > 0) {
        initializeSettingsPage();
    }
    if ($("body#gameplay").length > 0) {
        gameplay();
    }

    // Instructions ------------------------------------------------

    function initializeInstructionsPage() {
        // Attach event listeners ---------------------------
        $("#instructionsReadButton").click(function () {
            window.location.href = "settings.html";
        });

    }

    // Settings ------------------------------------------------

    function initializeSettingsPage() {
        initializeSettingsSegment(1);
        $("#settings-segment-1 .continueButton").click(function () {
            initializeSettingsSegment(2);
            $("#settings-segment-2 .continueButton").click(function () {
                setTimeout(() => {
                    window.location.href = "gameplay.html";
                }, 500);
            });
        });
    }


    function initializeSettingsSegment(segmentNumber) {
        let segment = "#settings-segment-" + segmentNumber;
        let numberOfChosenSymbols = 0;
        let combination = [];
        let combinationImgs = $(segment + " .settings-combination-table-input td img");

        $(segment + " p").toggleClass("pale-text");

        // Add symbol ----------------------------------------------------------
        $.each($(segment + " .symbol-set td"), function (index) {
            // Add event listener
            $(this).addClass("pointer-cursor");

            $(this).find(".symbol-pink").attr("src", getIconPath(index)).hide();
            $(this).find(".symbol-cyan").attr("src", getIconPathCyan(index)).show();

            $(this).on({
                "click": function () {
                    if (numberOfChosenSymbols < 4) {
                        combination[numberOfChosenSymbols] = index;
                        $(combinationImgs[numberOfChosenSymbols++]).attr("src", getIconPathCyan(index)).show();
                        if (numberOfChosenSymbols == 4)
                            $(segment + " .continueButton").prop("disabled", false);
                    }                },
                "mouseenter": function () {
                    $(this).find(".symbol-cyan").hide();
                    $(this).find(".symbol-pink").show();

                },
                "mouseleave": function () {
                    $(this).find(".symbol-pink").hide();
                    $(this).find(".symbol-cyan").show();
                }
            })
        });


        // Random button -------------------------------------------------------
        $(segment + " .randomButton").prop("disabled", false);
        $(segment + " .randomButton").click(function () {

            let randomArr = randomCombination();
            $.each(combinationImgs, function (index) {
                $(this).attr("src", getIconPathCyan(randomArr[index]))
                    .show();
            });
            numberOfChosenSymbols = 4;
            combination = randomArr;
            $(segment + " .continueButton").prop("disabled", false);
        })

        // Clear button -------------------------------------------------------
        $(segment + " .clearButton").prop("disabled", false);
        $(segment + " .clearButton").click(function () {
            if (numberOfChosenSymbols > 0) {
                $(combinationImgs[--numberOfChosenSymbols]).removeAttr("src").hide();
                $(segment + " .continueButton").prop("disabled", true);
            }
        })

        // Continue button -------------------------------------------------------
        $(segment + " .continueButton").click(function () {
            $(segment + " p").toggleClass("pale-text");
            $(segment + " button").prop("disabled", true);
            $.each(combinationImgs, function () {
                $(this).attr("src", "").hide();
            });
            $.each($(segment + " .symbol-set td"), function () {
                $(this).removeClass("pointer-cursor");
                $(this).off();
                $(this).children().removeAttr("src").hide();
            });

            let otherPlayer = segmentNumber % 2 + 1;
            localStorage.setItem("player-" + otherPlayer + "-combination", JSON.stringify(combination));

        })
    }


    function getIconPath(i) {
        return "resources/" + symbols[i] + ".png";
    }
    function getIconPathCyan(i) {
        return "resources/" + symbols[i] + "-cyan.png";
    }
    function randomCombination() {
        let randomArr = [];
        for (let i = 0; i < 4; i++)
            randomArr.push(Math.floor(Math.random() * 6));
        return randomArr;

    }


    // Gameplay -----------------------------------------------------

    function gameplay(params) {
        // Player 1's first turn
        let currTurn = 0;

        // Symbol sets
        let symbolSets = $(".symbol-set");
        symbolSets[0] = $(symbolSets[0]).find(".combination-td");
        symbolSets[1] = $(symbolSets[1]).find(".combination-td");


        // Tables
        let tables = $(".gameplay-combination-table-input");    // 2x8 matrix (2 input tables, 8 rows each)
        tables[0] = $(tables[0]).find("tr");
        tables[1] = $(tables[1]).find("tr");

        let successTable = $(".combination-table-success");
        successTable[0] = $(successTable[0]).find("tr");
        successTable[1] = $(successTable[1]).find("tr");

        console.log(successTable[0]);

        // Turn Counter
        let currRowIndex = [0, 0];
        let currRow = [$(tables[0][0]).find(".symbol"), $(tables[1][0]).find(".symbol")]; // 2 collections of current player row symbols
        let numberOfChosenSymbols = [0, 0];


        // Combinations
        let combinationGuess = [[], []];
        let combination = [JSON.parse(localStorage.getItem("player-1-combination")), JSON.parse(localStorage.getItem("player-2-combination"))];

        let playerStatuses = $(".player-status");
        let clearButtons = $(".clearButton");
        let sumbitButtons = $(".sumbitButton");

        // Finished flags
        // let finished = [false, false];
        let gameoverFlag;
        const DRAW = 2;

        // Player status
        let statusMessages = $(".player-status-message");

        // Timers
        let timer = [60.0, 60.0];
        let timerValue = $(".timer-value");
        let handler = [];


        initGame();

        function initGame() {
            // Symbol sets
            $.each($(symbolSets), function () {
                $.each($(this), function (index) {
                    $(this).find(".symbol-cyan").attr("src", getIconPathCyan(index)).show();
                    $(this).find(".symbol-pink").attr("src", getIconPath(index));
                });
            });

            // Clear buttons
            $.each($(clearButtons), function (i) {
                $(this).click(function () {
                    if (numberOfChosenSymbols[i] > 0) {
                        $(currRow[i][--numberOfChosenSymbols[i]]).removeAttr("src").hide();
                        $(sumbitButtons[i]).prop("disabled", true);
                        combinationGuess[currTurn].pop();

                    }
                })
            });

            // Sumbit buttons
            $.each($(sumbitButtons), function (i) {
                $(this).click(function () {
                    $(this).prop("disabled", true);
                    let success = measureSuccess();

                    // Show success
                    $(successTable[currTurn][currRowIndex[currTurn]])
                        .children()
                        .slice(0, success[0])
                        .addClass("combination-td-success-red")
                        .append("<div class='success-block red-block'></div>");

                    $(successTable[currTurn][currRowIndex[currTurn]])
                        .children()
                        .slice(success[0], success[0] + success[1])
                        .addClass("combination-td-success-yellow")
                        .append("<div class='success-block yellow-block'></div>")

                    if (success[0] == 4) {
                        revealCombination(currTurn);
                        revealCombination((currTurn + 1) % 2);
                        gameover(currTurn);
                        
                        // if (currTurn == 1) {        // Player 2 found the right combination before player 1 (win) {
                        //     revealCombination(0);
                        //     gameover(1);
                        // }
                        // else
                        //     if (currTurn == 0)      // Player 1 found the right combination,
                        //         finished[0] = true; //  but player 2 still has a chance to win If he finds the combination in less time

                    }
                    // else
                    //     if (finished[0]) {          // Player 1 finished in previous turn and player 2 hasn't found the right combination
                    //         revealCombination(currTurn);
                    //         gameover(0);
                    //     }

                    if (!gameoverFlag) {
                        currRowIndex[currTurn]++;
                        if (currRowIndex[currTurn] < 7) {
                            currRow[currTurn] = $(tables[currTurn][currRowIndex[currTurn]]).find(".symbol");
                            numberOfChosenSymbols[currTurn] = 0;
                            combinationGuess[currTurn] = [];

                            togglePlayer();
                        }
                        else {
                            revealCombination(currTurn);    // No more guesses
                            if (currTurn == 0)
                                togglePlayer();
                            else
                                gameover(DRAW);

                        }

                    }


                })
            })

            // Central control buttons
            $("#gameplay-start-button").click(function () {
                $(this).prop("disabled", true);
                $(playerStatuses[currTurn]).toggleClass("pale-text");
                $(clearButtons[currTurn]).prop("disabled", false);
                $(symbolSets[currTurn]).toggleClass("pointer-cursor");
                attachSymbolSetEvents($(symbolSets[currTurn]));
                resumeCurrentTimer();
            });

            
            $("#gameplay-new-game-button").prop("disabled", false).text("New Game").click(function () {
                window.location.href = "settings.html";
            });
        }
        function revealCombination(playerNumber) {

            $.each($(tables[playerNumber][7]).find(".symbol"), function (i) {
                $(this).attr("src", getIconPath(combination[playerNumber][i])).show();
            });
        }
        function resumeCurrentTimer() {
            handler[currTurn] = setInterval(() => {
                timer[currTurn] -= 0.01;
                $(timerValue[currTurn]).text(timer[currTurn].toFixed(2));

                // If time runs out other player wins 
               
                if (timer[currTurn].toFixed(2) == 0) {
                    revealCombination(currTurn);
                    revealCombination((currTurn + 1) % 2);
                    gameover((currTurn + 1) % 2)
                }
                // else // if the player 1 finished in less time than the player 2
                //     if (finished[0] && timer[0] >= timer[1]) {
                //         revealCombination(1);
                //         gameover(0)
                //     }

            }, 10);
        }

        function stopCurrentTimer() {
            clearInterval(handler[currTurn]);
        }

        function togglePlayer() {
            stopCurrentTimer();
            $(clearButtons).prop("disabled", function (i, v) { return !v; });
            $(playerStatuses).toggleClass("pale-text");
            $(symbolSets[currTurn]).off();
            $(symbolSets[currTurn]).toggleClass("pointer-cursor");
            currTurn = (currTurn + 1) % 2;

            attachSymbolSetEvents(symbolSets[currTurn]);
            $(symbolSets[currTurn]).toggleClass("pointer-cursor");
            resumeCurrentTimer();
        }

        function attachSymbolSetEvents(symbolSet) {

            $.each($(symbolSet), function (i) {
                $(this).on({
                    "click": function () {
                        addSymbol($(this).children(".symbol-cyan").attr("src"), i);
                    },
                    "mouseenter": function () {
                        $(this).find(".symbol-cyan").hide();
                        $(this).find(".symbol-pink").show();

                    },
                    "mouseleave": function () {
                        $(this).find(".symbol-pink").hide();
                        $(this).find(".symbol-cyan").show();
                    }
                })
            });
        }



        function addSymbol(src, val) {

            if (numberOfChosenSymbols[currTurn] < 4) {
                combinationGuess[currTurn].push(val);
                $(currRow[currTurn][numberOfChosenSymbols[currTurn]++]).attr("src", src).show();
                if (numberOfChosenSymbols[currTurn] == 4)
                    $(sumbitButtons[currTurn]).prop("disabled", false);

            }
        }

        function measureSuccess() {
            let tmpCombination = combination[currTurn].slice();
            let tmpCombinationGuess = combinationGuess[currTurn].slice();
            let redSuccess = 0;
            let yellowSuccess = 0;

            for (let i = 3; i >= 0; i--)
                if (combinationGuess[currTurn][i] == combination[currTurn][i]) {
                    redSuccess++;
                    tmpCombination.splice(i, 1);
                    tmpCombinationGuess.splice(i, 1);
                }

            tmpCombination.forEach(val => {
                let toDelete = tmpCombinationGuess.indexOf(val);
                if (toDelete != -1) {
                    tmpCombinationGuess.splice(toDelete, 1);
                    yellowSuccess++;
                }
            })

            return [redSuccess, yellowSuccess];
        }


        function gameover(winner) {
            stopCurrentTimer();

            gameoverFlag = true;

            $(clearButtons[currTurn]).prop("disabled", true);
            $(symbolSets[currTurn]).off();
            $(symbolSets[currTurn]).toggleClass("pointer-cursor");

            $(playerStatuses).addClass("pale-text");
            if (winner == DRAW) 
                $(statusMessages).text("Draw").addClass("pink-text");
            else {
                $(statusMessages[winner]).text("Winner").addClass("pink-text");
                $(statusMessages[(winner+1)%2]).text("Loser").addClass("white-text");
            }

        }


    }


})