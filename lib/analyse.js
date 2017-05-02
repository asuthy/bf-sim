'use strict';

const promise = require('bluebird'),
    db = require('./db'),
    _ = require('lodash'),
    logger = require('./logger');

module.exports = {

    analyseData: function(layPrice, excludeCourses, excludeMonths, excludeDistances, excludeRunners, excludeDays, excludeClasses) {
        return promise.coroutine(function*() {

            const whereFilter = `where min_in_play_odds <= ${layPrice} and course not in (${excludeCourses}) and runners not in (${excludeRunners}) and distance not in (${excludeDistances}) and date_part('month', actual_off) not in (${excludeMonths}) and date_part('dow', actual_off) not in (${excludeDays}) and race_class not in (${excludeClasses})`;

            logger.log('Performance by number of runners', 'info');
            const winnersByRunner = yield db.knex.raw(`select runners, count(1) as winners from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events where matches > 1 group by runners order by runners`);
            const losersByRunner = yield db.knex.raw(`select runners, count(1) as losers from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events where matches = 1 group by runners order by runners`);

            let results = [];

            for (let winner of winnersByRunner.rows) {
                const loser = _.find(losersByRunner.rows, {
                    runners: winner.runners
                });

                const winCount = winner.winners;
                const loseCount = (loser ? loser.losers : 0);
                const totalCount = parseInt(winCount) + parseInt(loseCount);
                const winnerPercent = ((winCount / totalCount) * 100);

                results.push({
                    runners: winner.runners,
                    races: totalCount,
                    winPercent: winnerPercent
                });
            }

            console.log(_.orderBy(results, 'winPercent'));

            logger.log('Performance by distance', 'info');
            const winnersByDistance = yield db.knex.raw(`select distance, count(1) as winners from (select event_id, distance, count(1) as matches from (select event_id, distance, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, distance) as events where matches > 1 group by distance order by distance`);
            const losersByDistance = yield db.knex.raw(`select distance, count(1) as losers from (select event_id, distance, count(1) as matches from (select event_id, distance, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, distance) as events where matches = 1 group by distance order by distance`);

            results = [];

            for (let winner of winnersByDistance.rows) {
                const loser = _.find(losersByDistance.rows, {
                    distance: winner.distance
                });

                const winCount = winner.winners;
                const loseCount = (loser ? loser.losers : 0);
                const totalCount = parseInt(winCount) + parseInt(loseCount);
                const winnerPercent = ((winCount / totalCount) * 100);

                results.push({
                    distance: winner.distance,
                    races: totalCount,
                    winPercent: winnerPercent
                });
            }

            console.log(_.orderBy(results, 'winPercent'));

            logger.log('Performance by course', 'info');
            const winnersByCourse = yield db.knex.raw(`select course, count(1) as winners from (select event_id, course, count(1) as matches from (select event_id, course, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, course) as events where matches > 1 group by course order by course`);
            const losersByCourse = yield db.knex.raw(`select course, count(1) as losers from (select event_id, course, count(1) as matches from (select event_id, course, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, course) as events where matches = 1 group by course order by course`);

            results = [];

            for (let winner of winnersByCourse.rows) {
                const loser = _.find(losersByCourse.rows, {
                    course: winner.course
                });

                const winCount = winner.winners;
                const loseCount = (loser ? loser.losers : 0);
                const totalCount = parseInt(winCount) + parseInt(loseCount);
                const winnerPercent = ((winCount / totalCount) * 100);

                results.push({
                    course: winner.course,
                    races: totalCount,
                    winPercent: winnerPercent
                });
            }

            console.log(_.orderBy(results, 'winPercent'));

            logger.log('Performance by month', 'info');
            const winnersByMonth = yield db.knex.raw(`select month, count(1) as winners from (select event_id, month, count(1) as matches from (select event_id, date_part('month', actual_off) as month, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, month) as events where matches > 1 group by month order by month`);
            const losersByMonth = yield db.knex.raw(`select month, count(1) as losers from (select event_id, month, count(1) as matches from (select event_id, date_part('month', actual_off) as month, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, month) as events where matches = 1 group by month order by month`);

            results = [];

            for (let winner of winnersByMonth.rows) {
                const loser = _.find(losersByMonth.rows, {
                    month: winner.month
                });

                const winCount = winner.winners;
                const loseCount = (loser ? loser.losers : 0);
                const totalCount = parseInt(winCount) + parseInt(loseCount);
                const winnerPercent = ((winCount / totalCount) * 100);

                results.push({
                    month: winner.month,
                    races: totalCount,
                    winPercent: winnerPercent
                });
            }

            console.log(_.orderBy(results, 'winPercent'));

            logger.log('Performance by day of week (0 = sun)', 'info');
            const winnersByDay = yield db.knex.raw(`select day, count(1) as winners from (select event_id, day, count(1) as matches from (select event_id, date_part('dow', actual_off) as day, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, day) as events where matches > 1 group by day order by day`);
            const losersByDay = yield db.knex.raw(`select day, count(1) as losers from (select event_id, day, count(1) as matches from (select event_id, date_part('dow', actual_off) as day, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, day) as events where matches = 1 group by day order by day`);

            results = [];

            for (let winner of winnersByDay.rows) {
                const loser = _.find(losersByDay.rows, {
                    day: winner.day
                });

                const winCount = winner.winners;
                const loseCount = (loser ? loser.losers : 0);
                const totalCount = parseInt(winCount) + parseInt(loseCount);
                const winnerPercent = ((winCount / totalCount) * 100);

                results.push({
                    day: winner.day,
                    races: totalCount,
                    winPercent: winnerPercent
                });
            }

            console.log(_.orderBy(results, 'winPercent'));

            logger.log('Performance by race class', 'info');
            const winnersByClass = yield db.knex.raw(`select race_class, count(1) as winners from (select event_id, race_class, count(1) as matches from (select event_id, race_class, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, race_class) as events where matches > 1 group by race_class order by race_class`);
            const losersByClass = yield db.knex.raw(`select race_class, count(1) as losers from (select event_id, race_class, count(1) as matches from (select event_id, race_class, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, race_class) as events where matches = 1 group by race_class order by race_class`);

            results = [];

            for (let winner of winnersByClass.rows) {
                const loser = _.find(losersByClass.rows, {
                    race_class: winner.race_class
                });

                const winCount = winner.winners;
                const loseCount = (loser ? loser.losers : 0);
                const totalCount = parseInt(winCount) + parseInt(loseCount);
                const winnerPercent = ((winCount / totalCount) * 100);

                results.push({
                    race_class: winner.race_class,
                    races: totalCount,
                    winPercent: winnerPercent
                });
            }

            console.log(_.orderBy(results, 'winPercent'));

            logger.log('Performance by country', 'info');
            const winnersByCountry = yield db.knex.raw(`select country, count(1) as winners from (select event_id, country, count(1) as matches from (select event_id, country, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, country) as events where matches > 1 group by country order by country`);
            const losersByCountry = yield db.knex.raw(`select country, count(1) as losers from (select event_id, country, count(1) as matches from (select event_id, country, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, country) as events where matches = 1 group by country order by country`);

            results = [];

            for (let winner of winnersByCountry.rows) {
                const loser = _.find(losersByCountry.rows, {
                    country: winner.country
                });

                const winCount = winner.winners;
                const loseCount = (loser ? loser.losers : 0);
                const totalCount = parseInt(winCount) + parseInt(loseCount);
                const winnerPercent = ((winCount / totalCount) * 100);

                results.push({
                    country: winner.country,
                    races: totalCount,
                    winPercent: winnerPercent
                });
            }

            console.log(_.orderBy(results, 'winPercent'));

            logger.log('Total Performance', 'info');
            const totalWinners = yield db.knex.raw(`select count(1) as winners from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events where matches > 1;`);
            const totalLosers = yield db.knex.raw(`select count(1) as losers from (select event_id, runners, count(1) as matches from (select event_id, runners, selection_id, min_in_play_odds from horse_racing_runner ${whereFilter}) as runners group by event_id, runners) as events where matches = 1;`);

            const winCount = totalWinners.rows[0].winners;
            const loseCount = totalLosers.rows[0].losers;
            const totalCount = parseInt(winCount) + parseInt(loseCount);
            const winnerPercent = ((winCount / totalCount) * 100).toFixed(2);

            const totalResult = {
                races: totalCount,
                winPercent: winnerPercent
            };

            console.log(totalResult);
        })();
    }
};