'use strict';

const app = require('commander'),
    config = require('./config/local'),
    db = require('./lib/db'),
    logger = require('./lib/logger'),
    _ = require('lodash'),
    dateUtils = require('./lib/date-utils'),
    promise = require('bluebird'),
    analyse = require('./lib/analyse'),
    layPrice = 1.56,
    liabilityPercent = 1.00;

const runnerScores = [];

const distanceScores = [];

const venueScores = [];

const dayScores = [];

const raceClassScores = [];

const hourScores = [];

let balance = 1000;

app
    .option('-r, --run', 'Run Simulation')
    .option('-a, --analyse', 'Analyse Data')
    .parse(process.argv);

if (app.analyse) {
    return promise.coroutine(function*() {

        yield analyse.analyseData(layPrice);
        db.destroy();
    })();
} else {
    db.knex.raw(`select distinct event_id, country, actual_off, course, distance, event from horse_racing_race where actual_off >= '2016-01-01' and actual_off < '2017-01-01' order by actual_off`)
        .then(function(races) {

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

        let maxLiability = (balance * (liabilityPercent / 100)).toFixed(2),
            stake = (maxLiability / (layPrice - 1)).toFixed(2);

        if (stake < 2.00) {
            stake = 2.00;
            maxLiability = (stake * (layPrice - 1)).toFixed(2);
        }

        //stake = 10.00;
        //maxLiability = 5.60;

        race.venue = getVenueFromCourse(race.course);
        race.race_class = race.event.substr(race.event.indexOf(' ') + 1);

        const runners = yield db.knex.raw(`select distinct selection_id, selection, win_flag from horse_racing_race where event_id = ${race.event_id}`),
            spBetting = yield db.knex.raw(`select sum(pre_total_matched) as pre_total_matched, sum(pre_total_bets) as pre_total_bets from horse_racing_race where event_id = ${race.event_id}`),
            numberOfRunners = runners.rows.length,
            matches = yield db.knex.raw(`select distinct selection_id from horse_racing where event_id = ${race.event_id} and in_play = 'IP' and odds <= ${layPrice}`);


        for (let runner of runners.rows) {
            const sp = yield db.knex.raw(`select selection_id, odds from horse_racing where event_id = ${race.event_id} and selection_id = ${runner.selection_id} and in_play = 'PE' order by latest_taken desc, odds desc limit 1`);
            const minInPlay = yield db.knex.raw(`select selection_id, min(odds), win_flag from horse_racing where event_id = ${race.event_id} and selection_id = ${runner.selection_id} and in_play = 'IP' group by event_id, selection_id, win_flag`);

            runner.sp = sp.rows[0] ? parseFloat(sp.rows[0].odds) : null;

            if (minInPlay.rows[0]) {
                runner.min_in_play = minInPlay.rows[0].min;
            }
        }

        const favourite = _.minBy(runners.rows, 'sp'),
            runnersWithoutFavourite = _.omitBy(runners.rows, function(check) {
                return check.selection_id === favourite ? favourite.selection_id : undefined;
            }),
            secondFavourite = _.minBy(_.values(runnersWithoutFavourite), 'sp');

        let favSecFavRatio = null;

        if (favourite && secondFavourite) {
            favSecFavRatio = (secondFavourite.sp / favourite.sp).toFixed(2);
        }

        for (let runner of runners.rows) {
            //yield db.knex.raw(`delete from horse_racing_runner where event_id = ${race.event_id} and selection_id = ${runner.selection_id};`);
            //yield db.knex.raw(`insert into horse_racing_runner (event_id, country, course, venue, distance, race_class, runners, selection_id, selection, win_flag, sp_odds, min_in_play_odds, actual_off, created_at, race_pre_total_matched, race_pre_total_bets, fav_sp_odds, sec_fav_sp_odds, fav_sec_fav_ratio) select ${race.event_id}, '${race.country}', '${race.course}', ${race.venue}, '${race.distance}', '${race.race_class}', ${numberOfRunners}, ${runner.selection_id}, '${runner.selection}', ${runner.win_flag}, ${runner.sp}, ${runner.min_in_play || null}, '${dateUtils.formatPGDateTime(new Date(race.actual_off))}', now(), ${spBetting.rows[0].pre_total_matched}, ${spBetting.rows[0].pre_total_bets}, ${favourite ? favourite.sp : null}, ${secondFavourite ? secondFavourite.sp : null}, ${favSecFavRatio};`);
        }

        const theDate = new Date(race.actual_off);

        const runnerScore = _.find(runnerScores, {
            runners: numberOfRunners
        });

        const distanceScore = _.find(distanceScores, {
            distance: race.distance
        });

        const venueScore = _.find(venueScores, {
            venue: race.venue.replace(/'/g, "")
        });

        const dayScore = _.find(dayScores, {
            day: new Date(race.actual_off).getDay()
        });

        const raceClassScore = _.find(raceClassScores, {
            race_class: race.race_class.replace(/'/g, "")
        });

        const hourScore = _.find(hourScores, {
            hour: new Date(race.actual_off).getHours()
        });

        let totalScore;

        if (raceClassScore) {
            totalScore = ((hourScore.matches + runnerScore.matches + distanceScore.matches + venueScore.matches + dayScore.matches + raceClassScore.matches) / 6.00);
        } else {
            totalScore = ((hourScore.matches + runnerScore.matches + distanceScore.matches + venueScore.matches + dayScore.matches) / 5.00);
        }

        if ((favourite && favourite.sp && favourite.sp > layPrice + 0.08) && totalScore >= (layPrice - 0.0023)) {

            if (matches.rows.length === 1) {
                balance = parseFloat((balance - maxLiability).toFixed(2));
            } else if (matches.rows.length > 1) {
                let profit = (stake * (matches.rows.length - 1));

                profit = profit - maxLiability;

                profit = profit.toFixed(2);
                profit = profit * 0.95;
                profit = parseFloat(profit.toFixed(2));

                balance = balance + profit;
                balance = parseFloat(balance.toFixed(2));
            }

            const dateString = ("0" + theDate.getDate()).slice(-2) + "-" + ("0" + (theDate.getMonth() + 1)).slice(-2) + "-" + theDate.getFullYear();

            if (lastDateString !== dateString) {
                console.log(`${balance.toFixed(2)}, ${dateString}`);
                lastDateString = dateString;
            }
        }

        return;
    })();
}

const getVenueFromCourse = function(course) {
    switch (course) {
        case 'Aint':
            return "'Aintree'";
        case 'Ascot':
            return "'Ascot'";
        case 'Ayr':
            return "'Ayr'";
        case 'Bang':
            return "'Bangor'";
        case 'Bath':
            return "'Bath'";
        case 'Bev':
            return "'Beverley'";
        case 'Brig':
            return "'Brighton'";
        case 'Carl':
            return "'Carlisle'";
        case 'Cart':
            return "'Cartmel'";
        case 'Catt':
            return "'Catterick'";
        case 'Chelt':
            return "'Cheltenham'";
        case 'ChelmC':
            return "'Chelmsford City'";
        case 'Chep':
            return "'Chepstow'";
        case 'Chest':
            return "'Chester'";
        case 'Donc':
            return "'Doncaster'";
        case 'Epsm':
            return "'Epsom'";
        case 'Extr':
            return "'Exeter'";
        case 'Fake':
            return "'Fakenham'";
        case 'FfosL':
            return "'Ffos Las'";
        case 'Folk':
            return "'Folkstone'";
        case 'Font':
            return "'Fontwell'";
        case 'Good':
            return "'Goodwood'";
        case 'Ham':
            return "'Hamilton'";
        case 'Hayd':
            return "'Haydock'";
        case 'Here':
            return "'Hereford'";
        case 'Hex':
            return "'Hexham'";
        case 'Hunt':
            return "'Huntingdon'";
        case 'Kelso':
            return "'Kelso'";
        case 'Kemp':
            return "'Kempton'";
        case 'Leic':
            return "'Leicester'";
        case 'Ling':
            return "'Lingfield'";
        case 'Ludl':
            return "'Ludlow'";
        case 'MrktR':
            return "'Market Rasen'";
        case 'Muss':
            return "'Musselburgh'";
        case 'Newb':
            return "'Newbury'";
        case 'Newc':
            return "'Newcastle'";
        case 'Newm':
            return "'Newmarket'";
        case 'Newt':
            return "'Newton Abbot'";
        case 'Nott':
            return "'Nottingham'";
        case 'Perth':
            return "'Perth'";
        case 'Plump':
            return "'Plumpton'";
        case 'Ponte':
            return "'Pontefract'";
        case 'Redc':
            return "'Redcar'";
        case 'Ripon':
            return "'Ripon'";
        case 'Salis':
            return "'Salisbury'";
        case 'Sand':
            return "'Sandown'";
        case 'Sedge':
            return "'Sedgefield'";
        case 'Sthl':
            return "'Southwell'";
        case 'Strat':
            return "'Stratford'";
        case 'Taun':
            return "'Taunton'";
        case 'Thirsk':
            return "'Thirsk'";
        case 'Towc':
            return "'Towcester'";
        case 'Uttox':
            return "'Uttoxeter'";
        case 'Warw':
            return "'Warwick'";
        case 'Weth':
            return "'Wetherby'";
        case 'Winc':
            return "'Wincanton'";
        case 'Wind':
            return "'Windsor'";
        case 'Wolv':
            return "'Wolverhampton'";
        case 'Worc':
            return "'Worcester'";
        case 'Yarm':
            return "'Yarmouth'";
        case 'York':
            return "'York'";
        default:
            logger.log('Unable to determine venue from course: ' + course, 'error');
            return null;
    }
}