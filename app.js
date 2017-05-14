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

const runnerScores = [{
    runners: 31,
    races: 2,
    matches: 1
}, {
    runners: 35,
    races: 1,
    matches: 1
}, {
    runners: 39,
    races: 1,
    matches: 1
}, {
    runners: 30,
    races: 8,
    matches: 1.125
}, {
    runners: 26,
    races: 16,
    matches: 1.25
}, {
    runners: 28,
    races: 20,
    matches: 1.35
}, {
    runners: 23,
    races: 46,
    matches: 1.413
}, {
    runners: 29,
    races: 11,
    matches: 1.4545
}, {
    runners: 24,
    races: 48,
    matches: 1.4583
}, {
    runners: 32,
    races: 2,
    matches: 1.5
}, {
    runners: 20,
    races: 134,
    matches: 1.5224
}, {
    runners: 18,
    races: 281,
    matches: 1.5231
}, {
    runners: 27,
    races: 21,
    matches: 1.5238
}, {
    runners: 17,
    races: 476,
    matches: 1.5315
}, {
    runners: 16,
    races: 807,
    matches: 1.5378
}, {
    runners: 8,
    races: 6885,
    matches: 1.5383
}, {
    runners: 6,
    races: 5569,
    matches: 1.5428
}, {
    runners: 12,
    races: 4470,
    matches: 1.543
}, {
    runners: 5,
    races: 3909,
    matches: 1.5459
}, {
    runners: 7,
    races: 6761,
    matches: 1.5474
}, {
    runners: 9,
    races: 6606,
    matches: 1.5548
}, {
    runners: 11,
    races: 5055,
    matches: 1.5561
}, {
    runners: 3,
    races: 426,
    matches: 1.5563
}, {
    runners: 4,
    races: 1884,
    matches: 1.5632
}, {
    runners: 10,
    races: 5987,
    matches: 1.5667
}, {
    runners: 13,
    races: 3072,
    matches: 1.5693
}, {
    runners: 15,
    races: 1153,
    matches: 1.5716
}, {
    runners: 14,
    races: 2142,
    matches: 1.5738
}, {
    runners: 22,
    races: 47,
    matches: 1.5745
}, {
    runners: 19,
    races: 179,
    matches: 1.5922
}, {
    runners: 21,
    races: 61,
    matches: 1.623
}, {
    runners: 34,
    races: 3,
    matches: 1.6667
}, {
    runners: 25,
    races: 17,
    matches: 1.7059
}, {
    runners: 2,
    races: 15,
    matches: 1.7333
}, {
    runners: 33,
    races: 4,
    matches: 1.75
}, {
    runners: 40,
    races: 4,
    matches: 1.75
}];

const distanceScores = [{
    distance: '1m6',
    races: 1,
    matches: 1
}, {
    distance: '4m3f',
    races: 2,
    matches: 1.5
}, {
    distance: '5f',
    races: 4757,
    matches: 1.5056
}, {
    distance: '1m5f',
    races: 406,
    matches: 1.5246
}, {
    distance: '2m2f',
    races: 538,
    matches: 1.5279
}, {
    distance: '6f',
    races: 6761,
    matches: 1.5334
}, {
    distance: '1m7f',
    races: 159,
    matches: 1.5409
}, {
    distance: '7f',
    races: 6415,
    matches: 1.5417
}, {
    distance: '2m',
    races: 6524,
    matches: 1.5429
}, {
    distance: '3m3f',
    races: 185,
    matches: 1.5459
}, {
    distance: '1m3f',
    races: 938,
    matches: 1.5469
}, {
    distance: '1m1f',
    races: 1153,
    matches: 1.549
}, {
    distance: '1m4f',
    races: 3117,
    matches: 1.5537
}, {
    distance: '3m',
    races: 2396,
    matches: 1.5559
}, {
    distance: '1m',
    races: 6539,
    matches: 1.5564
}, {
    distance: '1m2f',
    races: 3779,
    matches: 1.5565
}, {
    distance: '1m6f',
    races: 964,
    matches: 1.5581
}, {
    distance: '2m1f',
    races: 1914,
    matches: 1.5617
}, {
    distance: '2m4f',
    races: 3562,
    matches: 1.5828
}, {
    distance: '3m2f',
    races: 557,
    matches: 1.5871
}, {
    distance: '2m3f',
    races: 1228,
    matches: 1.5936
}, {
    distance: '4m',
    races: 32,
    matches: 1.5938
}, {
    distance: '2m5f',
    races: 1391,
    matches: 1.5953
}, {
    distance: '3m1f',
    races: 840,
    matches: 1.5964
}, {
    distance: '3m6f',
    races: 44,
    matches: 1.6136
}, {
    distance: '3m7f',
    races: 26,
    matches: 1.6154
}, {
    distance: '2m6f',
    races: 1084,
    matches: 1.6162
}, {
    distance: '2m7f',
    races: 650,
    matches: 1.6185
}, {
    distance: '4m1f',
    races: 16,
    matches: 1.625
}, {
    distance: '3m4f',
    races: 76,
    matches: 1.6447
}, {
    distance: '4m4f',
    races: 3,
    matches: 1.6667
}, {
    distance: '3m5f',
    races: 64,
    matches: 1.6719
}, {
    distance: '4m2f',
    races: 1,
    matches: 2
}, {
    distance: '1m4',
    races: 1,
    matches: 3
}];

const venueScores = [{
    venue: 'Chelmsford City',
    races: 383,
    matches: 1.4204
}, {
    venue: 'Pontefract',
    races: 615,
    matches: 1.4878
}, {
    venue: 'Ayr',
    races: 1065,
    matches: 1.4967
}, {
    venue: 'Ripon',
    races: 599,
    matches: 1.4975
}, {
    venue: 'Windsor',
    races: 958,
    matches: 1.5021
}, {
    venue: 'Huntingdon',
    races: 585,
    matches: 1.5026
}, {
    venue: 'Folkstone',
    races: 359,
    matches: 1.507
}, {
    venue: 'Southwell',
    races: 2508,
    matches: 1.508
}, {
    venue: 'Lingfield',
    races: 3741,
    matches: 1.51
}, {
    venue: 'Ascot',
    races: 917,
    matches: 1.5104
}, {
    venue: 'Salisbury',
    races: 593,
    matches: 1.5126
}, {
    venue: 'Wolverhampton',
    races: 4294,
    matches: 1.5163
}, {
    venue: 'Taunton',
    races: 489,
    matches: 1.5194
}, {
    venue: 'Yarmouth',
    races: 838,
    matches: 1.5251
}, {
    venue: 'Catterick',
    races: 998,
    matches: 1.5261
}, {
    venue: 'Newmarket',
    races: 1600,
    matches: 1.5325
}, {
    venue: 'Kelso',
    races: 470,
    matches: 1.534
}, {
    venue: 'Hexham',
    races: 507,
    matches: 1.5385
}, {
    venue: 'Musselburgh',
    races: 987,
    matches: 1.5431
}, {
    venue: 'Bangor',
    races: 528,
    matches: 1.5455
}, {
    venue: 'Hereford',
    races: 293,
    matches: 1.5461
}, {
    venue: 'Newcastle',
    races: 1087,
    matches: 1.5465
}, {
    venue: 'Doncaster',
    races: 1326,
    matches: 1.5468
}, {
    venue: 'Perth',
    races: 533,
    matches: 1.5478
}, {
    venue: 'Hamilton',
    races: 664,
    matches: 1.5497
}, {
    venue: 'Brighton',
    races: 811,
    matches: 1.5499
}, {
    venue: 'Newton Abbot',
    races: 662,
    matches: 1.5514
}, {
    venue: 'Leicester',
    races: 1061,
    matches: 1.5523
}, {
    venue: 'Sedgefield',
    races: 642,
    matches: 1.5592
}, {
    venue: 'Worcester',
    races: 765,
    matches: 1.5595
}, {
    venue: 'Kempton',
    races: 3937,
    matches: 1.5601
}, {
    venue: 'Chester',
    races: 590,
    matches: 1.5627
}, {
    venue: 'Bath',
    races: 820,
    matches: 1.5634
}, {
    venue: 'Ludlow',
    races: 527,
    matches: 1.5636
}, {
    venue: 'Ffos Las',
    races: 934,
    matches: 1.5642
}, {
    venue: 'Wincanton',
    races: 565,
    matches: 1.5681
}, {
    venue: 'Fakenham',
    races: 361,
    matches: 1.5706
}, {
    venue: 'Goodwood',
    races: 774,
    matches: 1.5724
}, {
    venue: 'Redcar',
    races: 730,
    matches: 1.574
}, {
    venue: 'Warwick',
    races: 703,
    matches: 1.5747
}, {
    venue: 'Towcester',
    races: 582,
    matches: 1.579
}, {
    venue: 'Uttoxeter',
    races: 942,
    matches: 1.5828
}, {
    venue: 'Cartmel',
    races: 282,
    matches: 1.5851
}, {
    venue: 'Fontwell',
    races: 834,
    matches: 1.5851
}, {
    venue: 'Haydock',
    races: 1193,
    matches: 1.5851
}, {
    venue: 'Cheltenham',
    races: 616,
    matches: 1.5893
}, {
    venue: 'Carlisle',
    races: 873,
    matches: 1.5899
}, {
    venue: 'Plumpton',
    races: 574,
    matches: 1.5906
}, {
    venue: 'Exeter',
    races: 512,
    matches: 1.5938
}, {
    venue: 'Sandown',
    races: 906,
    matches: 1.5938
}, {
    venue: 'Stratford',
    races: 655,
    matches: 1.6
}, {
    venue: 'Chepstow',
    races: 1071,
    matches: 1.6032
}, {
    venue: 'Beverley',
    races: 798,
    matches: 1.6065
}, {
    venue: 'York',
    races: 676,
    matches: 1.6095
}, {
    venue: 'Wetherby',
    races: 603,
    matches: 1.6103
}, {
    venue: 'Epsom',
    races: 448,
    matches: 1.6161
}, {
    venue: 'Aintree',
    races: 331,
    matches: 1.6163
}, {
    venue: 'Nottingham',
    races: 814,
    matches: 1.6167
}, {
    venue: 'Newbury',
    races: 1244,
    matches: 1.6174
}, {
    venue: 'Market Rasen',
    races: 737,
    matches: 1.6242
}, {
    venue: 'Thirsk',
    races: 613,
    matches: 1.6378
}];

const dayScores = [{
    day: 1,
    races: 7087,
    matches: 1.5369
}, {
    day: 2,
    races: 7153,
    matches: 1.5374
}, {
    day: 6,
    races: 10775,
    matches: 1.5471
}, {
    day: 4,
    races: 8692,
    matches: 1.5513
}, {
    day: 3,
    races: 8666,
    matches: 1.5593
}, {
    day: 0,
    races: 4774,
    matches: 1.5607
}, {
    day: 5,
    races: 8976,
    matches: 1.5694
}];

const raceClassScores = [{
    race_class: 'Grd1 Nov Chs',
    races: 12,
    matches: 1.25
}, {
    race_class: 'Grd3 Hcap Hrd',
    races: 13,
    matches: 1.3077
}, {
    race_class: 'Grd1 Nov Hrd',
    races: 11,
    matches: 1.3636
}, {
    race_class: 'Hrd',
    races: 35,
    matches: 1.4
}, {
    race_class: 'Listed NHF',
    races: 15,
    matches: 1.4
}, {
    race_class: 'Listed Hcap Chs',
    races: 20,
    matches: 1.45
}, {
    race_class: 'Grp2',
    races: 219,
    matches: 1.4521
}, {
    race_class: 'Listed Hcap Hrd',
    races: 11,
    matches: 1.4545
}, {
    race_class: 'Grd3 Hcap Chs',
    races: 17,
    matches: 1.4706
}, {
    race_class: 'Grd1 Hrd',
    races: 42,
    matches: 1.4762
}, {
    race_class: 'Grp 1',
    races: 21,
    matches: 1.4762
}, {
    race_class: 'App Hcap',
    races: 105,
    matches: 1.4857
}, {
    race_class: 'Claim',
    races: 10,
    matches: 1.5
}, {
    race_class: 'Grd1 Chs',
    races: 58,
    matches: 1.5
}, {
    race_class: 'Listed Chs',
    races: 24,
    matches: 1.5
}, {
    race_class: 'Listed Hrd',
    races: 40,
    matches: 1.5
}, {
    race_class: 'Claim Hrd',
    races: 79,
    matches: 1.5063
}, {
    race_class: 'Grp1',
    races: 153,
    matches: 1.5163
}, {
    race_class: 'Mdn Hcap',
    races: 38,
    matches: 1.5263
}, {
    race_class: 'Hcap',
    races: 22400,
    matches: 1.5271
}, {
    race_class: 'Listed',
    races: 808,
    matches: 1.5285
}, {
    race_class: 'Mdn',
    races: 174,
    matches: 1.5287
}, {
    race_class: 'Grp3',
    races: 329,
    matches: 1.535
}, {
    race_class: 'Nov Hcap Hrd',
    races: 206,
    matches: 1.5388
}, {
    race_class: 'Nov Chs',
    races: 897,
    matches: 1.544
}, {
    race_class: 'Grd2 Chs',
    races: 42,
    matches: 1.5476
}, {
    race_class: 'Beg Chs',
    races: 379,
    matches: 1.5488
}, {
    race_class: 'Class Stks',
    races: 264,
    matches: 1.5492
}, {
    race_class: 'Grp 2',
    races: 40,
    matches: 1.55
}, {
    race_class: 'NHF',
    races: 1671,
    matches: 1.55
}, {
    race_class: 'Cond Stks',
    races: 592,
    matches: 1.5524
}, {
    race_class: 'Nov Hrd',
    races: 2331,
    matches: 1.553
}, {
    race_class: 'Claim Stks',
    races: 1049,
    matches: 1.5539
}, {
    race_class: 'Mdn NHF',
    races: 54,
    matches: 1.5556
}, {
    race_class: 'Grad Chs',
    races: 34,
    matches: 1.5588
}, {
    race_class: 'Mdn Hrd',
    races: 1070,
    matches: 1.5617
}, {
    race_class: 'Grp 3',
    races: 67,
    matches: 1.5672
}, {
    race_class: 'Nursery',
    races: 1425,
    matches: 1.5733
}, {
    race_class: 'Mdn Stks',
    races: 6781,
    matches: 1.5738
}, {
    race_class: 'Sell Stks',
    races: 902,
    matches: 1.5743
}, {
    race_class: 'Hcap Chs',
    races: 5639,
    matches: 1.5765
}, {
    race_class: 'Hcap Hrd',
    races: 5733,
    matches: 1.5784
}, {
    race_class: 'Hunt Chs',
    races: 506,
    matches: 1.587
}, {
    race_class: 'Sell Hcap',
    races: 17,
    matches: 1.5882
}, {
    race_class: 'Nov Hcap Chs',
    races: 439,
    matches: 1.5968
}, {
    race_class: 'Grd2 Nov Hrd',
    races: 10,
    matches: 1.6
}, {
    race_class: 'Sell Hrd',
    races: 293,
    matches: 1.6041
}, {
    race_class: 'Grd2 Hrd',
    races: 56,
    matches: 1.6071
}, {
    race_class: 'Hcap Stks',
    races: 75,
    matches: 1.6133
}, {
    race_class: 'Nov Stks',
    races: 178,
    matches: 1.6348
}, {
    race_class: 'Juv Hrd',
    races: 307,
    matches: 1.6384
}, {
    race_class: 'Stks',
    races: 88,
    matches: 1.6591
}, {
    race_class: 'Grd2 Nov Chs',
    races: 12,
    matches: 1.6667
}, {
    race_class: 'Chs',
    races: 31,
    matches: 1.7097
}, {
    race_class: 'Mdn Chs',
    races: 36,
    matches: 1.7222
}, {
    race_class: 'Nov Hunt Chs',
    races: 15,
    matches: 1.8
}, {
    race_class: 'Grp1 PA',
    races: 20,
    matches: 1.85
}, {
    race_class: 'Hcap PA',
    races: 28,
    matches: 1.9286
}];

const hourScores = [{
    hour: 20,
    races: 1072,
    matches: 1.4618
}, {
    hour: 21,
    races: 60,
    matches: 1.5167
}, {
    hour: 15,
    races: 11184,
    matches: 1.5396
}, {
    hour: 19,
    races: 3424,
    matches: 1.5429
}, {
    hour: 16,
    races: 8980,
    matches: 1.552
}, {
    hour: 17,
    races: 4788,
    matches: 1.5537
}, {
    hour: 14,
    races: 10943,
    matches: 1.5544
}, {
    hour: 18,
    races: 3938,
    matches: 1.5617
}, {
    hour: 13,
    races: 9398,
    matches: 1.5622
}, {
    hour: 12,
    races: 2254,
    matches: 1.5865
}, {
    hour: 11,
    races: 82,
    matches: 1.7073
}];

let balance = 20;

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
    db.knex.raw(`select distinct event_id, country, actual_off, course, distance, event from horse_racing_race where actual_off >= '2017-01-01' and actual_off < '2018-01-01' order by actual_off`)
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

        stake = 2.00;
        maxLiability = 1.12;

        race.venue = getVenueFromCourse(race.course);
        race.race_class = race.event.substr(race.event.indexOf(' ') + 1);

        const runners = yield db.knex.raw(`select distinct selection_id, selection, win_flag from horse_racing_race where event_id = ${race.event_id}`),
            spBetting = yield db.knex.raw(`select sum(pre_total_matched) as pre_total_matched, sum(pre_total_bets) as pre_total_bets from horse_racing_race where event_id = ${race.event_id}`),
            numberOfRunners = runners.rows.length,
            matches = yield db.knex.raw(`select distinct selection_id from horse_racing where event_id = ${race.event_id} and in_play = 'IP' and odds <= ${layPrice}`);

        const actualOff = new Date(race.actual_off),
            offDate = actualOff.getFullYear() + "-" + ("0" + (actualOff.getMonth() + 1)).slice(-2) + "-" + ("0" + actualOff.getDate()).slice(-2);

        for (let runner of runners.rows) {
            const sp = yield db.knex.raw(`select selection_id, odds from horse_racing where event_id = ${race.event_id} and selection_id = ${runner.selection_id} and in_play = 'PE' order by latest_taken desc, odds desc limit 1`);
            const minInPlay = yield db.knex.raw(`select selection_id, min(odds), win_flag from horse_racing where event_id = ${race.event_id} and selection_id = ${runner.selection_id} and in_play = 'IP' group by event_id, selection_id, win_flag`);

            runner.sp = sp.rows[0] ? parseFloat(sp.rows[0].odds) : null;

            if (minInPlay.rows[0]) {
                runner.min_in_play = minInPlay.rows[0].min;
            }

            /*const previousMatchedAndLost = yield db.knex.raw(`select count(1) as matched_and_lost from horse_racing_runner where selection_id = ${runner.selection_id} and min_in_play_odds <= 1.56 and fav_sp_odds > 1.56 + 0.08 and actual_off < '${offDate}' and win_flag = false`);

            const previousMatchedAndWon = yield db.knex.raw(`select count(1) as matched_and_won from horse_racing_runner where selection_id = ${runner.selection_id} and min_in_play_odds <= 1.56 and fav_sp_odds > 1.56 + 0.08 and actual_off < '${offDate}' and win_flag = true`);

            const lost = previousMatchedAndLost.rows[0] ? parseInt(previousMatchedAndLost.rows[0].matched_and_lost) : 0,
                won = previousMatchedAndWon.rows[0] ? parseInt(previousMatchedAndWon.rows[0].matched_and_won) : 0;

            runner.score = 1 + (lost / (lost + won));
            runner.won = won;
            runner.lost = lost;

            if (won === 0 && lost === 0) {
                runner.score = 1;
            }*/
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

        let totalScore = 0;

        /*let totalWins = 0,
            totalLosses = 0,
            horsesScore = layPrice;

        for (let runner of runners.rows) {
            totalWins += runner.won;
            totalLosses += runner.lost;
        }

        if (totalLosses > 0 || totalWins > 0) {
            horsesScore = 1 + (totalLosses / (totalLosses + totalWins));
        }*/

        /*        if (raceClassScore) {
                    console.log(`${raceClassScore.matches},${matches.rows.length}`);
                    totalScore = ((hourScore.matches + runnerScore.matches + distanceScore.matches + venueScore.matches + dayScore.matches + raceClassScore.matches) / 6.00);
                } else {
                    totalScore = ((hourScore.matches + runnerScore.matches + distanceScore.matches + venueScore.matches + dayScore.matches) / 5.00);


                }*/

        if (raceClassScore) {
            totalScore = ((distanceScore.matches + venueScore.matches + raceClassScore.matches) / 3.00);
        } else {
            totalScore = ((distanceScore.matches + venueScore.matches) / 2.00);
        }

        //console.log(`${totalScore},${matches.rows.length}`);


        /*let totalScore = 0;

        let trade = false;

        for (let runner of runners.rows) {
            totalScore += runner.score;
            if (runner.lost > (runner.won + 5)) {
                trade = true;
            }
            if ((runner.score > layPrice + 0.439) && runner.lost > 4) {
                trade = true;
                //console.log(runner);
            }

        }*/


        //console.log(totalScore);

        //totalScore = (totalScore / numberOfRunners);



        if ((favourite && favourite.sp && favourite.sp > layPrice + 0.08) && (totalScore > (layPrice - 0.0040))) {

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