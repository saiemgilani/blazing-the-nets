export interface LeftRight<T> {
  left: T;
  right: T;
}

export interface Point {
  LOC_X: number;
  LOC_Y: number;
}

export interface Shot {
  TEAM_ID: number;
  GAME_ID: number;
  GAME_EVENT_ID: number | string;
  PLAYER_ID: number;
  SHOT_DISTANCE: number;
  LOC_X: number;
  LOC_Y: number;
  SHOT_MADE_FLAG: boolean;
}
