'use strict';

const app = require('commander'),
    config = require('./config/local'),
    db = require('./lib/db'),
    dateUtils = require('./lib/date-utils'),
    promise = require('bluebird'),
    analyse = require('./lib/analyse'),
    layPrice = 1.6,
    liabilityPercent = 0.5;

const excludeRunners = [-1,
        2, 3, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 40
    ],
    excludeCourses = ["'dummy'",
        "'ChelmC'",
        "'Salis'",
        "'Catt'",
        "'Ling'",
        "'Ponte'",
        "'Ripon'",
        "'Hunt'",
        "'Folk'",
        "'Brig'",
        "'Here'",
        "'Ayr'",
        "'Yarm'",
        "'Wind'",
        "'Hex'",
        "'Wolv'",
        "'Taun'",
        "'Ham'"
    ],
    excludeDistances = ["'dummy'",
        "'4m1f'",
        "'4m2f'",
        "'4m'",
        "'5f'",
        "'6f'",
        "'7f'"
    ],
    excludeMonths = [-1],
    excludeDays = [-1],
    excludeClasses = ["'dummy'",
        "'Juv Hcap Hrd'",
        "'PA'",
        "'Grd1 Juv Hrd'",
        "'Listed Nov Chs'",
        "'Grd2 Juv Hrd'",
        "'Charity Race'",
        "'Grd1 Nov Hrd'",
        "'PA Grp1'",
        "'Listed Hcap Hrd'",
        "'Hrd'",
        "'Grd1 Hrd'",
        "'Int Hrd'",
        "'Grd1 Chs'",
        "'Grd1 Nov Chs'",
        "'Grp1'",
        "'Listed Juv Hrd'",
        "'Mdn NHF'",
        "'App Hcap'",
        "'Listed NHF'",
        "'Grp 2'",
        "'Nov Hrd'",
        "'Grp3'",
        "'Cond Stks'",
        "'Grp2'",
        "'Nov Chs'",
        "'Grd2 Hrd'",
        "'Claim Stks'"
    ];

let balance = 1000.00;

app
    .option('-r, --run', 'Run Simulation')
    .option('-a, --analyse', 'Analyse Data')
    .parse(process.argv);

if (app.analyse) {
    return promise.coroutine(function*() {

        yield analyse.analyseData(layPrice, excludeCourses, excludeMonths, excludeDistances, excludeRunners, excludeDays, excludeClasses);
        db.destroy();
    })();
} else {
    db.knex.raw('select distinct event_id, country, actual_off, course, distance, event from horse_racing_race order by actual_off')
        .then(function(races) {
            //console.log(races.rows);

            return promise.coroutine(function*() {
                for (let race of races.rows) {
                    yield processRace(race);
                }
                db.destroy();
                return;
            })();
        });
}

let lastDateString = '';

const processRace = function(race) {
    return promise.coroutine(function*() {
        //console.log(race);

        const maxLiability = (balance * (liabilityPercent / 100)).toFixed(2),
            stake = (maxLiability / (layPrice - 1)).toFixed(2);

        /*const maxLiability = 3.00,
            stake = 5.00;*/

        race.race_class = race.event.substr(race.event.indexOf(' ') + 1);

        const runners = yield db.knex.raw(`select distinct selection_id from horse_racing_race where event_id = ${race.event_id}`),
            numberOfRunners = runners.rows.length,
            matches = yield db.knex.raw(`select distinct selection_id from horse_racing where event_id = ${race.event_id} and in_play = 'IP' and odds <= ${layPrice}`);

        for (let runner of runners.rows) {
            const sp = yield db.knex.raw(`select selection_id, odds from horse_racing where event_id = ${race.event_id} and selection_id = ${runner.selection_id} and in_play = 'PE' order by latest_taken desc limit 1`);
            //console.log(sp.rows);
            const minInPlay = yield db.knex.raw(`select selection_id, min(odds), win_flag from horse_racing where event_id = ${race.event_id} and selection_id = ${runner.selection_id} and in_play = 'IP' group by event_id, selection_id, win_flag`);
            //console.log(minInPlay.rows);

            runner.sp = sp.rows[0] ? sp.rows[0].odds : null;

            if (minInPlay.rows[0]) {
                runner.min_in_play = minInPlay.rows[0].min;
            }

            yield db.knex.raw(`delete from horse_racing_runner where event_id = ${race.event_id} and selection_id = ${runner.selection_id};`);
            yield db.knex.raw(`insert into horse_racing_runner (event_id, country, course, distance, race_class, runners, selection_id, sp_odds, min_in_play_odds, actual_off, created_at) select ${race.event_id}, '${race.country}', '${race.course}', '${race.distance}', '${race.race_class}', ${numberOfRunners}, ${runner.selection_id}, ${runner.sp}, ${runner.min_in_play || null}, '${dateUtils.formatPGDateTime(new Date(race.actual_off))}', now();`);

            //console.log(runner);
        }

        //console.log(numberOfRunners);
        //console.log(matches.rows.length);

        const theDate = new Date(race.actual_off);

        if ((excludeClasses.indexOf(`'${race.race_class}'`) === -1) && (excludeDays.indexOf(theDate.getDay()) === -1) && (excludeMonths.indexOf(theDate.getMonth() + 1) === -1) && (excludeRunners.indexOf(numberOfRunners) === -1) && (excludeDistances.indexOf(`'${race.distance}'`) === -1) && (excludeCourses.indexOf(`'${race.course}'`) === -1)) {
            //console.log(numberOfRunners + ' ' + race.course);

            /*            console.log('');
                        console.log(`matches ${matches.rows.length}`);
                        console.log(`blance ${balance}`);
                        console.log(`liability ${maxLiability}`);
                        console.log(`stake ${stake}`);
            */
            if (matches.rows.length === 1) {
                balance = balance - maxLiability;
            } else if (matches.rows.length > 1) {
                let profit = (stake * (matches.rows.length - 1));

                profit = profit - maxLiability;

                profit = profit.toFixed(2);
                profit = profit * 0.95;
                profit = parseFloat(profit.toFixed(2));

                balance = balance + profit;
                balance = parseFloat(balance.toFixed(2));

                //console.log(`profit ${profit}`);
            }

            if (matches.rows > 2) {
                console.log(race.event_id);
            }


            //console.log(`end balance ${balance}`);


            const dateString = ("0" + theDate.getDate()).slice(-2) + "-" + ("0" + (theDate.getMonth() + 1)).slice(-2) + "-" + theDate.getFullYear();

            //console.log(theDate);
            if (lastDateString !== dateString) {
                console.log(`${balance.toFixed(2)}, ${dateString}`);
                lastDateString = dateString;
            }
        }

        return;
    })();
}