import d3 from '../d3';

/**
 * Mutates data so all players have IDs. If they did not have an id,
 * the flag `phonyId` is added and set to true and a generated value
 * is put in as the `id`. The flag `hasStats` is set to false for
 * players with no id and set to true otherwise.
 */
function addInMissingPlayerIds(data) {
  data.players.forEach((player, i) => {
    if (player.id == null) {
      player.id = `pb_dnp${i}`;
      player.phonyId = true;
      player.hasStats = false;
    } else {
      player.hasStats = true;
    }
  });
}


/**
 * Creates a mapping from executive ID to executive
 */
function transformExecutives(data) {
  const players = data.players;

  const executives = {};
  players.forEach((player) => {
    const { executiveId, executive: executiveName, id: playerId, draftYear, draftPick } = player;
    if (!executives[executiveId]) {
      executives[executiveId] = {
        id: executiveId,
        name: executiveName,
        players: [playerId],
        draftPicks: [draftPick],
        draftYears: [draftYear],
      };
    } else {
      const executive = executives[executiveId];
      executive.players.push(playerId);
      executive.draftPicks.push(draftPick);
      executive.draftYears.push(draftYear);
    }
  });

  return { executives };
}

/**
 * Transforms the teams array to a mapping from ID
 */
function transformTeams(data) {
  const teams = d3.nest()
    .key(team => team.id)
    .rollup(teams => teams[0])
    .object(data.teams);

  return { teams };
}

/**
 * Transforms the players area to a mapping from ID
 */
function transformPlayers(data) {
  const players = d3.nest()
    .key(player => player.id)
    .rollup(players => players[0])
    .object(data.players);

  return { players };
}

/**
 * Transforms drafts to hold a collection of players and
 * executives for each year
 */
function transformDrafts(data) {
  const players = data.players;

  const drafts = {};
  players.forEach((player) => {
    const { executiveId, id: playerId, draftYear } = player;
    if (!drafts[draftYear]) {
      drafts[draftYear] = {
        year: draftYear,
        players: [playerId],
        executives: [executiveId],
      };
    } else {
      const draft = drafts[draftYear];
      draft.players.push(playerId);
      draft.executives.push(executiveId);
    }
  });

  return { drafts, draftYears: data.draftYears };
}

/**
 * Takes API results and organizes them.
 *
 * - adds an executives collection
 * - makes team by ID
 * - makes players by ID
 * - supplements draft information to link to players and executives by ID
 */
export default function transformResults(data) {
  return Object.assign({},
    addInMissingPlayerIds(data),
    transformExecutives(data),
    transformTeams(data),
    transformPlayers(data),
    transformDrafts(data)
  );
}
