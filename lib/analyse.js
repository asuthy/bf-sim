'use strict';

const promise = require('bluebird'),
    db = require('./db'),
    _ = require('lodash'),
    logger = require('./logger');

module.exports = {

    analyseData: function(layPrice) {
        return promise.coroutine(function*() {
            let whereFilter,
                matchResults,
                results,
                favouriteLayOffset;

            // Get average matches for each odds
            /*for (layPrice = 1.01; layPrice < 2.01; layPrice += 0.01) {
                layPrice = parseFloat(layPrice.toFixed(2));
                whereFilter = `where min_in_play_odds <= ${layPrice} and fav_sp_odds > ${layPrice} + 0.1 and actual_off < '2017-01-01'`;

                matchResults = yield db.knex.raw(`select avg(matches) as matches, count(1) as races from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events`);

                for (let winner of matchResults.rows) {
                    console.log(`${parseFloat(layPrice).toFixed(2)}, ${parseFloat(winner.matches).toFixed(4)}, ${winner.races}, ${parseFloat(layPrice).toFixed(2) - parseFloat(winner.matches).toFixed(4)}`);
                }
            }
            return;*/

            // Get average matches for each favourite odds offset from lay price
            /*for (favouriteLayOffset = -1.56; favouriteLayOffset < 0; favouriteLayOffset += 0.01) {
                layPrice = parseFloat(layPrice.toFixed(2));
                whereFilter = `where min_in_play_odds <= ${layPrice} and fav_sp_odds > ${layPrice} + ${favouriteLayOffset} and actual_off < '2016-01-01'`;

                matchResults = yield db.knex.raw(`select avg(matches) as matches, count(1) as races from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events`);

                for (let winner of matchResults.rows) {
                    console.log(`${parseFloat(favouriteLayOffset).toFixed(2)}, ${parseFloat(winner.matches).toFixed(4)}, ${winner.races}, ${parseFloat(layPrice).toFixed(2) - parseFloat(winner.matches).toFixed(4)}`);
                }
            }
            return;*/

            layPrice = parseFloat(layPrice.toFixed(2));
            whereFilter = `where min_in_play_odds <= ${layPrice} and fav_sp_odds > ${layPrice} + 0.08 and actual_off < '2016-01-01'`;

            logger.log('Performance by number of runners', 'info');
            matchResults = yield db.knex.raw(`select runners, avg(matches) as matches, count(1) as races from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events group by runners order by runners`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    runners: winner.runners,
                    races: parseInt(winner.races),
                    matches: parseFloat(parseFloat(winner.matches).toFixed(4))
                });
            }

            console.log(_.filter(_.orderBy(results, 'matches'), function(result) {
                return result.races >= 1;
            }));

            logger.log('Performance by distance', 'info');
            matchResults = yield db.knex.raw(`select distance, avg(matches) as matches, count(1) as races from (select event_id, distance, count(1) as matches from (select event_id, distance, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, distance) as events group by distance order by distance`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    distance: winner.distance,
                    races: parseInt(winner.races),
                    matches: parseFloat(parseFloat(winner.matches).toFixed(4))
                });
            }

            console.log(_.filter(_.orderBy(results, 'matches'), function(result) {
                return result.races >= 1;
            }));

            logger.log('Performance by venue', 'info');
            matchResults = yield db.knex.raw(`select venue, avg(matches) as matches, count(1) as races from (select event_id, venue, count(1) as matches from (select event_id, venue, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, venue) as events group by venue order by venue`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    venue: winner.venue,
                    races: parseInt(winner.races),
                    matches: parseFloat(parseFloat(winner.matches).toFixed(4))
                });
            }

            console.log(_.filter(_.orderBy(results, 'matches'), function(result) {
                return result.races >= 1;
            }));


            logger.log('Performance by month', 'info');
            matchResults = yield db.knex.raw(`select month, avg(matches) as matches, count(1) as races from (select event_id, month, count(1) as matches from (select event_id, date_part('month', actual_off) as month, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, month) as events group by month order by month`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    month: winner.month,
                    races: parseInt(winner.races),
                    matches: parseFloat(parseFloat(winner.matches).toFixed(4))
                });
            }

            console.log(_.filter(_.orderBy(results, 'matches'), function(result) {
                return result.races >= 1;
            }));

            logger.log('Performance by day of week (0 = sun)', 'info');
            matchResults = yield db.knex.raw(`select day, avg(matches) as matches, count(1) as races from (select event_id, day, count(1) as matches from (select event_id, date_part('dow', actual_off) as day, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, day) as events group by day order by day`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    day: winner.day,
                    races: parseInt(winner.races),
                    matches: parseFloat(parseFloat(winner.matches).toFixed(4))
                });
            }

            console.log(_.filter(_.orderBy(results, 'matches'), function(result) {
                return result.races >= 1;
            }));


            logger.log('Performance by hour', 'info');
            matchResults = yield db.knex.raw(`select hour, avg(matches) as matches, count(1) as races from (select event_id, hour, count(1) as matches from (select event_id, date_part('hour', actual_off) as hour, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, hour) as events group by hour order by hour`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    hour: winner.hour,
                    races: parseInt(winner.races),
                    matches: parseFloat(parseFloat(winner.matches).toFixed(4))
                });
            }

            console.log(_.filter(_.orderBy(results, 'matches'), function(result) {
                return result.races >= 1;
            }));

            logger.log('Performance by race class', 'info');
            matchResults = yield db.knex.raw(`select race_class, avg(matches) as matches, count(1) as races from (select event_id, race_class, count(1) as matches from (select event_id, race_class, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, race_class) as events group by race_class order by race_class`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    race_class: winner.race_class,
                    races: parseInt(winner.races),
                    matches: parseFloat(parseFloat(winner.matches).toFixed(4))
                });
            }

            console.log(_.filter(_.orderBy(results, 'matches'), function(result) {
                return result.races >= 10;
            }));

            logger.log('Total Performance', 'info');
            matchResults = yield db.knex.raw(`select avg(matches) as matches, count(1) as races from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events`);

            results = [];

            for (let winner of matchResults.rows) {
                results.push({
                    races: winner.races,
                    matches: parseFloat(winner.matches).toFixed(2)
                });
            }

            console.log(results);
        })();
    }
};